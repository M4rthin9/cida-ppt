import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import sharp from "sharp";
import { chromium } from "playwright";

const root = path.resolve("content/product-studio");
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const catalogue = manifest.assets.filter((a) => a.product_id);
const ids = [...new Set(catalogue.map((a) => a.product_id))];
assert.equal(ids.length, 29);
assert.equal(catalogue.length, 30);
const origin = new URL(process.env.AUTH_URL || "http://localhost:3000").origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const reportPath = path.join(root, "installation.json");
let report;
try {
  report = JSON.parse(await readFile(reportPath, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
report ??= {
  version: 1,
  origin,
  method: "Authenticated CMS upload and product editor; original media retained",
  actors: [],
  products: [],
};
const persist = () => writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
report.library ??= [];
const library = manifest.assets.filter((a) => a.library_only);
for (const asset of catalogue) {
  const bytes = await readFile(asset.output);
  const meta = await sharp(bytes).metadata();
  assert.ok(meta.width >= 1024 && meta.height >= 1024, `${asset.key}: sufficient resolution`);
  assert.ok(meta.hasAlpha, `${asset.key}: transparent PNG`);
  const stats = await sharp(bytes).stats();
  assert.equal(stats.channels[3].min, 0, `${asset.key}: actual alpha transparency`);
  assert.equal(
    createHash("sha256")
      .update(await readFile(asset.source))
      .digest("hex"),
    asset.source_sha256,
    `${asset.key}: source retained`,
  );
}
if (!process.argv.includes("--apply")) {
  console.log(
    "Ready: 30 transparent studio photos for 29 existing products. Use --apply to replace photos through the local CMS.",
  );
  process.exit(0);
}
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID();
const email = `product-photo-import-${actor}@example.invalid`;
const password = randomBytes(32).toString("base64url") + "Aa1!";
let browser,
  created = false;
try {
  if (
    report.products.every((p) => p.completed) &&
    report.products.length === 29 &&
    library.every((a) => report.library.some((m) => m.key === a.key))
  ) {
    console.log("All 29 product galleries and additional library photos already installed.");
  } else {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'Product studio photo import','editor',true)`;
    created = true;
    report.actors.push(actor);
    await persist();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(120000);
    await page.goto(`${origin}/admin/login`, { waitUntil: "networkidle" });
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${origin}/admin`);
    for (const id of ids) {
      if (report.products.some((p) => p.id === id && p.completed)) continue;
      const assets = catalogue
        .filter((a) => a.product_id === id)
        .sort((a, b) => a.variant - b.variant);
      const [before] = await sql`select * from products where id=${id}`;
      const beforeText =
        await sql`select locale,name,slug,short_desc,body,seo_title,seo_description from product_i18n where product_id=${id} order by locale`;
      const oldMedia =
        await sql`select pm.media_id,pm.sort_order,pm.is_primary,m.storage_key,m.filename from product_media pm join media m on m.id=pm.media_id where pm.product_id=${id} order by pm.sort_order`;
      assert.ok(before && before.is_published, `Existing published product: ${id}`);
      const record = {
        id,
        name: assets[0].product_name,
        slug: assets[0].slug,
        before,
        before_text: beforeText,
        previous_media: oldMedia,
        media: [],
        completed: false,
      };
      report.products = report.products.filter((p) => p.id !== id);
      report.products.push(record);
      await persist();
      await page.goto(`${origin}/admin/products/${id}`, { waitUntil: "networkidle" });
      while (await page.locator(".cms-media-item").count())
        await page
          .locator(".cms-media-item")
          .first()
          .getByRole("button", { name: "นำออก", exact: true })
          .click();
      for (const asset of assets) {
        const buffer = await readFile(asset.output);
        const name = `${asset.product_name.replace(/[\\/:*?"<>|]/g, "-")} - ภาพสตูดิโอ ${asset.variant + 1}.png`;
        const responsePromise = page.waitForResponse(
          (r) => r.url().endsWith("/api/admin/media") && r.request().method() === "POST",
        );
        await page
          .locator('.cms-media input[type="file"]')
          .setInputFiles({ name, mimeType: "image/png", buffer });
        const response = await responsePromise;
        assert.equal(response.status(), 201, `${asset.key}: upload`);
        const { item } = await response.json();
        record.media.push({
          key: asset.key,
          source: asset.source,
          output: asset.output,
          id: item.id,
          storage_key: item.storage_key,
          width: item.width,
          height: item.height,
        });
        await persist();
        await page.waitForFunction(
          (count) => document.querySelectorAll(".cms-media-item").length === count,
          record.media.length,
        );
        assert.deepEqual(
          await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "original.png")),
          buffer,
        );
        assert.ok(
          (
            await sharp(
              path.join(process.env.MEDIA_DIR, item.storage_key, "master.webp"),
            ).metadata()
          ).hasAlpha,
        );
      }
      await page.locator('.cms-save button[type="submit"]').click();
      await page.locator(".cms-success").waitFor();
      const [after] = await sql`select * from products where id=${id}`;
      for (const field of [
        "price",
        "sale_price",
        "price_mode",
        "stock_status",
        "quantity",
        "dimensions",
        "materials",
        "weight",
        "category_id",
        "sku",
        "status",
        "is_published",
        "is_featured",
        "is_new",
        "made_to_order",
        "lead_time",
        "sort_order",
      ])
        assert.deepEqual(after[field], before[field], `${record.name}: ${field} retained`);
      const afterText =
        await sql`select locale,name,slug,short_desc,body,seo_title,seo_description from product_i18n where product_id=${id} order by locale`;
      assert.deepEqual(afterText, beforeText, `${record.name}: product text retained`);
      const actual =
        await sql`select media_id from product_media where product_id=${id} order by sort_order`;
      assert.deepEqual(
        actual.map((m) => m.media_id),
        record.media.map((m) => m.id),
      );
      record.completed = true;
      record.saved_at = new Date().toISOString();
      await persist();
      console.log(
        `Installed ${report.products.filter((p) => p.completed).length}/29: ${record.name}`,
      );
    }
    for (const asset of library) {
      if (report.library.some((m) => m.key === asset.key)) continue;
      const buffer = await readFile(asset.output);
      const response = await page.request.post(`${origin}/api/admin/media`, {
        headers: { Origin: origin },
        multipart: {
          file: { name: `${asset.product_name} - ภาพสตูดิโอ.png`, mimeType: "image/png", buffer },
          alt: `${asset.product_name} ภาพสตูดิโอ`,
        },
      });
      assert.equal(response.status(), 201, `${asset.key}: library upload`);
      const { item } = await response.json();
      report.library.push({ key: asset.key, source: asset.source, output: asset.output, ...item });
      await persist();
      console.log(`Added library photo: ${asset.product_name}`);
    }
  }
  assert.equal(report.products.filter((p) => p.completed).length, 29);
  report.completed_at = new Date().toISOString();
  await persist();
} finally {
  if (created)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
