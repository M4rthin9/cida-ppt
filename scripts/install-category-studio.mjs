import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import sharp from "sharp";
import { chromium } from "playwright";

const root = "content/category-banners/studio-v4";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const activeAssets = manifest.assets.filter((asset) => asset.slug === "fiberglass-and-wood");
assert.equal(activeAssets.length, 2);
for (const asset of manifest.assets) {
  const bytes = await readFile(asset.output);
  const meta = await sharp(bytes).metadata();
  assert.ok(meta.width >= 1400 && meta.height >= 1000);
  asset.width = meta.width;
  asset.height = meta.height;
  asset.sha256 = createHash("sha256").update(bytes).digest("hex");
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
if (!process.argv.includes("--apply")) {
  console.log(
    "Validated original-resolution banners. Only fiberglass and wood will be installed with --apply.",
  );
  process.exit(0);
}
const origin = new URL(process.env.AUTH_URL || "http://localhost:3000").origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
let report;
try {
  report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
report ??= {
  version: 4,
  origin,
  method: "Authenticated local CMS upload and category editor",
  actors: [],
  categories: [],
};
const persist = () =>
  writeFile(`${root}/installation.json`, JSON.stringify(report, null, 2) + "\n");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const verifyText = (actual, previous) => {
  for (const row of previous) {
    const saved = actual.find((text) => text.locale === row.locale);
    assert.ok(saved);
    for (const [field, value] of Object.entries(row)) assert.equal(saved[field] ?? "", value ?? "");
  }
  for (const row of actual.filter((text) => !previous.some((old) => old.locale === text.locale))) {
    for (const field of [
      "name",
      "description",
      "short_description",
      "seo_title",
      "seo_description",
    ])
      assert.equal(row[field] ?? "", "");
  }
};
const actor = randomUUID();
const email = `category-studio-${actor}@example.invalid`;
const password = randomBytes(32).toString("base64url") + "Aa1!";
let browser,
  created = false;
try {
  const productsBefore = await sql`select * from products order by id`;
  const galleriesBefore =
    await sql`select * from product_media order by product_id,sort_order,media_id`;
  const pending = [...new Set(activeAssets.map((a) => a.slug))].filter(
    (slug) => !report.categories.some((c) => c.slug === slug && c.completed),
  );
  if (pending.length) {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'Category studio import','editor',true)`;
    created = true;
    report.actors.push(actor);
    await persist();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.goto(`${origin}/admin/login`, { waitUntil: "networkidle" });
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${origin}/admin`);
    for (const slug of pending) {
      const [before] =
        await sql`select c.* from categories c join category_i18n t on t.category_id=c.id where t.slug=${slug} and t.locale='th'`;
      assert.ok(before);
      const textBefore =
        await sql`select locale,name,slug,description,short_description,seo_title,seo_description from category_i18n where category_id=${before.id} order by locale`;
      const previous = report.categories.find((c) => c.slug === slug);
      if (previous?.media.length === 2 && previous.media.every((m) => before[m.field] === m.id)) {
        verifyText(textBefore, previous.before_text);
        previous.completed = true;
        previous.saved_at = new Date().toISOString();
        await persist();
        console.log(`Verified already saved category: ${slug}`);
        continue;
      }
      const record = {
        id: before.id,
        slug,
        before,
        before_text: textBefore,
        media: [],
        completed: false,
      };
      report.categories = report.categories.filter((c) => c.slug !== slug);
      report.categories.push(record);
      await persist();
      await page.goto(`${origin}/admin/categories/${before.id}`, { waitUntil: "networkidle" });
      for (const [field, label, suffix] of [
        ["hero_media_id", "ภาพแบนเนอร์หมวดหมู่", "hero"],
        ["thumbnail_media_id", "ภาพพื้นหลัง Bento", "tile"],
      ]) {
        const asset = activeAssets.find((a) => a.key === `${slug}-${suffix}`);
        const buffer = await readFile(asset.output);
        const group = page.getByRole("group", { name: label, exact: true });
        const responsePromise = page.waitForResponse(
          (r) => r.url().endsWith("/api/admin/media") && r.request().method() === "POST",
        );
        await group.locator('input[type="file"]').setInputFiles({
          name: `${textBefore.find((t) => t.locale === "th").name} - สตูดิโอ ${suffix}.png`,
          mimeType: "image/png",
          buffer,
        });
        const response = await responsePromise;
        assert.equal(response.status(), 201);
        const { item } = await response.json();
        await group.locator(`.cms-media-list img[src*="${item.storage_key}"]`).first().waitFor();
        assert.deepEqual(
          await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "original.png")),
          buffer,
        );
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
      const [after] = await sql`select * from categories where id=${before.id}`;
      for (const [field, value] of Object.entries(before)) {
        if (
          [
            "hero_media_id",
            "thumbnail_media_id",
            "updated_by",
            "updated_at",
            "published_at",
          ].includes(field)
        )
          continue;
        assert.deepEqual(after[field], value, `${slug}: ${field} retained`);
      }
      for (const media of record.media) assert.equal(after[media.field], media.id);
      verifyText(
        await sql`select locale,name,slug,description,short_description,seo_title,seo_description from category_i18n where category_id=${before.id} order by locale`,
        textBefore,
      );
      record.completed = true;
      record.saved_at = new Date().toISOString();
      await persist();
      console.log(`Installed hero and tile: ${slug}`);
    }
  }
  assert.deepEqual(await sql`select * from products order by id`, productsBefore);
  assert.deepEqual(
    await sql`select * from product_media order by product_id,sort_order,media_id`,
    galleriesBefore,
  );
  assert.equal(
    report.categories.filter((c) => c.completed && c.slug === "fiberglass-and-wood").length,
    1,
  );
  report.products_and_galleries_unchanged = true;
  report.completed_at = new Date().toISOString();
  await persist();
} finally {
  if (created)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
