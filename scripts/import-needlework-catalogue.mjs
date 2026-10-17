import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import sharp from "sharp";
import { chromium } from "playwright";

const root = "content/needlework";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
assert.equal(manifest.products.length, 23);

assert.ok(manifest.price_confirmation);
for (const product of manifest.products) {
  const source = await readFile(product.source);
  assert.equal(createHash("sha256").update(source).digest("hex"), product.source_sha256);
  assert.equal(product.price, product.kind === "bag" ? 199 : 399);
  const bytes = await readFile(product.output);
  const meta = await sharp(bytes).metadata();
  const stats = await sharp(bytes).stats();
  assert.ok(meta.hasAlpha && meta.width >= 1024 && meta.height >= 1024);
  assert.equal(stats.channels[3].min, 0);
  product.output_width = meta.width;
  product.output_height = meta.height;
  product.output_sha256 = createHash("sha256").update(bytes).digest("hex");
  product.generation_status = "complete";
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
if (!process.argv.includes("--apply")) {
  console.log(
    "Validated 22 shirts at 399 THB and one tote at 199 THB with transparent studio photos. Use --apply to import.",
  );
  process.exit(0);
}
const origin = new URL(process.env.AUTH_URL || "http://localhost:3000").origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const reportPath = `${root}/installation.json`;
let report;
try {
  report = JSON.parse(await readFile(reportPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
report ??= {
  version: 1,
  origin,
  method: "Authenticated CMS product editor and media pipeline",
  catalogue_confirmation:
    "User supplied all designs and requested catalogue pricing and matching photography",
  price_confirmation: manifest.price_confirmation,
  actors: [],
  products: [],
};
const persist = () => writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID(),
  email = `needlework-import-${actor}@example.invalid`,
  password = randomBytes(32).toString("base64url") + "Aa1!";
let browser,
  actorCreated = false;
try {
  const [category] =
    await sql`select c.* from categories c join category_i18n t on t.category_id=c.id where t.slug=${manifest.category_slug} and t.locale='th' and c.deleted_at is null`;
  assert.ok(category?.is_published && category.is_enabled);
  const oldProducts =
    await sql`select * from products where category_id<>${category.id} order by id`;
  const oldGalleries =
    await sql`select pm.* from product_media pm join products p on p.id=pm.product_id where p.category_id<>${category.id} order by pm.product_id,pm.sort_order,pm.media_id`;
  const categoriesBefore = await sql`select * from categories order by id`;
  for (const product of manifest.products) {
    const prior = report.products.find((p) => p.key === product.key && p.completed);
    const existing =
      await sql`select product_id from product_i18n where slug=${product.slug} and locale='th'`;
    if (existing.length)
      assert.equal(
        existing[0].product_id,
        prior?.id,
        `Do not overwrite an existing product: ${product.slug}`,
      );
    else assert.ok(!prior, `Reported product exists: ${product.slug}`);
  }
  if (report.products.filter((p) => p.completed).length < 23) {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'Needlework catalogue import','editor',true)`;
    actorCreated = true;
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
    for (const product of manifest.products) {
      if (report.products.some((p) => p.key === product.key && p.completed)) continue;
      await page.goto(`${origin}/admin/products/new`, { waitUntil: "networkidle" });
      await page.locator('[name="price_mode"]').selectOption("exact");
      for (const [field, value] of Object.entries({
        name_th: product.name_th,
        name_en: "",
        slug: product.slug,
        short_description_th: product.short_description_th,
        description_th: product.description_th,
        materials: "",
        dimensions: "",
        weight: "",
        quantity: "",
        display_order: product.display_order,
        price: product.price,
        sale_price: "",
        sharing_price: "",
        sku: "",
        lead_time: "",
      }))
        await page.locator(`[name="${field}"]`).fill(String(value));
      await page.locator('[name="category_id"]').selectOption(category.id);
      await page.locator('[name="price_mode"]').selectOption("exact");
      await page.locator('[name="stock_status"]').selectOption("available");
      await page.locator('[name="status"]').selectOption("published");
      await page.locator('[name="made_to_order"]').uncheck();
      await page.locator('[name="is_featured"]').setChecked(product.is_featured);
      await page.locator('[name="is_new"]').uncheck();
      const buffer = await readFile(product.output);
      const responsePromise = page.waitForResponse(
        (r) => r.url().endsWith("/api/admin/media") && r.request().method() === "POST",
      );
      await page
        .locator('.cms-media input[type="file"]')
        .setInputFiles({ name: `${product.name_th}.png`, mimeType: "image/png", buffer });
      const response = await responsePromise;
      assert.equal(response.status(), 201);
      const { item } = await response.json();
      await page.waitForFunction(() => document.querySelectorAll(".cms-media-item").length === 1);
      assert.deepEqual(
        await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "original.png")),
        buffer,
      );
      await page.locator('.cms-save button[type="submit"]').click();
      await page.waitForURL((url) => /\/admin\/products\/[0-9a-f-]+$/.test(url.pathname));
      const [saved] =
        await sql`select p.* from products p join product_i18n t on t.product_id=p.id where t.slug=${product.slug} and t.locale='th'`;
      assert.ok(saved);
      assert.equal(saved.category_id, category.id);
      assert.equal(saved.status, "published");
      assert.equal(saved.is_published, true);
      assert.equal(saved.stock_status, "available");
      assert.equal(saved.price_mode, "exact");
      assert.equal(Number(saved.price), product.price);
      assert.equal(saved.quantity, null);
      assert.equal(saved.weight, null);
      assert.equal(saved.sale_price, null);
      assert.equal(saved.is_featured, product.is_featured);
      assert.equal(saved.sharing_price, null);
      assert.equal(saved.made_to_order, false);
      const [gallery] =
        await sql`select media_id from product_media where product_id=${saved.id} order by sort_order`;
      assert.equal(gallery.media_id, item.id);
      assert.equal(await page.locator('[name="sharing_price"]').inputValue(), "");
      assert.equal(Number(await page.locator('[name="price"]').inputValue()), product.price);
      assert.equal(await page.locator('[name="is_featured"]').isChecked(), product.is_featured);
      const [text] =
        await sql`select name,short_desc,body from product_i18n where product_id=${saved.id} and locale='th'`;
      assert.equal(text.name, product.name_th);
      report.products.push({
        key: product.key,
        id: saved.id,
        name: product.name_th,
        slug: product.slug,
        price: product.price,
        source: product.source,
        source_sha256: product.source_sha256,
        kind: product.kind,
        is_featured: product.is_featured,
        category_id: category.id,
        media: {
          id: item.id,
          storage_key: item.storage_key,
          output: product.output,
          width: item.width,
          height: item.height,
        },
        completed: true,
        saved_at: new Date().toISOString(),
      });
      await persist();
      console.log(
        `Published ${report.products.filter((p) => p.completed).length}/23: ${product.name_th} (${product.price} THB)`,
      );
    }
  }
  assert.deepEqual(
    await sql`select * from products where category_id<>${category.id} order by id`,
    oldProducts,
  );
  assert.deepEqual(
    await sql`select pm.* from product_media pm join products p on p.id=pm.product_id where p.category_id<>${category.id} order by pm.product_id,pm.sort_order,pm.media_id`,
    oldGalleries,
  );
  assert.deepEqual(await sql`select * from categories order by id`, categoriesBefore);
  assert.equal(report.products.filter((p) => p.completed).length, 23);
  report.previous_products_and_category_banners_unchanged = true;
  report.completed_at = new Date().toISOString();
  await persist();
} finally {
  if (actorCreated)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
