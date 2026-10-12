import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.DESIGN_QA_URL || "http://localhost:3001";
const output = "test-results/redesign";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const frames = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/frames/")) frames.push(request.url());
  });
  await page.goto(origin, { waitUntil: "networkidle" });
  const categories = await page
    .locator(".v-collection-index > a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const routes = ["/", "/products", "/vocational", "/story", "/news", "/contact", ...categories];
  const width = () =>
    page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));

  const layoutWidths =
    process.env.DESIGN_QA_INTERACTIONS_ONLY === "1" ? [] : [320, 390, 768, 1100, 1280, 1440, 1920];
  for (const viewport of layoutWidths) {
    await page.setViewportSize({ width: viewport, height: 900 });
    for (const route of routes) {
      const response = await page.goto(new URL(route, origin).href, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, route);
      assert.equal(await page.locator("main h1").count(), 1, `${route}: one primary heading`);
      const dimensions = await width();
      assert.ok(dimensions.document <= dimensions.width, `${route} overflows at ${viewport}px`);
      assert.ok(await page.title(), `${route}: page title`);
    }
    console.log(`PASS all public routes and categories at ${viewport}px`);
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.waitForSelector(".v-cine canvas[data-ready='true']");
  assert.ok(frames.length > 0, "Opening film loads automatically");
  await page.locator(".v-category-toggle").click();
  assert.equal(await page.locator(".v-category-toggle").getAttribute("aria-expanded"), "true");
  await page.locator(".v-category-toggle").press("Escape");
  assert.equal(await page.locator(".v-category-toggle").getAttribute("aria-expanded"), "false");
  assert.equal(await page.evaluate(() => document.activeElement.className), "v-category-toggle");
  await page.locator(".v-category-toggle").click();
  await page.locator(".v-cine h1").click();
  assert.equal(await page.locator(".v-category-toggle").getAttribute("aria-expanded"), "false");
  console.log("PASS category disclosure, Escape focus and outside dismissal");

  await page.goto(`${origin}/products`, { waitUntil: "networkidle" });
  await page.locator('[name="q"]').fill("ค้นหาที่ไม่มีผลลัพธ์");
  await page.locator('[name="stock"]').selectOption("made_to_order");
  await page.locator('[name="featured"]').check();
  await page.locator('.v-catalog-filters button[type="submit"]').click();
  await page.waitForURL((url) => url.searchParams.get("stock") === "made_to_order");
  assert.equal(await page.locator('[name="q"]').inputValue(), "ค้นหาที่ไม่มีผลลัพธ์");
  await page.locator(".v-category-tabs a").nth(1).click();
  await page.waitForURL((url) => url.pathname.includes("/products/category/"));
  assert.equal(new URL(page.url()).searchParams.get("stock"), "made_to_order");
  assert.equal(new URL(page.url()).searchParams.get("featured"), "1");
  await page.locator(".v-filter-checks > a").click();
  await page.waitForURL((url) => !url.search);
  console.log("PASS catalogue search, filters, category transitions and reset");

  await page.goto(`${origin}/contact`, { waitUntil: "networkidle" });
  await page.locator('.v-contact-form-panel button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelectorAll('[aria-invalid="true"]').length > 0);
  assert.equal(await page.evaluate(() => document.activeElement.name), "name");
  await page.locator('[name="name"]').fill("ทดสอบแบบฟอร์ม");
  await page.locator('[name="email"]').fill("invalid");
  await page.locator('[name="body"]').fill("ทดสอบการเก็บข้อความเมื่ออีเมลไม่ถูกต้อง");
  await page.locator('.v-contact-form-panel button[type="submit"]').click();
  await page.waitForFunction(() => document.activeElement.name === "email");
  assert.equal(
    await page.locator('[name="body"]').inputValue(),
    "ทดสอบการเก็บข้อความเมื่ออีเมลไม่ถูกต้อง",
  );
  console.log("PASS server form validation, error focus and retained enquiry text");

  await page.goto(origin, { waitUntil: "networkidle" });
  await page.waitForSelector(".v-cine canvas[data-ready='true']");
  await page.locator(".v-cine .v-scene-skip").click();
  await page.waitForFunction(
    () => document.querySelector("#collections").getBoundingClientRect().top < innerHeight,
  );
  assert.ok(
    await page.evaluate(
      () => document.querySelector("#collections").getBoundingClientRect().top < innerHeight,
    ),
  );
  await page.goto(origin + "/products", { waitUntil: "networkidle" });
  assert.equal(await page.locator(".v-cine canvas").count(), 0);
  console.log("PASS cinematic opening, skip link and route cleanup");

  for (const viewport of [320, 390, 768]) {
    await page.setViewportSize({ width: viewport, height: 844 });
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.locator(".v-menu-toggle").click();
    await page.locator(".v-menu-toggle").press("Escape");
    assert.equal(await page.locator(".v-menu-toggle").getAttribute("aria-expanded"), "false");
    assert.equal(await page.evaluate(() => document.activeElement.className), "v-menu-toggle");
    await page.locator(".v-menu-toggle").click();
    await page.locator("#public-navigation > a[href='/story']").click();
    await page.waitForURL("**/story");
    assert.equal(await page.locator(".v-menu-toggle").getAttribute("aria-expanded"), "false");
    console.log(`PASS mobile navigation at ${viewport}px`);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [route, name] of [
    ["/", "home-desktop"],
    ["/products", "catalog-desktop"],
    ["/contact", "contact-desktop"],
    ["/story", "story-desktop"],
    ["/vocational", "training-desktop"],
    ["/admin/login", "admin-login"],
  ]) {
    await page.goto(origin + route, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin, { waitUntil: "networkidle" });
  assert.equal(
    await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => animation.playState === "running").length,
    ),
    0,
  );
  await page.screenshot({ path: `${output}/home-mobile.png`, fullPage: true });
  await page.goto(`${origin}/products/not-a-published-product`, { waitUntil: "networkidle" });
  assert.ok(await page.locator(".v-state-page").count());
  assert.ok((await width()).document <= 390);
  await page.screenshot({ path: `${output}/not-found-mobile.png`, fullPage: true });
  assert.deepEqual(errors, []);
  console.log("PASS reduced motion, product 404, and no browser runtime errors");
  console.log(`Screenshots: ${output}`);
} finally {
  await browser.close();
}
