import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import { chromium } from "playwright";

// This workbook-specific import uses the real login, upload API and product form.
// No direct product inserts, publishing, credential files or replacement of existing entries.
const directory = path.resolve("content/fiberglass-drafts");
const drafts = JSON.parse(await readFile(path.join(directory, "drafts.json"), "utf8"));
const photos = JSON.parse(
  await readFile(path.join(directory, "presentation/manifest.json"), "utf8"),
);
assert.equal(photos.source_sha256, drafts.source.sha256);
assert.ok(photos.original_pixels_verified);
const products = drafts.products.filter((p) => p.material_group === "fiberglass");
assert.equal(products.length, 29);
if (!process.argv.includes("--apply") || !process.argv.includes("--stock=available")) {
  console.log(
    "Ready: 29 fiberglass drafts, 30 original-preserving photos. Apply only after stock confirmation: node --env-file=.env scripts/import-fiberglass-catalogue.mjs --apply --stock=available",
  );
  process.exit(0);
}
const origin = new URL(process.env.AUTH_URL || "http://localhost:3000").origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "Local CMS only");
const reportPath = path.join(directory, "cms-import.json");
let report;
try {
  report = JSON.parse(await readFile(reportPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
report ??= {
  source_sha256: drafts.source.sha256,
  stock_confirmation: "Available now, confirmed by user",
  status: "draft",
  products: [],
  media: [],
  actors: [],
  excluded_wood_rows: [21, 25],
};
assert.equal(report.source_sha256, drafts.source.sha256);
const persist = () => writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID();
const email = `catalogue-import-${actor}@example.invalid`;
const password = randomBytes(32).toString("base64url") + "Aa1!";
let browser;
let actorCreated = false;
try {
  const [category] =
    await sql`select c.id from categories c join category_i18n t on t.category_id=c.id where t.slug=${drafts.category_slug} and t.locale='th' and c.deleted_at is null`;
  assert.ok(category, "Target category exists");
  for (const product of products) {
    const prior = report.products.find((p) => p.draft_key === product.draft_key);
    const existing =
      await sql`select product_id from product_i18n where slug=${product.slug} and locale='th'`;
    if (existing.length)
      assert.equal(
        existing[0].product_id,
        prior?.id,
        `Existing slug must not be overwritten: ${product.slug}`,
      );
    else assert.ok(!prior, `Reported product missing: ${product.slug}`);
    for (const photo of photos.photos.filter((p) => p.draft_key === product.draft_key)) {
      const source = await readFile(path.join(directory, photo.source));
      assert.equal(createHash("sha256").update(source).digest("hex"), photo.source_sha256);
      await readFile(path.join(directory, photo.file));
    }
  }
  if (report.products.length === products.length) {
    console.log("All 29 entries already imported; no duplicates created.");
  } else {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'Workbook catalogue import','editor',true)`;
    actorCreated = true;
    report.actors.push(actor);
    await persist();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(90000);
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(origin + "/admin/login", { waitUntil: "networkidle" });
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(origin + "/admin");
    for (const product of products) {
      if (report.products.some((p) => p.draft_key === product.draft_key)) continue;
      await page.goto(origin + "/admin/products/new", { waitUntil: "networkidle" });
      const fields = {
        name_th: product.name_th,
        name_en: product.name_en,
        slug: product.slug,
        short_description_th: product.short_description_th,
        description_th: product.description_th,
        materials: product.materials,
        dimensions: product.dimensions,
        weight: product.weight_kg ?? "",
        quantity: "",
        display_order: product.display_order,
      };
      for (const [name, value] of Object.entries(fields))
        await page.locator(`[name="${name}"]`).fill(String(value));
      await page.locator('[name="category_id"]').selectOption(category.id);
      await page.locator('[name="price_mode"]').selectOption("exact");
      await page.locator('[name="price"]').fill(String(product.price));
      await page.locator('[name="stock_status"]').selectOption("available");
      await page.locator('[name="status"]').selectOption("draft");
      const productPhotos = photos.photos.filter((p) => p.draft_key === product.draft_key);
      const mediaIds = [];
      for (const photo of productPhotos) {
        const responsePromise = page.waitForResponse(
          (r) => r.url().endsWith("/api/admin/media") && r.request().method() === "POST",
        );
        await page
          .locator('.cms-media input[type="file"]')
          .setInputFiles(path.join(directory, photo.file));
        const response = await responsePromise;
        assert.equal(response.status(), 201, `Upload row ${product.source.row}`);
        const { item } = await response.json();
        mediaIds.push(item.id);
        report.media.push({ ...photo, id: item.id, storage_key: item.storage_key });
        await persist();
        await page.waitForFunction(
          (count) => document.querySelectorAll(".cms-media-item").length === count,
          mediaIds.length,
        );
        // The media pipeline retains the exact lossless presentation file.
        assert.deepEqual(
          await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "original.png")),
          await readFile(path.join(directory, photo.file)),
        );
      }
      await page.locator('.cms-save button[type="submit"]').click();
      await page.waitForURL((url) => /\/admin\/products\/[0-9a-f-]+$/.test(url.pathname));
      const [saved] =
        await sql`select p.* from products p join product_i18n t on t.product_id=p.id where t.slug=${product.slug} and t.locale='th'`;
      assert.ok(saved);
      assert.equal(saved.status, "draft");
      assert.equal(saved.is_published, false);
      assert.equal(saved.stock_status, "available");
      assert.equal(Number(saved.price), product.price);
      assert.equal(saved.category_id, category.id);
      assert.equal(saved.quantity, null);
      const storedMedia =
        await sql`select media_id from product_media where product_id=${saved.id} order by sort_order`;
      assert.deepEqual(
        storedMedia.map((m) => m.media_id),
        mediaIds,
      );
      // Add workbook provenance alongside, not instead of, the form's audit entry.
      await sql`insert into audit_log(id,user_id,entity,entity_id,action,diff) values(${randomUUID()},${actor},'products',${saved.id},'workbook_import',${JSON.stringify({ source_sha256: drafts.source.sha256, row: product.source.row, draft_key: product.draft_key, stock_confirmed_by_user: "available", review_issues: product.review_issues, presentation: "original pixels; rotation and padding only" })})`;
      report.products.push({
        draft_key: product.draft_key,
        id: saved.id,
        name_th: product.name_th,
        source_row: product.source.row,
        slug: product.slug,
        price: product.price,
        media_ids: mediaIds,
        review_issues: product.review_issues,
      });
      await persist();
      console.log(`Created ${report.products.length}/29: ${product.name_th}`);
    }
  }
  for (const product of products) {
    const saved = report.products.find((p) => p.draft_key === product.draft_key);
    const [row] =
      await sql`select p.*,t.name,t.slug,t.body from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.id=${saved.id}`;
    assert.equal(row.name, product.name_th);
    assert.equal(Number(row.price), product.price);
    assert.equal(row.weight === null ? null : Number(row.weight), product.weight_kg);
    assert.equal(row.dimensions, product.dimensions);
    assert.equal(row.materials, product.materials);
    assert.equal(row.status, "draft");
    assert.equal(row.stock_status, "available");
    assert.equal(row.is_published, false);
  }
  report.completed_at = new Date().toISOString();
  report.verified_count = report.products.length;
  await persist();
  console.log("Verified all 29 draft products and source values. Nothing published.");
} finally {
  // Retain attribution in the audit log, but revoke and disable the import actor.
  if (actorCreated)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
