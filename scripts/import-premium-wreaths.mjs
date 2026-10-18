import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import sharp from "sharp";
import { chromium } from "playwright";

const root = "content/new-wreaths";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
assert.equal(manifest.products.length, 6);

assert.ok(manifest.confirmation);
for (const product of manifest.products) {
  assert.match(product.name_th, /[\u0e00-\u0e7f]/);
  const source = await readFile(product.source);
  assert.equal(createHash("sha256").update(source).digest("hex"), product.source_sha256);
  assert.equal(product.price, 5000);
  assert.equal(product.sharing_price, 2000);
  const bytes = await readFile(product.output);
  const meta = await sharp(bytes).metadata();
  assert.ok(meta.width >= 1000 && meta.height >= 1400);
  product.output_width = meta.width;
  product.output_height = meta.height;
  product.output_sha256 = createHash("sha256").update(bytes).digest("hex");
  product.generation_status = "complete";
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
if (!process.argv.includes("--apply")) {
  console.log(
    "Validated six new featured wreaths, original product photos, sharing price 2000 THB and outright price 5000 THB. Use --apply for the confirmed import.",
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
  catalogue_confirmation: manifest.confirmation,
  price_confirmation: manifest.confirmation,
  actors: [],
  products: [],
};
const persist = () => writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID(),
  email = `premium-wreath-import-${actor}@example.invalid`,
  password = randomBytes(32).toString("base64url") + "Aa1!";
let browser,
  actorCreated = false;
try {
  const [category] =
    await sql`select c.* from categories c join category_i18n t on t.category_id=c.id where t.slug=${manifest.category_slug} and t.locale='th' and c.deleted_at is null`;
  assert.ok(category?.is_published && category.is_enabled);
  const oldProducts =
    await sql`select * from products where id not in (select product_id from product_i18n where locale='th' and slug in ${sql(manifest.products.map((p) => p.slug))}) order by id`;
  const oldGalleries =
    await sql`select pm.* from product_media pm join products p on p.id=pm.product_id where p.id not in (select product_id from product_i18n where locale='th' and slug in ${sql(manifest.products.map((p) => p.slug))}) order by pm.product_id,pm.sort_order,pm.media_id`;
  const categoriesBefore = await sql`select * from categories order by id`;
  const [previousFeatured] =
    await sql`select p.* from products p join product_i18n t on t.product_id=p.id and t.locale='th' where t.slug='wreath-khao-phisuth'`;
  assert.ok(previousFeatured);
  const textUpdates = new Set();
  const mediaUpdates = new Set();
  for (const product of manifest.products) {
    const prior = report.products.find((p) => p.key === product.key && p.completed);
    const existing =
      await sql`select t.product_id,t.name,t.short_desc,p.sort_order from product_i18n t join products p on p.id=t.product_id where t.slug=${product.slug} and t.locale='th'`;
    if (existing.length)
      assert.equal(
        existing[0].product_id,
        prior?.id,
        `Do not overwrite an existing product: ${product.slug}`,
      );
    else assert.ok(!prior, `Reported product exists: ${product.slug}`);
    if (prior) {
      const [caption] =
        await sql`select alt from media_i18n where media_id=${prior.media.id} and locale='th'`;
      if (caption?.alt !== product.name_th) mediaUpdates.add(product.key);
    }
    if (
      existing.length &&
      (existing[0].name !== product.name_th ||
        existing[0].short_desc !== product.short_description_th ||
        existing[0].sort_order !== product.display_order)
    )
      textUpdates.add(product.key);
  }
  if (
    report.products.filter((p) => p.completed).length < 6 ||
    textUpdates.size ||
    mediaUpdates.size ||
    previousFeatured.sort_order < 6
  ) {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'New featured wreath import','editor',true)`;
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
    for (const product of [...manifest.products].reverse()) {
      const prior = report.products.find((p) => p.key === product.key && p.completed);
      if (prior) {
        if (textUpdates.has(product.key)) {
          await page.goto(`${origin}/admin/products/${prior.id}`, { waitUntil: "networkidle" });
          for (const field of ["name_th", "short_description_th", "description_th"])
            await page.locator(`[name="${field}"]`).fill(product[field]);
          await page.locator('[name="display_order"]').fill(String(product.display_order));
          await page.locator('.cms-save button[type="submit"]').click();
          await page.locator(".cms-success").waitFor();
          const [text] =
            await sql`select name,short_desc from product_i18n where product_id=${prior.id} and locale='th'`;
          assert.equal(text.name, product.name_th);
          assert.equal(text.short_desc, product.short_description_th);
          prior.name = product.name_th;
          await persist();
        }
        if (mediaUpdates.has(product.key)) {
          await page.goto(`${origin}/admin/media/${prior.media.id}`, { waitUntil: "networkidle" });
          await page.locator('[name="alt"]').fill(product.name_th);
          await page.getByRole("button", { name: "บันทึก", exact: true }).click();
          await page.getByText("บันทึกเรียบร้อยแล้ว", { exact: true }).waitFor();
          const [caption] =
            await sql`select alt from media_i18n where media_id=${prior.media.id} and locale='th'`;
          assert.equal(caption.alt, product.name_th);
        }
        continue;
      }
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
        sharing_price: product.sharing_price,
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
      assert.equal(Number(saved.sharing_price), product.sharing_price);
      assert.equal(saved.made_to_order, false);
      const [gallery] =
        await sql`select media_id from product_media where product_id=${saved.id} order by sort_order`;
      assert.equal(gallery.media_id, item.id);
      assert.equal(Number(await page.locator('[name="sharing_price"]').inputValue()), 2000);
      assert.equal(Number(await page.locator('[name="price"]').inputValue()), 5000);
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
        sharing_price: product.sharing_price,
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
        `Published ${report.products.filter((p) => p.completed).length}/6: ${product.name_th} (${product.price} THB)`,
      );
    }
    if (previousFeatured.sort_order < 6) {
      await page.goto(`${origin}/admin/products/${previousFeatured.id}`, {
        waitUntil: "networkidle",
      });
      await page.locator('[name="display_order"]').fill("6");
      await page.locator('.cms-save button[type="submit"]').click();
      await page.locator(".cms-success").waitFor();
    }
  }
  const [savedPreviousFeatured] = await sql`select * from products where id=${previousFeatured.id}`;
  const expectedOldProducts = oldProducts.map((row) =>
    row.id === previousFeatured.id
      ? {
          ...row,
          sort_order: Math.max(6, previousFeatured.sort_order),
          ...Object.fromEntries(
            ["updated_at", "updated_by", "published_at"].map((field) => [
              field,
              savedPreviousFeatured[field],
            ]),
          ),
        }
      : row,
  );
  assert.deepEqual(
    Array.from(
      await sql`select * from products where id not in (select product_id from product_i18n where locale='th' and slug in ${sql(manifest.products.map((p) => p.slug))}) order by id`,
    ),
    expectedOldProducts,
  );
  assert.deepEqual(
    await sql`select pm.* from product_media pm join products p on p.id=pm.product_id where p.id not in (select product_id from product_i18n where locale='th' and slug in ${sql(manifest.products.map((p) => p.slug))}) order by pm.product_id,pm.sort_order,pm.media_id`,
    oldGalleries,
  );
  assert.deepEqual(await sql`select * from categories order by id`, categoriesBefore);
  assert.equal(report.products.filter((p) => p.completed).length, 6);
  report.previous_prices_galleries_and_category_banners_preserved = true;
  report.previous_featured_wreath_follows_new_six = true;
  report.completed_at = new Date().toISOString();
  await persist();
} finally {
  if (actorCreated)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
