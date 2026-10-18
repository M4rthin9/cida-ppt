import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { chromium } from "playwright";

const root = "content/new-wreaths";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const installed = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
const covers = JSON.parse(await readFile(`${root}/covers-installation.json`, "utf8"));
const origin = process.env.DESIGN_QA_URL || "http://localhost:3001";
const screenshots = "test-results/premium-wreaths";
await mkdir(screenshots, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const prices = async (locator) => {
  assert.deepEqual(await locator.locator("dt").allTextContents(), ["ราคาแบ่งปัน", "ราคาขายขาด"]);
  assert.deepEqual(await locator.locator("dd").allTextContents(), ["2,000 บาท", "5,000 บาท"]);
  assert.equal(await locator.locator("del").count(), 0);
};
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(90000);
  page.on("pageerror", (error) => errors.push(error.message));
  const originals = [];
  for (const p of manifest.products) {
    const entry = installed.products.find((r) => r.key === p.key);
    const [saved] =
      await sql`select p.*,t.name,t.short_desc,t.slug from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.id=${entry.id}`;
    assert.equal(saved.name, p.name_th);
    assert.match(saved.name, /[\u0e00-\u0e7f]/);
    assert.ok(!saved.name.includes("?"));
    assert.equal(saved.short_desc, p.short_description_th);
    assert.equal(saved.price, "5000.00");
    assert.equal(saved.sharing_price, "2000.00");
    assert.equal(saved.sale_price, null);
    assert.equal(saved.is_featured, true);
    assert.equal(saved.is_published, true);
    const [caption] =
      await sql`select alt from media_i18n where media_id=${entry.media.id} and locale='th'`;
    assert.equal(caption.alt, p.name_th);
    const bytes = await readFile(p.source);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    assert.equal(sha256, p.source_sha256);
    assert.deepEqual(
      await readFile(path.join(process.env.MEDIA_DIR, entry.media.storage_key, "original.png")),
      bytes,
    );
    originals.push({ slug: p.slug, sha256 });
    assert.equal(
      (await page.goto(`${origin}/products/${p.slug}`, { waitUntil: "networkidle" })).status(),
      200,
    );
    assert.equal(await page.locator("main h1").innerText(), p.name_th);
    await prices(page.locator(".v-detail-price"));
    await page.locator(".v-gallery-main img").evaluate((img) => img.decode());
    const structured = JSON.parse(
      await page.locator('script[type="application/ld+json"]').last().textContent(),
    );
    const product = structured.find((item) => item["@type"] === "Product");
    assert.deepEqual(
      product.offers.map((offer) => [offer.name, Number(offer.price)]),
      [
        ["ราคาขายขาด", 5000],
        ["ราคาแบ่งปัน", 2000],
      ],
    );
  }
  const [legacy] =
    await sql`select count(*)::int n from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.category_id=${covers.category_id} and t.slug not like 'wreath-premium-%' and p.price=4000 and p.sharing_price=1700 and p.deleted_at is null`;
  assert.equal(legacy.n, 11);
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/products/category/sharing-wreaths`, { waitUntil: "networkidle" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const cards = page.locator(".v-product-grid .v-product-card");
    for (let i = 0; i < manifest.products.length; i++) {
      assert.equal(await cards.nth(i).locator("h3").innerText(), manifest.products[i].name_th);
      await prices(cards.nth(i).locator(".v-product-price"));
    }
    const hero = page.locator(".v-category-cover img");
    await hero.evaluate((img) => img.decode());
    const imageUrl = new URL(await hero.evaluate((img) => img.currentSrc), origin);
    assert.equal(
      imageUrl.searchParams.get("url"),
      width <= 760
        ? covers.mobile.url
        : `/media/${covers.media.find((m) => m.field === "hero_media_id").storage_key}/master.webp`,
    );
    await page.locator(".v-category-hero").screenshot({
      path: `${screenshots}/cover-${width}.png`,
      style: ".v-header{visibility:hidden}",
    });
    await page.goto(`${origin}/products/${manifest.products[0].slug}`, {
      waitUntil: "networkidle",
    });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await prices(page.locator(".v-detail-price"));
    await page.locator(".v-product-detail").screenshot({
      path: `${screenshots}/product-${width}.png`,
      style: ".v-header{visibility:hidden}",
    });
    await page.goto(origin, { waitUntil: "networkidle" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (let i = 0; i < manifest.products.length; i++) {
      const active = page.locator('#featured [data-active="true"] .v-product-card');
      assert.equal(await active.locator("h3").innerText(), manifest.products[i].name_th);
      await prices(active.locator(".v-product-price"));
      await page.getByRole("button", { name: "สินค้าถัดไป", exact: true }).click();
    }
    const tile = page.locator('.v-collection-card[href$="/products/category/sharing-wreaths"]');
    await tile.locator("img").first().scrollIntoViewIfNeeded();
    await tile
      .locator("img")
      .first()
      .evaluate((img) => img.decode());
    await tile.screenshot({
      path: `${screenshots}/tile-${width}.png`,
      style: ".v-header{visibility:hidden}",
    });
    console.log(
      `PASS six featured wreaths, two prices, responsive category cover and tile at ${width}px`,
    );
  }
  for (const actor of [...installed.actors, ...covers.actors]) {
    const [account] = await sql`select is_active from users where id=${actor}`;
    assert.equal(account.is_active, false);
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `${root}/verification.json`,
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        six_featured_products: true,
        sharing_price: 2000,
        outright_price: 5000,
        legacy_wreath_prices_preserved: true,
        originals_byte_identical: originals,
        utf8_thai_names: true,
        structured_offers_verified: true,
        desktop_mobile_and_homepage_covers: true,
        widths: [320, 390, 768, 1440, 1920],
        browser_errors: errors,
        temporary_accounts_disabled: true,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
  await sql.end();
}
