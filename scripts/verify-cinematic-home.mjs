import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.DESIGN_QA_URL || "http://localhost:3001";
const output = "test-results/cinematic";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  const errors = [];
  const frames = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/frames/")) frames.push(request.url());
  });
  const scroll = async (progress) => {
    await page.evaluate((value) => {
      const journey = document.querySelector(".v-journey");
      window.scrollTo({
        top:
          journey.getBoundingClientRect().top +
          scrollY +
          (journey.offsetHeight - innerHeight) * value,
        behavior: "instant",
      });
    }, progress);
    await page.waitForTimeout(900);
  };
  const fits = async (selector) => {
    const bounds = await page.locator(selector).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const header = document.querySelector(".v-header").getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        header: header.bottom,
        width: innerWidth,
        height: innerHeight,
      };
    });
    assert.ok(
      bounds.top >= bounds.header - 2 &&
        bounds.bottom <= bounds.height + 2 &&
        bounds.left >= 0 &&
        bounds.right <= bounds.width,
      `${selector}: ${JSON.stringify(bounds)}`,
    );
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.waitForSelector('.v-journey[data-motion="on"]');
  await page.waitForSelector('.v-cine canvas[data-ready="true"]');
  assert.equal(await page.locator("main h1").count(), 1);
  assert.equal(
    frames.some((url) => url.includes("/frames/reveal/")),
    false,
    "Reveal sequence waits near the hand-off",
  );
  await fits(".v-cine-action");
  await page.screenshot({ path: `${output}/opening-desktop.png` });
  let previousFrame = 0;
  for (const progress of [0.08, 0.16, 0.32, 0.44]) {
    await scroll(progress);
    const frame = Number(await page.locator(".v-cine canvas").getAttribute("data-frame"));
    assert.ok(frame > previousFrame, "Hero frames follow forward scrolling");
    previousFrame = frame;
  }
  await page.screenshot({ path: `${output}/wordmark-desktop.png` });
  await scroll(0.68);
  await page.waitForSelector('.v-aperture[data-live="on"] canvas[data-ready="true"]');
  assert.ok(await page.locator(".v-cine").evaluate((element) => element.inert));
  await page.screenshot({ path: `${output}/light-desktop.png` });
  await scroll(0.92);
  await fits(".v-aperture-copy > .v-pill");
  assert.equal(await page.locator(".v-aperture-copy").evaluate((element) => element.inert), false);
  await page.screenshot({ path: `${output}/reveal-desktop.png` });
  await scroll(0.08);
  assert.equal(await page.locator(".v-aperture").getAttribute("data-live"), "off");
  assert.ok(
    Number(await page.locator(".v-cine canvas").getAttribute("data-frame")) < previousFrame,
  );
  await scroll(0);
  await page.locator(".v-cine .v-scene-skip").click();
  await page.waitForFunction(
    () => document.querySelector("#collections").getBoundingClientRect().top < innerHeight,
  );
  assert.ok(
    await page
      .locator("#collections")
      .evaluate((element) => element.getBoundingClientRect().top < innerHeight),
  );
  console.log(
    "PASS automatic opening, deferred second sequence, both scenes, reverse scrolling, focus gating and skip link",
  );

  for (const [width, height] of [
    [1920, 1080],
    [1280, 720],
    [768, 1024],
    [390, 844],
    [320, 568],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await scroll(0);
    await page.waitForTimeout(300);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await fits(".v-cine h1");
    await fits(".v-cine-action");
    if (width === 390) await page.screenshot({ path: `${output}/opening-mobile.png` });
    await scroll(0.92);
    await fits(".v-aperture-copy h2");
    await fits(".v-aperture-copy > .v-pill");
    if (width === 390) await page.screenshot({ path: `${output}/reveal-mobile.png` });
    console.log(`PASS cinematic bounds at ${width}x${height}`);
  }
  await page.goto(`${origin}/products`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".v-cine canvas").count(), 0);
  assert.equal(await page.locator(".v-header-cinematic").count(), 0);
  assert.deepEqual(errors, []);
  await context.close();

  for (const javascript of [true, false]) {
    const fallback = await browser.newContext({
      javaScriptEnabled: javascript,
      reducedMotion: javascript ? "reduce" : "no-preference",
      viewport: { width: 390, height: 844 },
    });
    const fallbackPage = await fallback.newPage();
    const downloads = [];
    fallbackPage.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/frames/")) downloads.push(request.url());
    });
    await fallbackPage.goto(origin, { waitUntil: "networkidle" });
    assert.equal(await fallbackPage.locator(".v-journey").getAttribute("data-motion"), "off");
    assert.equal(downloads.length, 0, "Static modes use posters without frame downloads");
    assert.equal(await fallbackPage.locator("main h1").count(), 1);
    assert.ok(await fallbackPage.locator("main h1").isVisible());
    assert.ok(await fallbackPage.locator(".v-collection-card").first().isVisible());
    assert.equal(
      await fallbackPage.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.ok(
      await fallbackPage
        .locator(".v-cine-still")
        .evaluate((image) => image.complete && image.naturalWidth > 0),
    );
    assert.equal(
      await fallbackPage
        .locator(".v-aperture-copy")
        .evaluate((element) => getComputedStyle(element).opacity),
      "1",
    );
    await fallback.close();
  }
  console.log(
    "PASS route cleanup, reduced motion, no-JavaScript posters, readable content and no runtime errors",
  );
  const failedFrames = await browser.newContext({ reducedMotion: "no-preference" });
  const failedPage = await failedFrames.newPage();
  await failedPage.route("**/frames/**", (route) => route.abort());
  await failedPage.goto(origin, { waitUntil: "networkidle" });
  assert.ok(
    await failedPage
      .locator(".v-cine-still")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  );
  assert.equal(await failedPage.locator("canvas[data-ready]").count(), 0);
  assert.ok(await failedPage.locator(".v-cine .v-scene-skip").isVisible());
  await failedFrames.close();
  console.log("PASS poster and product shortcut remain available if frame downloads fail");
} finally {
  await browser.close();
}
