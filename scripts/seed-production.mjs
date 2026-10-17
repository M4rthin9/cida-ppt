import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, constants, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

assert.ok(
  process.env.DATABASE_URL && process.env.MEDIA_DIR,
  "DATABASE_URL and MEDIA_DIR are required",
);
const root = fileURLToPath(new URL("../content/production-seed/", import.meta.url));
const mediaRoot = path.resolve(process.env.MEDIA_DIR);
const seed = JSON.parse(await readFile(path.join(root, "catalogue.json"), "utf8"));
const tables = [
  "locales",
  "media",
  "media_i18n",
  "categories",
  "category_i18n",
  "products",
  "product_i18n",
  "product_media",
  "product_specs",
  "product_spec_i18n",
  "settings",
];
assert.equal(seed.version, 1);
assert.deepEqual(Object.keys(seed.tables), tables);
assert.equal(seed.tables.categories.length, 4);
assert.equal(seed.tables.products.length, 76);
const knownMedia = new Set(seed.tables.media.map((m) => m.storage_key));
assert.equal(knownMedia.size, seed.tables.media.length);
for (const file of seed.files) {
  assert.match(file.path, /^\d{4}\/\d{2}\/[a-f0-9-]{36}\/[\w.-]+\.(png|webp|avif|jpe?g)$/i);
  assert.ok(knownMedia.has(path.posix.dirname(file.path)));
  const bytes = await readFile(path.join(root, "media", file.path));
  assert.equal(bytes.length, file.bytes, `Incorrect file size: ${file.path}`);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    file.sha256,
    `Invalid image: ${file.path}`,
  );
}
for (const media of seed.tables.media) {
  assert.ok(seed.files.some((f) => f.path === `${media.storage_key}/master.webp`));
  assert.match(media.id, /^[a-f0-9-]{36}$/);
}
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
let copied = 0;
const inserted = {};
try {
  await sql.begin(async (tx) => {
    // Serialise seed runs; IDs and unique slugs remain stable across releases.
    await tx`select pg_advisory_xact_lock(421700004)`;
    for (const [table, foreign] of [
      ["category_i18n", "category_id"],
      ["product_i18n", "product_id"],
    ]) {
      for (const row of seed.tables[table]) {
        const [existing] =
          await tx`select ${tx(foreign)} from ${tx(table)} where locale=${row.locale} and slug=${row.slug}`;
        assert.ok(
          !existing || existing[foreign] === row[foreign],
          `Slug collision in ${table}: ${row.slug}`,
        );
      }
    }
    for (const row of seed.tables.media) {
      const [existing] = await tx`select id from media where storage_key=${row.storage_key}`;
      assert.ok(!existing || existing.id === row.id, "Media storage key collision");
    }
    for (const row of seed.tables.products.filter((p) => p.sku)) {
      const [existing] = await tx`select id from products where sku=${row.sku}`;
      assert.ok(!existing || existing.id === row.id, `SKU collision: ${row.sku}`);
    }
    const existing = {};
    for (const table of ["media", "categories", "products", "product_specs"])
      existing[table] = new Set((await tx`select id from ${tx(table)}`).map((r) => r.id));
    if (process.argv.includes("--dry-run")) {
      console.log(
        `Production seed valid: 4 categories, 76 products, ${seed.files.length} verified image files. No changes made.`,
      );
      return;
    }
    for (const file of seed.files) {
      const target = path.resolve(mediaRoot, file.path);
      assert.ok(target.startsWith(mediaRoot + path.sep));
      await mkdir(path.dirname(target), { recursive: true });
      try {
        await copyFile(path.join(root, "media", file.path), target, constants.COPYFILE_EXCL);
        copied++;
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        // Existing CMS files always win, including deliberately regenerated images.
      }
    }
    for (const table of tables) {
      let rows = seed.tables[table];
      const parents = {
        media_i18n: ["media", "media_id"],
        category_i18n: ["categories", "category_id"],
        product_i18n: ["products", "product_id"],
        product_media: ["products", "product_id"],
        product_specs: ["products", "product_id"],
        product_spec_i18n: ["product_specs", "spec_id"],
      };
      if (parents[table]) {
        const [parent, key] = parents[table];
        rows = rows.filter((r) => !existing[parent].has(r[key]));
      }
      inserted[table] = 0;
      for (const row of rows) {
        const value = { ...row };
        for (const field of ["body", "value"])
          if (value[field] !== undefined && value[field] !== null)
            value[field] = tx.json(value[field]);
        const result =
          await tx`insert into ${tx(table)} ${tx(value)} on conflict do nothing returning *`;
        inserted[table] += result.length;
      }
    }
    // Existing configuration-only installations can acquire missing backgrounds.
    // COALESCE preserves every image already selected by the administrator.
    for (const row of seed.tables.categories)
      if (existing.categories.has(row.id))
        await tx`update categories set hero_media_id=coalesce(hero_media_id,${row.hero_media_id}),thumbnail_media_id=coalesce(thumbnail_media_id,${row.thumbnail_media_id}) where id=${row.id} and deleted_at is null`;
    console.log(
      JSON.stringify({
        production_seed: "complete",
        inserted,
        copied_files: copied,
        existing_cms_content_preserved: true,
      }),
    );
  });
} finally {
  await sql.end();
}
