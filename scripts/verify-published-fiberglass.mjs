import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const imported = JSON.parse(await readFile("content/fiberglass-drafts/cms-import.json", "utf8"));
const origin = process.env.DESIGN_QA_URL || "http://localhost:3001";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let images = 0;
  for (const product of imported.products) {
    const response = await page.goto(`${origin}/products/${encodeURIComponent(product.slug)}`, {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("main h1").innerText(), product.name_th);
    assert.equal(await page.locator(".v-stock").getAttribute("data-status"), "available");
    assert.ok(
      (await page.locator(".v-detail-price").innerText()).includes(
        product.price.toLocaleString("th-TH"),
      ),
    );
    const gallery = page.locator(".v-gallery-main img");
    await gallery.evaluate((img) => img.decode());
    assert.ok(await gallery.evaluate((img) => img.naturalWidth > 0));
    images++;
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await gallery.evaluate((img) => getComputedStyle(img).objectFit), "contain");
    if (product.media_ids.length > 1) {
      await page.getByRole("button", { name: "ดูภาพที่ 2", exact: true }).click();
      await gallery.evaluate((img) => img.decode());
      assert.ok(await gallery.evaluate((img) => img.naturalWidth > 0));
      assert.equal(
        await page
          .getByRole("button", { name: "ดูภาพที่ 2", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      images++;
    }
  }
  const seen = new Set();
  for (let index = 1; index <= 3; index++) {
    await page.goto(`${origin}/products/category/fiberglass-and-wood?page=${index}`, {
      waitUntil: "networkidle",
    });
    assert.ok((await page.locator(".v-results-count").innerText()).includes("29"));
    for (const href of await page
      .locator(".v-product-card h3 a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href"))))
      seen.add(decodeURIComponent(href));
  }
  assert.equal(seen.size, 29, "All products accessible through category pagination");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/products/category/fiberglass-and-wood`, { waitUntil: "networkidle" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: "test-results/published-fiberglass-mobile.png", fullPage: true });
  for (const entry of [imported.products[0], imported.products.find((p) => p.source_row === 20)]) {
    await page.goto(`${origin}/products/${encodeURIComponent(entry.slug)}`, {
      waitUntil: "networkidle",
    });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.locator(".v-gallery-main img").isVisible());
  }
  assert.deepEqual(errors, []);
  await writeFile(
    "content/fiberglass-drafts/public-verification.json",
    JSON.stringify(
      {
        verified_at: new Date().toISOString(),
        origin,
        public_product_pages: 29,
        images_loaded: images,
        category_pagination_count: seen.size,
        mobile_layout: "passed",
        browser_errors: errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS 29 public product pages, ${images} gallery images, available stock, source prices, category pagination and mobile layouts; no runtime errors.`,
  );
} finally {
  await browser.close();
}
