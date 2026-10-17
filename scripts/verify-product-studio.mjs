import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import postgres from "postgres";
import sharp from "sharp";
import path from "node:path";

const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
const report = JSON.parse(await readFile("content/product-studio/installation.json", "utf8"));
assert.equal(report.products.filter((p) => p.completed).length, 29);
const output = "test-results/product-studio";
await mkdir(output, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
let loaded = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (error) => errors.push(error.message));
  for (const product of report.products) {
    const response = await page.goto(`${origin}/products/${encodeURIComponent(product.slug)}`, {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("main h1").innerText(), product.name);
    for (const [i, media] of product.media.entries()) {
      if (i > 0) await page.getByRole("button", { name: `ดูภาพที่ ${i + 1}`, exact: true }).click();
      const image = page.locator(".v-gallery-main img");
      await image.evaluate((img) => img.decode());
      const source = new URL(await image.getAttribute("src"), origin).searchParams.get("url");
      assert.equal(source, `/media/${media.storage_key}/master.webp`);
      assert.equal(new URL(await image.getAttribute("src"), origin).searchParams.get("q"), "90");
      assert.ok(await image.evaluate((img) => img.naturalWidth > 0));
      assert.equal(await image.evaluate((img) => getComputedStyle(img).objectFit), "contain");
      const master = await sharp(
        path.join(process.env.MEDIA_DIR, media.storage_key, "master.webp"),
      ).metadata();
      assert.ok(master.hasAlpha && master.width >= 1024);
      loaded++;
    }
  }
  const seen = new Set();
  for (let index = 1; index <= 3; index++) {
    await page.goto(`${origin}/products/category/fiberglass-and-wood?page=${index}`, {
      waitUntil: "networkidle",
    });
    for (const image of await page.locator(".v-product-image img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
      const url = new URL(await image.getAttribute("src"), origin).searchParams.get("url");
      assert.ok(
        report.products.some((p) => url === `/media/${p.media[0].storage_key}/master.webp`),
      );
      seen.add(url);
    }
    if (index === 1)
      await page.locator(".v-product-grid").screenshot({
        path: `${output}/catalog-desktop.png`,
        style: ".v-header { visibility: hidden; }",
      });
  }
  assert.equal(seen.size, 29);
  const multi = report.products.find((p) => p.media.length > 1);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/products", `/products/${encodeURIComponent(multi.slug)}`]) {
      await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (route === "/products") {
        for (const img of await page.locator(".v-product-image img").all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate((img) => img.decode());
        }
      } else {
        await page.getByRole("button", { name: "ดูภาพที่ 2", exact: true }).click();
        await page.locator(".v-gallery-main img").evaluate((img) => img.decode());
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);
      await page.screenshot({
        path: `${output}/${route === "/products" ? "catalog" : "gallery"}-${width}.png`,
        fullPage: true,
      });
    }
    console.log(`PASS studio catalogue and gallery at ${width}px`);
  }
  const actors = await sql`select id,is_active from users where id in ${sql(report.actors)}`;
  assert.ok(actors.every((a) => !a.is_active));
  assert.deepEqual(errors, []);
  await writeFile(
    "content/product-studio/verification.json",
    JSON.stringify(
      {
        verified_at: new Date().toISOString(),
        origin,
        products: 29,
        gallery_images: loaded,
        catalogue_images: seen.size,
        responsive_widths: [320, 390, 768, 1440],
        master_transparency: "verified",
        optimizer_quality: 90,
        temporary_actors_disabled: true,
        runtime_errors: errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS ${report.products.length} product pages, ${loaded} transparent gallery images and 29 catalogue replacements.`,
  );
} finally {
  await browser.close();
  await sql.end();
}
