import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import postgres from "postgres";
import { chromium } from "playwright";

const root = "content/needlework";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
const screenshots = "test-results/needlework";
await mkdir(screenshots, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const categoryRoute = "/products/category/needlework";
const priceAmount = async (locator) => Number((await locator.innerText()).replace(/[^0-9.]/g, ""));
try {
  assert.equal(manifest.products.length, 23);
  assert.equal(manifest.products.filter((p) => p.kind === "tshirt").length, 22);
  assert.equal(manifest.products.filter((p) => p.kind === "bag").length, 1);
  assert.equal(report.products.filter((p) => p.completed).length, 23);
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => errors.push(e.message));
  for (const p of manifest.products) {
    const entry = report.products.find((r) => r.key === p.key);
    const [saved] =
      await sql`select p.*,t.name,t.slug,ct.slug category from products p join product_i18n t on t.product_id=p.id and t.locale='th' join category_i18n ct on ct.category_id=p.category_id and ct.locale='th' where p.id=${entry.id}`;
    assert.equal(saved.name, p.name_th);
    assert.equal(saved.slug, p.slug);
    assert.equal(saved.category, "needlework");
    assert.equal(Number(saved.price), p.kind === "bag" ? 199 : 399);
    assert.equal(saved.price_mode, "exact");
    assert.equal(saved.sale_price, null);
    assert.equal(saved.sharing_price, null);
    assert.equal(saved.is_featured, false);
    assert.equal(saved.status, "published");
    assert.equal(saved.is_published, true);
    assert.equal(saved.quantity, null);
    assert.equal(saved.weight, null);
    assert.equal(
      createHash("sha256")
        .update(await readFile(p.source))
        .digest("hex"),
      p.source_sha256,
    );
    const bytes = await readFile(p.output);
    assert.deepEqual(
      await readFile(path.join(process.env.MEDIA_DIR, entry.media.storage_key, "original.png")),
      bytes,
    );
    const masterPath = path.join(process.env.MEDIA_DIR, entry.media.storage_key, "master.webp");
    const meta = await sharp(masterPath).metadata();
    const stats = await sharp(masterPath).stats();
    assert.ok(meta.hasAlpha && meta.width >= 1024 && meta.height >= 1024);
    assert.equal(stats.channels[3].min, 0);
    assert.equal(
      (await page.goto(`${origin}/products/${p.slug}`, { waitUntil: "networkidle" })).status(),
      200,
    );
    assert.equal(await page.locator("main h1").innerText(), p.name_th);
    assert.equal(await priceAmount(page.locator(".v-detail-price")), p.price);
    assert.equal(await page.locator(".v-detail-price del").count(), 0);
    const image = page.locator(".v-gallery-main img");
    await image.evaluate((img) => img.decode());
    const url = new URL(await image.evaluate((img) => img.currentSrc), origin);
    assert.equal(url.searchParams.get("url"), `/media/${entry.media.storage_key}/master.webp`);
    assert.equal(url.searchParams.get("q"), "90");
    assert.equal(await image.evaluate((img) => getComputedStyle(img).objectFit), "contain");
    const structured = JSON.parse(
      await page.locator('script[type="application/ld+json"]').last().textContent(),
    ).find((item) => item["@type"] === "Product");
    assert.equal(Number(structured.offers.price), p.price);
    assert.equal(structured.offers.priceCurrency, "THB");
    if (["01", "04", "23"].includes(p.key))
      await page.locator(".v-product-detail").screenshot({
        path: `${screenshots}/${p.key}-desktop.png`,
        style: ".v-header{visibility:hidden}",
      });
  }
  const seen = new Set();
  for (const index of [1, 2]) {
    await page.goto(`${origin}${categoryRoute}?page=${index}`, { waitUntil: "networkidle" });
    const cards = page.locator(".v-product-grid .v-product-card");
    assert.equal(await cards.count(), index === 1 ? 12 : 11);
    for (const card of await cards.all()) {
      const slug = decodeURIComponent(await card.locator("h3 a").getAttribute("href"))
        .split("/")
        .pop();
      const product = manifest.products.find((p) => p.slug === slug);
      assert.ok(product);
      assert.ok(!seen.has(slug));
      seen.add(slug);
      assert.equal(await priceAmount(card.locator(".v-product-price")), product.price);
      const image = card.locator("img");
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
    }
    await page.locator(".v-product-grid").screenshot({
      path: `${screenshots}/catalog-page-${index}.png`,
      style: ".v-header{visibility:hidden}",
    });
  }
  assert.equal(seen.size, 23);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      categoryRoute,
      `${categoryRoute}?page=2`,
      `/products/${manifest.products[0].slug}`,
      `/products/${manifest.products[22].slug}`,
      "",
    ]) {
      assert.equal(
        (await page.goto(`${origin}${route}`, { waitUntil: "networkidle" })).status(),
        200,
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (!route) {
        assert.equal(
          await page.locator('#featured [data-active="true"] h3 a').getAttribute("href"),
          "/products/wreath-khao-phisuth",
        );
        const needleworkCard = page.locator(
          ".v-collection-card[href$='/products/category/needlework']",
        );
        assert.ok((await needleworkCard.innerText()).includes("23"));
        await page
          .locator("#featured")
          .screenshot({ path: `${screenshots}/carousel-${width}.png` });
      } else if (route.includes("/products/" + manifest.products[22].slug)) {
        await page.locator(".v-gallery-main img").evaluate((img) => img.decode());
        await page.locator(".v-product-detail").screenshot({
          path: `${screenshots}/bag-${width}.png`,
          style: ".v-header{visibility:hidden}",
        });
      }
    }
    console.log(
      `PASS needlework category, shirt and tote prices and existing featured wreath at ${width}px`,
    );
  }
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
        published_products: 23,
        shirts: 22,
        tshirt_price: 399,
        bags: 1,
        bag_price: 199,
        detail_images_loaded: 23,
        category_cards_checked: 23,
        transparent_originals_and_masters: true,
        quality: 90,
        widths: [320, 390, 768, 1440],
        existing_featured_wreath_first: true,
        no_horizontal_overflow: true,
        import_accounts_disabled: true,
        browser_errors: errors,
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
