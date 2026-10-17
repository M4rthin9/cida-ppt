import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import postgres from "postgres";
import sharp from "sharp";
import path from "node:path";

const root = "content/artificial-flowers";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
const screenshots = "test-results/artificial-flowers";
await mkdir(screenshots, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
let loaded = 0;
try {
  assert.equal(report.products.filter((p) => p.completed).length, 13);
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (error) => errors.push(error.message));
  for (const product of manifest.products) {
    const entry = report.products.find((p) => p.key === product.key);
    const [saved] =
      await sql`select p.*,t.name,t.slug from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.id=${entry.id}`;
    assert.equal(saved.name, product.name_th);
    assert.equal(saved.slug, product.slug);
    assert.equal(Number(saved.price), Number(product.filename.match(/^\d+/)[0]));
    assert.equal(saved.stock_status, "available");
    assert.equal(saved.status, "published");
    assert.equal(saved.is_published, true);
    assert.equal(saved.quantity, null);
    assert.equal(saved.weight, null);
    assert.equal(saved.sale_price, null);
    const [category] =
      await sql`select slug from category_i18n where category_id=${saved.category_id} and locale='th'`;
    assert.equal(category.slug, "artificial-flowers");
    const bytes = await readFile(product.output);
    assert.deepEqual(
      await readFile(path.join(process.env.MEDIA_DIR, entry.media.storage_key, "original.png")),
      bytes,
    );
    const master = await sharp(
      path.join(process.env.MEDIA_DIR, entry.media.storage_key, "master.webp"),
    ).metadata();
    assert.ok(master.hasAlpha && master.width >= 1024 && master.height >= 1024);
    const response = await page.goto(`${origin}/products/${product.slug}`, {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("main h1").innerText(), product.name_th);
    assert.equal(
      Number((await page.locator(".v-detail-price").innerText()).replace(/[^0-9.]/g, "")),
      product.price,
    );
    assert.equal(await page.locator(".v-stock").getAttribute("data-status"), "available");
    const image = page.locator(".v-gallery-main img");
    await image.evaluate((img) => img.decode());
    const url = new URL(await image.evaluate((img) => img.currentSrc), origin);
    assert.equal(url.searchParams.get("url"), `/media/${entry.media.storage_key}/master.webp`);
    assert.equal(url.searchParams.get("q"), "90");
    assert.equal(await image.evaluate((img) => getComputedStyle(img).objectFit), "contain");
    if (product.selling_unit)
      assert.ok((await page.locator("main").innerText()).includes("จำหน่ายเป็นชุด 2 ใบ"));
    if (["flower-01", "flower-06", "flower-08", "flower-10"].includes(product.key))
      await page.locator(".v-product-detail").screenshot({
        path: `${screenshots}/${product.key}-desktop.png`,
        style: ".v-header{visibility:hidden}",
      });
    loaded++;
  }
  const seen = new Set();
  for (const index of [1, 2]) {
    await page.goto(`${origin}/products/category/artificial-flowers?page=${index}`, {
      waitUntil: "networkidle",
    });
    for (const card of await page.locator(".v-product-card").all()) {
      const slug = decodeURIComponent(await card.locator("h3 a").getAttribute("href"))
        .split("/")
        .pop();
      assert.ok(report.products.some((p) => p.slug === slug));
      seen.add(slug);
      const image = card.locator(".v-product-image img");
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
    }
    if (index === 1)
      await page.locator(".v-product-grid").screenshot({
        path: `${screenshots}/catalog-desktop.png`,
        style: ".v-header{visibility:hidden}",
      });
  }
  assert.equal(seen.size, 13);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/products/category/artificial-flowers",
      "/products/floral-vase-pair-fa-phisuth",
    ]) {
      assert.equal(
        (await page.goto(`${origin}${route}`, { waitUntil: "networkidle" })).status(),
        200,
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (route.endsWith("fa-phisuth")) {
        await page.locator(".v-gallery-main img").evaluate((img) => img.decode());
        await page.locator(".v-product-detail").screenshot({
          path: `${screenshots}/pair-${width}.png`,
          style: ".v-header{visibility:hidden}",
        });
      }
    }
    console.log(`PASS flower catalogue and pair detail at ${width}px`);
  }
  await page.goto(origin, { waitUntil: "networkidle" });
  const flowerCard = page.locator(
    '.v-collection-card[href$="/products/category/artificial-flowers"]',
  );
  assert.ok((await flowerCard.innerText()).includes("13"));
  for (const actor of report.actors) {
    const [account] = await sql`select is_active from users where id=${actor}`;
    assert.equal(account.is_active, false);
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `${root}/verification.json`,
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        origin,
        published_products: 13,
        detail_images_loaded: loaded,
        category_card_products: seen.size,
        exact_filename_prices: true,
        pair_prices_confirmed: true,
        stock: "available",
        transparent_originals_and_masters: true,
        quality: 90,
        widths: [320, 390, 768, 1440],
        no_horizontal_overflow: true,
        browser_errors: errors,
        import_accounts_disabled: true,
        screenshots,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
  await sql.end();
}
