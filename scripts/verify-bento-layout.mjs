import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.DESIGN_QA_URL || "http://localhost:3001";
await mkdir("test-results/bento", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [320, 390, 700, 768, 1050, 1100, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin, { waitUntil: "networkidle" });
    const cards = page.locator(".v-collection-card");
    assert.ok((await cards.count()) > 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const bounds = await cards.evaluateAll((tiles) =>
      tiles.map((tile) => {
        const box = tile.getBoundingClientRect();
        const title = tile.querySelector("h3").getBoundingClientRect();
        const action = tile.querySelector(".v-collection-action").getBoundingClientRect();
        return {
          x: box.x,
          y: box.y,
          right: box.right,
          bottom: box.bottom,
          height: box.height,
          contentFits:
            title.x >= box.x &&
            title.right <= box.right &&
            title.y >= box.y &&
            action.bottom <= box.bottom,
        };
      }),
    );
    for (const box of bounds) {
      assert.ok(box.x >= 0 && box.right <= width, `tile bounds at ${width}`);
      assert.ok(box.contentFits, `title and action fit at ${width}`);
    }
    if (bounds.length === 4 && width > 1050) {
      assert.ok(bounds[0].height > bounds[1].height * 1.8, "tall feature tile");
      assert.ok(Math.abs(bounds[0].bottom - bounds[3].bottom) < 2, "aligned bento bottom");
      assert.ok(Math.abs(bounds[2].y - bounds[3].y) < 2, "compact tile row");
    }
    if ([390, 1440].includes(width)) {
      await page.locator(".v-collection-gallery").screenshot({
        path: `test-results/bento/${width}.png`,
        style: ".v-header, nextjs-portal { visibility: hidden !important; }",
      });
    }
    console.log(`PASS bento grid and text bounds at ${width}px`);
  }
  await page.locator(".v-collection-card").first().focus();
  assert.equal(
    await page
      .locator(".v-collection-card")
      .first()
      .evaluate((tile) => getComputedStyle(tile).outlineStyle),
    "solid",
  );
  const href = await page.locator(".v-collection-card").first().getAttribute("href");
  await page.keyboard.press("Enter");
  await page.waitForURL(new URL(href, origin).href);
  assert.equal(await page.locator("main h1").count(), 1);
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto(origin, { waitUntil: "networkidle" });
  assert.ok(await noJS.locator(".v-collection-card h3").first().isVisible());
  assert.deepEqual(errors, []);
  console.log(
    "PASS keyboard navigation, visible focus, no-JavaScript content and no runtime errors",
  );
} finally {
  await browser.close();
}
