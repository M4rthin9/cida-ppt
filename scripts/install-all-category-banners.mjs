import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import sharp from "sharp";
import { chromium } from "playwright";

const root = "content/category-banners/all-categories";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
assert.equal(manifest.assets.length, 9);
for (const a of manifest.assets) {
  for (const ref of a.reference_hashes)
    assert.equal(
      createHash("sha256")
        .update(await readFile(ref.source))
        .digest("hex"),
      ref.sha256,
    );
  const bytes = await readFile(a.output),
    meta = await sharp(bytes).metadata();
  if (a.kind === "panorama")
    assert.ok(meta.width >= 1800 && meta.height >= 700 && meta.width / meta.height > 2);
  else if (a.kind === "portrait")
    assert.ok(meta.width >= 768 && meta.height >= 1600 && meta.width / meta.height < 0.6);
  else assert.ok(meta.width >= 1200 && meta.height >= 900);
  a.width = meta.width;
  a.height = meta.height;
  a.sha256 = createHash("sha256").update(bytes).digest("hex");
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
if (!process.argv.includes("--apply")) {
  console.log(
    "Validated nine category assets. Use --apply to complete photographic banners for all four categories.",
  );
  process.exit(0);
}
const origin = new URL(process.env.AUTH_URL || "http://localhost:3000").origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
let report;
try {
  report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
report ??= {
  version: 1,
  origin,
  method: "Authenticated CMS category editor and normal media pipeline",
  scope: manifest.scope,
  actors: [],
  categories: [],
};
const persist = () =>
  writeFile(`${root}/installation.json`, JSON.stringify(report, null, 2) + "\n");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID(),
  email = `all-banners-${actor}@example.invalid`,
  password = randomBytes(32).toString("base64url") + "Aa1!";
let browser,
  created = false;
const textFields = [
  "locale",
  "name",
  "slug",
  "description",
  "short_description",
  "seo_title",
  "seo_description",
];
const visibleTexts = (rows) =>
  rows
    .filter(
      (r) =>
        r.locale === "th" ||
        ["name", "description", "short_description", "seo_title", "seo_description"].some(
          (f) => r[f],
        ),
    )
    .map((r) => Object.fromEntries(textFields.map((f) => [f, r[f] ?? ""])));
try {
  const productsBefore = await sql`select * from products order by id`;
  const galleriesBefore =
    await sql`select * from product_media order by product_id,sort_order,media_id`;
  const categoriesBefore = await sql`select * from categories order by id`;
  const textsBefore = await sql`select * from category_i18n order by category_id,locale`;
  const slugs = [...new Set(manifest.assets.map((a) => a.slug))];
  const pending = slugs.filter(
    (slug) =>
      !report.categories.some(
        (c) =>
          c.slug === slug &&
          c.completed &&
          c.media.every(
            (m) =>
              m.output ===
              manifest.assets.find(
                (a) =>
                  a.slug === slug && a.kind === (m.field === "hero_media_id" ? "panorama" : "tile"),
              )?.output,
          ),
      ),
  );
  if (pending.length) {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'All category banner import','editor',true)`;
    created = true;
    report.actors.push(actor);
    await persist();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(90000);
    await page.goto(`${origin}/admin/login`, { waitUntil: "networkidle" });
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${origin}/admin`);
    for (const slug of pending) {
      const [before] =
        await sql`select c.* from categories c join category_i18n t on t.category_id=c.id and t.locale='th' where t.slug=${slug} and c.deleted_at is null`;
      assert.ok(before?.is_published && before.is_enabled);
      const previousText = textsBefore.filter((t) => t.category_id === before.id);
      const record = {
        id: before.id,
        slug,
        before,
        before_text: previousText,
        media: [...(report.categories.find((c) => c.slug === slug)?.media ?? [])],
        completed: false,
      };
      report.categories = report.categories.filter((c) => c.slug !== slug);
      report.categories.push(record);
      await persist();
      await page.goto(`${origin}/admin/categories/${before.id}`, { waitUntil: "networkidle" });
      for (const [field, label, kind] of [
        ["hero_media_id", "ภาพแบนเนอร์หมวดหมู่", "panorama"],
        ["thumbnail_media_id", "ภาพพื้นหลัง Bento", "tile"],
      ]) {
        const asset = manifest.assets.find((a) => a.slug === slug && a.kind === kind),
          buffer = await readFile(asset.output);
        if (record.media.some((m) => m.field === field && m.output === asset.output)) continue;
        const group = page.getByRole("group", { name: label, exact: true });
        const responsePromise = page.waitForResponse(
          (r) => r.url().endsWith("/api/admin/media") && r.request().method() === "POST",
        );
        await group
          .locator('input[type="file"]')
          .setInputFiles({ name: `${asset.name} - ${kind}.png`, mimeType: "image/png", buffer });
        const response = await responsePromise;
        assert.equal(response.status(), 201);
        const { item } = await response.json();
        await group.locator(`.cms-media-list img[src*="${item.storage_key}"]`).first().waitFor();
        assert.deepEqual(
          await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "original.png")),
          buffer,
        );
        record.media = record.media.filter((m) => m.field !== field);
        record.media.push({
          field,
          key: asset.key,
          output: asset.output,
          id: item.id,
          storage_key: item.storage_key,
          width: item.width,
          height: item.height,
        });
        await persist();
      }
      await page.locator('.cms-save button[type="submit"]').click();
      await page.locator(".cms-success").waitFor();
      const [saved] = await sql`select * from categories where id=${before.id}`;
      for (const m of record.media) assert.equal(saved[m.field], m.id);
      for (const [field, value] of Object.entries(before)) {
        if (
          [
            "hero_media_id",
            "thumbnail_media_id",
            "updated_at",
            "updated_by",
            "published_at",
          ].includes(field)
        )
          continue;
        assert.deepEqual(saved[field], value, `${slug}: preserve ${field}`);
      }
      assert.deepEqual(
        visibleTexts(
          await sql`select * from category_i18n where category_id=${before.id} order by locale`,
        ),
        visibleTexts(previousText),
      );
      record.completed = true;
      record.saved_at = new Date().toISOString();
      await persist();
      console.log(`Installed full-width hero and homepage photograph: ${slug}`);
    }
  }
  for (const record of report.categories) {
    const hero = record.media.find((m) => m.field === "hero_media_id"),
      asset = manifest.assets.find((a) => a.slug === record.slug && a.kind === "portrait");
    const directory = path.join(process.env.MEDIA_DIR, hero.storage_key),
      bytes = await readFile(asset.output);
    await writeFile(path.join(directory, "category-mobile-v2-original.png"), bytes);
    await sharp(bytes)
      .webp({ quality: 95 })
      .toFile(path.join(directory, "category-mobile-v2.webp"));
    record.mobile = {
      key: asset.key,
      output: asset.output,
      url: `/media/${hero.storage_key}/category-mobile-v2.webp`,
      width: asset.width,
      height: asset.height,
    };
    assert.deepEqual(
      await readFile(path.join(directory, "category-mobile-v2-original.png")),
      bytes,
    );
  }
  const [fiberglass] =
    await sql`select c.*,h.storage_key hero_key,th.storage_key tile_key from categories c join category_i18n t on t.category_id=c.id and t.locale='th' join media h on h.id=c.hero_media_id join media th on th.id=c.thumbnail_media_id where t.slug='fiberglass-and-wood'`;
  assert.ok(fiberglass);
  report.reused_category = {
    id: fiberglass.id,
    slug: "fiberglass-and-wood",
    name: "ไฟเบอร์กลาส และ ไม้",
    hero: {
      id: fiberglass.hero_media_id,
      storage_key: fiberglass.hero_key,
      output: manifest.reused_category.panorama,
    },
    tile: {
      id: fiberglass.thumbnail_media_id,
      storage_key: fiberglass.tile_key,
      output: manifest.reused_category.tile,
    },
    mobile: {
      url: `/media/${fiberglass.hero_key}/category-mobile-v2.webp`,
      output: manifest.reused_category.portrait,
    },
  };
  const targetIds = report.categories.map((c) => c.id);
  for (const before of categoriesBefore.filter((c) => !targetIds.includes(c.id))) {
    const [saved] = await sql`select * from categories where id=${before.id}`;
    assert.deepEqual(saved, before);
  }
  assert.deepEqual(await sql`select * from products order by id`, productsBefore);
  assert.deepEqual(
    await sql`select * from product_media order by product_id,sort_order,media_id`,
    galleriesBefore,
  );
  report.products_galleries_and_fiberglass_unchanged = true;
  report.completed_at = new Date().toISOString();
  await persist();
  console.log(
    "All four categories now have panoramic, mobile and homepage photographs; product data remains unchanged.",
  );
} finally {
  if (created)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
