import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import sharp from "sharp";
import { chromium } from "playwright";

const root = "content/new-wreaths";
const origin = new URL(process.env.AUTH_URL).origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID();
const email = `wreath-covers-${actor}@example.invalid`;
const password = randomBytes(32).toString("base64url") + "Aa1!";
let browser;
let created = false;
try {
  const productsBefore = await sql`select * from products order by id`;
  const galleriesBefore =
    await sql`select * from product_media order by product_id,sort_order,media_id`;
  const [category] =
    await sql`select c.* from categories c join category_i18n t on t.category_id=c.id and t.locale='th' where t.slug='sharing-wreaths' and c.deleted_at is null`;
  assert.ok(category?.is_published);
  const otherCategories = await sql`select * from categories where id<>${category.id} order by id`;
  let report;
  try {
    report = JSON.parse(await readFile(`${root}/covers-installation.json`, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  report ??= { category_id: category.id, before: category, media: [], actors: [] };
  const persist = () =>
    writeFile(`${root}/covers-installation.json`, JSON.stringify(report, null, 2) + "\n");
  if (
    !report.completed ||
    !report.media.some(
      (m) => m.field === "hero_media_id" && m.output === `${root}/category-panorama-v2.png`,
    )
  ) {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'New wreath category covers','editor',true)`;
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
    await page.goto(`${origin}/admin/categories/${category.id}`, { waitUntil: "networkidle" });
    for (const [field, label, kind] of [
      ["hero_media_id", "ภาพแบนเนอร์หมวดหมู่", "panorama"],
      ["thumbnail_media_id", "ภาพพื้นหลัง Bento", "tile"],
    ]) {
      const output = `${root}/category-${kind}${kind === "panorama" ? "-v2" : ""}.png`;
      if (report.media.some((m) => m.field === field && m.output === output)) continue;
      const buffer = await readFile(output);
      const meta = await sharp(buffer).metadata();
      assert.ok(meta.width >= 1000 && meta.height >= 700);
      const group = page.getByRole("group", { name: label, exact: true });
      const responsePromise = page.waitForResponse(
        (r) => r.url().endsWith("/api/admin/media") && r.request().method() === "POST",
      );
      await group
        .locator('input[type="file"]')
        .setInputFiles({ name: `พวงหรีดรุ่นใหม่-${kind}.png`, mimeType: "image/png", buffer });
      const response = await responsePromise;
      assert.equal(response.status(), 201);
      const { item } = await response.json();
      await group.locator(`.cms-media-list img[src*="${item.storage_key}"]`).first().waitFor();
      assert.deepEqual(
        await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "original.png")),
        buffer,
      );
      report.media = report.media.filter((m) => m.field !== field);
      report.media.push({
        field,
        output,
        id: item.id,
        storage_key: item.storage_key,
        width: item.width,
        height: item.height,
      });
      await persist();
    }
    await page.locator('.cms-save button[type="submit"]').click();
    await page.locator(".cms-success").waitFor();
    const [saved] = await sql`select * from categories where id=${category.id}`;
    for (const m of report.media) assert.equal(saved[m.field], m.id);
    const hero = report.media.find((m) => m.field === "hero_media_id");
    const bytes = await readFile(`${root}/category-portrait.png`);
    const meta = await sharp(bytes).metadata();
    assert.ok(meta.width >= 768 && meta.height >= 1600);
    const directory = path.join(process.env.MEDIA_DIR, hero.storage_key);
    await writeFile(path.join(directory, "category-mobile-v2-original.png"), bytes);
    await sharp(bytes)
      .webp({ quality: 95 })
      .toFile(path.join(directory, "category-mobile-v2.webp"));
    report.mobile = {
      output: `${root}/category-portrait.png`,
      width: meta.width,
      height: meta.height,
      url: `/media/${hero.storage_key}/category-mobile-v2.webp`,
    };
    report.completed = true;
    report.saved_at = new Date().toISOString();
    await persist();
  }
  assert.deepEqual(await sql`select * from products order by id`, productsBefore);
  assert.deepEqual(
    await sql`select * from product_media order by product_id,sort_order,media_id`,
    galleriesBefore,
  );
  assert.deepEqual(
    await sql`select * from categories where id<>${category.id} order by id`,
    otherCategories,
  );
  console.log(
    "Installed wreath desktop, mobile and homepage covers; products, galleries and other categories preserved.",
  );
} finally {
  if (created)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
