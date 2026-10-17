import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import {
  SETTINGS,
  SETTING_KEYS,
  parseGlobal,
  parseLocalized,
} from "../src/lib/settings/registry.ts";

assert.ok(
  process.env.DATABASE_URL && process.env.MEDIA_DIR,
  "DATABASE_URL and MEDIA_DIR are required",
);
const root = path.resolve("content/production-seed");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const clean = (rows, seed = false) =>
  rows.map((row) => {
    const value = { ...row };
    for (const field of ["created_by", "updated_by", "uploaded_by", "created_at", "updated_at"])
      delete value[field];
    if (seed) value.is_seed = true;
    return value;
  });
try {
  const data = await sql.begin("isolation level repeatable read read only", async (tx) => {
    const categories =
      await tx`select * from categories where deleted_at is null and is_enabled and is_published order by sort_order,id`;
    const ids = categories.map((c) => c.id);
    const products =
      await tx`select * from products where category_id in ${tx(ids)} and deleted_at is null and is_published and published_at<=now() order by sort_order,id`;
    const pids = products.map((p) => p.id);
    const product_media =
      await tx`select * from product_media where product_id in ${tx(pids)} order by product_id,sort_order,media_id`;
    const product_specs =
      await tx`select * from product_specs where product_id in ${tx(pids)} order by product_id,sort_order,id`;
    const storedSettings = await tx`select key,locale,value from settings`;
    const locales = await tx`select * from locales order by sort_order,code`;
    const settings = [];
    for (const key of SETTING_KEYS) {
      settings.push({
        key,
        locale: "*",
        value: parseGlobal(
          key,
          storedSettings.find((r) => r.key === key && r.locale === "*")?.value,
        ),
      });
      if (SETTINGS[key].localized)
        for (const locale of locales)
          settings.push({
            key,
            locale: locale.code,
            value: parseLocalized(
              key,
              storedSettings.find((r) => r.key === key && r.locale === locale.code)?.value,
            ),
          });
    }
    const mids = new Set(product_media.map((r) => r.media_id));
    for (const c of categories)
      for (const field of ["hero_media_id", "thumbnail_media_id", "icon_media_id", "og_media_id"])
        if (c[field]) mids.add(c[field]);
    for (const p of products) if (p.og_media_id) mids.add(p.og_media_id);
    for (const setting of settings)
      for (const [key, value] of Object.entries(setting.value))
        if (key.endsWith("MediaId") && value) mids.add(value);
    const mediaIds = [...mids];
    const specIds = product_specs.map((s) => s.id);
    return {
      locales: clean(locales),
      media: clean(
        await tx`select * from media where id in ${tx(mediaIds)} and deleted_at is null order by id`,
        true,
      ),
      media_i18n: clean(
        await tx`select * from media_i18n where media_id in ${tx(mediaIds)} order by media_id,locale`,
      ),
      categories: clean(categories, true),
      category_i18n: clean(
        await tx`select * from category_i18n where category_id in ${tx(ids)} order by category_id,locale`,
      ),
      products: clean(products, true),
      product_i18n: clean(
        await tx`select * from product_i18n where product_id in ${tx(pids)} order by product_id,locale`,
      ),
      product_media: clean(product_media),
      product_specs: clean(product_specs),
      product_spec_i18n: specIds.length
        ? clean(
            await tx`select * from product_spec_i18n where spec_id in ${tx(specIds)} order by spec_id,locale`,
          )
        : [],
      settings,
    };
  });
  assert.equal(data.categories.length, 4);
  assert.equal(data.products.length, 76);
  assert.ok(data.categories.every((c) => c.hero_media_id && c.thumbnail_media_id));
  assert.equal(data.products.filter((p) => p.is_featured).length, 1);
  const featured = data.products.find((p) => p.is_featured);
  assert.ok(
    data.product_i18n.some(
      (p) => p.product_id === featured.id && p.locale === "th" && p.slug === "wreath-khao-phisuth",
    ),
  );
  const files = [];
  for (const media of data.media) {
    assert.match(media.storage_key, /^\d{4}\/\d{2}\/[a-f0-9-]{36}$/);
    const directory = path.resolve(process.env.MEDIA_DIR, media.storage_key);
    const names = await readdir(directory, { withFileTypes: true });
    assert.ok(names.some((f) => f.name === "master.webp"));
    for (const file of names) {
      assert.ok(
        file.isFile() && /\.(png|webp|avif|jpg|jpeg)$/i.test(file.name),
        "Only public image renditions belong in the seed",
      );
      const bytes = await readFile(path.join(directory, file.name));
      const relative = `${media.storage_key}/${file.name}`;
      const target = path.join(root, "media", relative);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(directory, file.name), target);
      files.push({
        path: relative,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
  }
  const manifest = {
    version: 1,
    generated_at: new Date().toISOString(),
    description:
      "Approved real catalogue, public website settings and matching media. No accounts, credentials, sessions, inquiries, analytics or audit history.",
    counts: Object.fromEntries(Object.entries(data).map(([name, rows]) => [name, rows.length])),
    tables: data,
    files,
  };
  const keep = new Set(files.map((f) => f.path));
  const mediaFixture = path.resolve(root, "media");
  async function removeUnreferenced(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.resolve(directory, entry.name);
      assert.ok(file.startsWith(mediaFixture + path.sep));
      assert.ok(!entry.isSymbolicLink(), "Seed image directories must not contain symlinks");
      if (entry.isDirectory()) await removeUnreferenced(file);
      else if (!keep.has(path.relative(mediaFixture, file).split(path.sep).join("/"))) {
        assert.ok(entry.isFile() && /\.(png|webp|avif|jpe?g)$/i.test(entry.name));
        await unlink(file);
      }
    }
  }
  await removeUnreferenced(mediaFixture);
  await writeFile(path.join(root, "catalogue.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    JSON.stringify({
      categories: data.categories.length,
      products: data.products.length,
      media: data.media.length,
      files: files.length,
      bytes: files.reduce((n, f) => n + f.bytes, 0),
      output: "content/production-seed/catalogue.json",
    }),
  );
} finally {
  await sql.end();
}
