import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import sharp from "sharp";
import { chromium } from "playwright";

const root = "content/category-banners/studio-v4";
const manifest = JSON.parse(await readFile(`${root}/panorama-manifest.json`, "utf8"));
for (const asset of manifest.assets) {
  const bytes = await readFile(asset.output);
  const meta = await sharp(bytes).metadata();
  assert.ok(meta.width >= 768 && meta.height >= 768);
  asset.width = meta.width;
  asset.height = meta.height;
  asset.sha256 = createHash("sha256").update(bytes).digest("hex");
}
await writeFile(`${root}/panorama-manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
if (!process.argv.includes("--apply")) {
  console.log(
    "Validated panoramic and portrait category banners. Use --apply to replace only the fiberglass category hero.",
  );
  process.exit(0);
}
const origin = new URL(process.env.AUTH_URL || "http://localhost:3000").origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
const category = report.categories.find((c) => c.slug === "fiberglass-and-wood");
assert.ok(category);
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID(),
  email = `category-panorama-${actor}@example.invalid`;
const password = randomBytes(32).toString("base64url") + "Aa1!";
let browser,
  created = false;
const persist = () =>
  writeFile(`${root}/installation.json`, JSON.stringify(report, null, 2) + "\n");
try {
  const categoriesBefore = await sql`select * from categories order by id`;
  const textsBefore = await sql`select * from category_i18n order by category_id,locale`;
  const productsBefore = await sql`select * from products order by id`;
  const galleriesBefore =
    await sql`select * from product_media order by product_id,sort_order,media_id`;
  const before = categoriesBefore.find((c) => c.id === category.id);
  const desktop = manifest.assets.find((a) => a.key.endsWith("panorama"));
  const mobile = manifest.assets.find((a) => a.key.endsWith("portrait"));
  if (!category.panorama?.completed || before.hero_media_id !== category.panorama.hero.id) {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'Category panorama import','editor',true)`;
    created = true;
    report.actors.push(actor);
    category.panorama = {
      before,
      previous_hero: category.media.find((m) => m.field === "hero_media_id"),
      completed: false,
    };
    await persist();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.goto(`${origin}/admin/login`, { waitUntil: "networkidle" });
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${origin}/admin`);
    await page.goto(`${origin}/admin/categories/${category.id}`, { waitUntil: "networkidle" });
    const group = page.getByRole("group", { name: "ภาพแบนเนอร์หมวดหมู่", exact: true });
    const responsePromise = page.waitForResponse(
      (r) => r.url().endsWith("/api/admin/media") && r.request().method() === "POST",
    );
    const bytes = await readFile(desktop.output);
    await group.locator('input[type="file"]').setInputFiles({
      name: "ไฟเบอร์กลาส และ ไม้ - แบนเนอร์เต็มพื้นที่.png",
      mimeType: "image/png",
      buffer: bytes,
    });
    const response = await responsePromise;
    assert.equal(response.status(), 201);
    const { item } = await response.json();
    await group.locator(`.cms-media-list img[src*="${item.storage_key}"]`).first().waitFor();
    assert.deepEqual(
      await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "original.png")),
      bytes,
    );
    category.panorama.hero = {
      field: "hero_media_id",
      key: desktop.key,
      output: desktop.output,
      id: item.id,
      storage_key: item.storage_key,
      width: item.width,
      height: item.height,
    };
    await persist();
    await page.locator('.cms-save button[type="submit"]').click();
    await page.locator(".cms-success").waitFor();
    category.media = category.media.map((m) =>
      m.field === "hero_media_id" ? category.panorama.hero : m,
    );
  }
  const directory = path.join(process.env.MEDIA_DIR, category.panorama.hero.storage_key);
  const portrait = await readFile(mobile.output);
  await writeFile(path.join(directory, "category-mobile-v2-original.png"), portrait);
  await sharp(portrait)
    .webp({ quality: 95 })
    .toFile(path.join(directory, "category-mobile-v2.webp"));
  category.panorama.mobile = {
    key: mobile.key,
    output: mobile.output,
    url: `/media/${category.panorama.hero.storage_key}/category-mobile-v2.webp`,
    width: mobile.width,
    height: mobile.height,
  };
  assert.deepEqual(
    await readFile(path.join(directory, "category-mobile-v2-original.png")),
    portrait,
  );
  const categoriesAfter = await sql`select * from categories order by id`;
  for (const previous of categoriesBefore) {
    const after = categoriesAfter.find((c) => c.id === previous.id);
    if (previous.id !== category.id) assert.deepEqual(after, previous);
    else {
      assert.equal(after.hero_media_id, category.panorama.hero.id);
      for (const [field, value] of Object.entries(previous)) {
        if (["hero_media_id", "updated_at", "updated_by"].includes(field)) continue;
        assert.deepEqual(after[field], value);
      }
    }
  }
  const textsAfter = await sql`select * from category_i18n order by category_id,locale`;
  const visibleText = (rows) => [...rows].map(({ updated_at: _timestamp, ...row }) => row);
  assert.deepEqual(visibleText(textsAfter), visibleText(textsBefore));
  assert.deepEqual(await sql`select * from products order by id`, productsBefore);
  assert.deepEqual(
    await sql`select * from product_media order by product_id,sort_order,media_id`,
    galleriesBefore,
  );
  category.panorama.completed = true;
  category.panorama.saved_at = new Date().toISOString();
  await persist();
  console.log(
    "Installed full-width category hero and portrait rendition; homepage tile, other categories and all product galleries retained.",
  );
} finally {
  if (created)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
