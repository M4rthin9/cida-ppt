import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import postgres from "postgres";
import sharp from "sharp";
import path from "node:path";

const root = "content/sharing-wreaths";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
const screenshots = "test-results/sharing-wreaths";
await mkdir(screenshots, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const checkPrices = async (locator) => {
  assert.deepEqual(await locator.locator("dt").allTextContents(), ["ราคาแบ่งปัน", "ราคาขายขาด"]);
  assert.deepEqual(await locator.locator("dd").allTextContents(), ["1,700 บาท", "4,000 บาท"]);
  assert.equal(await locator.locator("del").count(), 0);
};
try {
  assert.equal(report.products.filter((p) => p.completed).length, 11);
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => errors.push(e.message));
  for (const p of manifest.products) {
    const entry = report.products.find((r) => r.key === p.key);
    const [saved] =
      await sql`select p.*,t.name,t.slug from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.id=${entry.id}`;
    assert.equal(saved.name, p.name_th);
    assert.equal(saved.slug, p.slug);
    assert.equal(Number(saved.price), 4000);
    assert.equal(Number(saved.sharing_price), 1700);
    assert.equal(saved.sale_price, null);
    assert.equal(saved.is_featured, p.is_featured);
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
    const master = await sharp(
      path.join(process.env.MEDIA_DIR, entry.media.storage_key, "master.webp"),
    ).metadata();
    assert.ok(master.hasAlpha && master.width >= 1024 && master.height >= 1024);
    assert.equal(
      (await page.goto(`${origin}/products/${p.slug}`, { waitUntil: "networkidle" })).status(),
      200,
    );
    assert.equal(await page.locator("main h1").innerText(), p.name_th);
    await checkPrices(page.locator(".v-detail-price"));
    const image = page.locator(".v-gallery-main img");
    await image.evaluate((img) => img.decode());
    const url = new URL(await image.evaluate((img) => img.currentSrc), origin);
    assert.equal(url.searchParams.get("url"), `/media/${entry.media.storage_key}/master.webp`);
    assert.equal(url.searchParams.get("q"), "90");
    assert.equal(await image.evaluate((img) => getComputedStyle(img).objectFit), "contain");
    const structured = await page
      .locator('script[type="application/ld+json"]')
      .last()
      .textContent();
    const data = JSON.parse(structured).find((item) => item["@type"] === "Product");
    assert.deepEqual(
      data.offers.map((o) => [o.name, Number(o.price)]),
      [
        ["ราคาขายขาด", 4000],
        ["ราคาแบ่งปัน", 1700],
      ],
    );
  }
  await page.goto(`${origin}/products/category/sharing-wreaths`, { waitUntil: "networkidle" });
  const cards = page.locator(".v-product-grid .v-product-card");
  assert.equal(await cards.count(), 11);
  assert.equal(await cards.first().locator("h3").innerText(), manifest.products[0].name_th);
  for (const card of await cards.all()) {
    await checkPrices(card.locator(".v-product-price"));
    const image = card.locator("img");
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((img) => img.decode());
  }
  await page.locator(".v-product-grid").screenshot({
    path: `${screenshots}/catalog-desktop.png`,
    style: ".v-header{visibility:hidden}",
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/products/category/sharing-wreaths",
      `/products/${manifest.products[0].slug}`,
      "",
    ]) {
      await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (!route) {
        const first = page.locator('#featured [data-active="true"] .v-product-card');
        assert.equal(await first.locator("h3").innerText(), manifest.products[0].name_th);
        await checkPrices(first.locator(".v-product-price"));
        await first.locator("img").scrollIntoViewIfNeeded();
        await first.locator("img").evaluate((img) => img.decode());
        assert.ok(
          await first.evaluate((el) => {
            const card = el.getBoundingClientRect();
            const price = el.querySelector(".v-product-price").getBoundingClientRect();
            return price.bottom <= card.bottom && price.right <= card.right;
          }),
          "Both prices fit the carousel card",
        );
        await page
          .locator("#featured")
          .screenshot({ path: `${screenshots}/carousel-${width}.png` });
      } else if (route.includes(manifest.products[0].slug)) {
        await checkPrices(page.locator(".v-detail-price"));
        await page.locator(".v-gallery-main img").evaluate((img) => img.decode());
        await page.locator(".v-product-detail").screenshot({
          path: `${screenshots}/white-${width}.png`,
          style: ".v-header{visibility:hidden}",
        });
      }
    }
    console.log(
      `PASS wreath category, dual-price detail and first featured carousel at ${width}px`,
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
        published_products: 11,
        sharing_price: 1700,
        outright_price: 4000,
        first_featured: manifest.products[0].slug,
        widths: [320, 390, 768, 1440],
        transparent_originals_and_masters: true,
        all_detail_images_loaded: true,
        no_discount_strikethrough: true,
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
