import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import postgres from "postgres";

const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
const output = "test-results/featured-carousel";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const errors = [];
const widths = [320, 390, 768, 1100, 1440, 1920];
let cardsChecked = 0;
try {
  const records =
    await sql`select t.name,t.slug,p.is_featured,m.storage_key from products p join product_i18n t on t.product_id=p.id and t.locale='th' join categories c on c.id=p.category_id left join product_media pm on pm.product_id=p.id and pm.is_primary left join media m on m.id=pm.media_id where p.deleted_at is null and p.is_published and p.status in ('published','out_of_stock') and p.published_at<=now() and c.deleted_at is null and c.is_published and c.is_enabled and c.status='published' order by p.is_featured desc,p.sort_order,p.created_at desc,p.id`;
  const featured = records.filter((p) => p.is_featured);
  const expected = [...featured, ...records.filter((p) => !p.is_featured)].slice(0, 12);
  assert.ok(expected.length > 3, "Current catalogue exercises scrolling across multiple cards");
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of widths) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
    assert.equal((await page.goto(origin, { waitUntil: "networkidle" })).status(), 200);
    assert.ok(
      await page
        .locator("main > :first-child")
        .evaluate((el) => el.classList.contains("v-journey-opening")),
    );
    assert.ok(
      await page
        .locator("#featured")
        .evaluate((el) => el.previousElementSibling.classList.contains("v-journey-opening")),
    );
    await page
      .locator("#featured")
      .evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    assert.equal(await page.locator("#featured").count(), 1);
    assert.equal(await page.locator("#featured .v-product-card").count(), expected.length);
    assert.equal(await page.locator("main h1").count(), 1);
    const track = page.locator('#featured [tabindex="0"]');
    const first = page.locator("#featured .v-product-image").first();
    const box = await first.boundingBox();
    assert.ok(box.y < 500 && box.y + 80 < 844, "Products are visible when reaching the carousel");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const previous = page.getByRole("button", { name: "สินค้าก่อนหน้า", exact: true });
    const next = page.getByRole("button", { name: "สินค้าถัดไป", exact: true });
    await previous.waitFor();
    assert.equal(await previous.isEnabled(), true);
    assert.equal(await next.isEnabled(), true);
    await next.click();
    assert.equal(await track.getAttribute("data-active-index"), "1");
    await previous.click();
    assert.equal(await track.getAttribute("data-active-index"), "0");
    await previous.click();
    assert.equal(await track.getAttribute("data-active-index"), String(expected.length - 1));
    await next.click();
    assert.equal(await track.getAttribute("data-active-index"), "0");
    await track.focus();
    await track.press("ArrowRight");
    assert.equal(await track.getAttribute("data-active-index"), "1");
    await track.press("End");
    assert.equal(await track.getAttribute("data-active-index"), String(expected.length - 1));
    await track.press("Home");
    assert.equal(await track.getAttribute("data-active-index"), "0");
    const centre = await page.locator('#featured [data-active="true"]').boundingBox();
    const stage = await track.boundingBox();
    assert.ok(
      Math.abs(centre.x + centre.width / 2 - stage.x - stage.width / 2) < 2,
      "Selected card is centred",
    );
    assert.ok(await track.evaluate((el) => getComputedStyle(el).perspective !== "none"));
    const neighbour = page.locator('#featured [data-distance="1"]').first();
    assert.ok(
      await neighbour.evaluate((el) => !new DOMMatrix(getComputedStyle(el).transform).is2D),
      "Side cards use real 3D transforms",
    );
    assert.equal(
      await neighbour.locator(".v-product-card").evaluate((el) => el.parentElement.inert),
      true,
    );
    assert.equal(
      await page
        .locator('#featured [data-active="true"]')
        .evaluate((el) => getComputedStyle(el).transitionDuration),
      "0s",
    );
    if (width >= 1100) {
      await page.getByRole("button", { name: `เลือกดู ${expected[1].name}`, exact: true }).click();
      assert.equal(await track.getAttribute("data-active-index"), "1");
      await track.focus();
      await track.press("Home");
    }
    const startPosition = await track.getAttribute("data-active-index");
    await page.waitForTimeout(250);
    assert.equal(
      await track.getAttribute("data-active-index"),
      startPosition,
      "No unsolicited automatic slide changes",
    );
    await first.evaluate((el) => el.focus());
    assert.ok(await first.evaluate((el) => getComputedStyle(el).outlineStyle !== "none"));
    await first.locator("img").evaluate((img) => img.decode());
    const scene = await page.locator(".v-journey-opening").boundingBox();
    const showcase = await page.locator("#featured").boundingBox();
    assert.ok(
      showcase.y >= scene.y + scene.height - 2,
      "Carousel follows the complete film without overlap",
    );
    await page
      .locator("#featured")
      .evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.screenshot({ path: `${output}/opening-${width}.png` });
    console.log(`PASS centred 3D carousel, looping controls, keyboard and layout at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const productTrack = page.locator('#featured [tabindex="0"]');
  await productTrack.focus();
  await productTrack.press("Home");
  const dragBox = await productTrack.boundingBox();
  const dragX = dragBox.x + dragBox.width / 2;
  const dragY = dragBox.y + 100;
  await page.mouse.move(dragX + 80, dragY);
  await page.mouse.down();
  await page.mouse.move(dragX - 120, dragY, { steps: 10 });
  await page.mouse.up();
  await page.waitForFunction(
    () => document.querySelector("#featured [data-active-index]").dataset.activeIndex === "1",
  );
  assert.equal(
    new URL(page.url()).pathname,
    "/",
    "Mouse drag does not accidentally open a product",
  );
  await page.mouse.wheel(180, 0);
  await page.waitForFunction(
    () => document.querySelector("#featured [data-active-index]").dataset.activeIndex === "2",
  );
  await productTrack.focus();
  await productTrack.press("Home");
  for (const [index, expectedProduct] of expected.entries()) {
    if (index > 0) await productTrack.press("ArrowRight");
    assert.equal(await productTrack.getAttribute("data-active-index"), String(index));
    const card = page.locator("#featured .v-product-card").nth(index);
    const imageLink = card.locator(".v-product-image");
    await imageLink.scrollIntoViewIfNeeded();
    assert.equal(await card.locator("h3").innerText(), expectedProduct.name);
    const href = await imageLink.getAttribute("href");
    assert.equal(decodeURIComponent(href).replace(/^\/products\//, ""), expectedProduct.slug);
    assert.equal(await card.locator("h3 a").getAttribute("href"), href);
    const image = imageLink.locator("img");
    await image.evaluate((img) => img.decode());
    const source = new URL(await image.evaluate((img) => img.currentSrc), origin);
    assert.equal(
      source.searchParams.get("url"),
      `/media/${expectedProduct.storage_key}/master.webp`,
    );
    assert.equal(source.searchParams.get("q"), "90");
    assert.equal(await image.evaluate((img) => getComputedStyle(img).objectFit), "contain");
    cardsChecked++;
  }
  await page.locator('#featured [tabindex="0"]').focus();
  await page.locator('#featured [tabindex="0"]').press("Home");
  await page.locator("#featured .v-product-image").first().click();
  await page.waitForURL(
    (url) => decodeURIComponent(url.pathname) === `/products/${expected[0].slug}`,
  );
  assert.equal(await page.locator("main h1").innerText(), expected[0].name);

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(origin, { waitUntil: "networkidle" });
  await mobile
    .locator("#featured")
    .evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
  const mobileTrack = mobile.locator('#featured [tabindex="0"]');
  const touchBox = await mobileTrack.boundingBox();
  const client = await mobile.context().newCDPSession(mobile);
  const y = touchBox.y + 110;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 320, y }],
  });
  for (const x of [280, 235, 190, 145, 100, 60]) {
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
    await mobile.waitForTimeout(30);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await mobile.waitForFunction(
    () => document.querySelector('#featured [tabindex="0"]').dataset.activeIndex === "1",
  );
  assert.equal(new URL(mobile.url()).pathname, "/", "Swipe does not accidentally open a product");
  await mobile.screenshot({ path: `${output}/touch-swipe.png` });
  await mobile.close();

  const animated = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  animated.on("pageerror", (error) => errors.push(error.message));
  await animated.goto(origin, { waitUntil: "networkidle" });
  await animated.getByRole("button", { name: "สินค้าถัดไป", exact: true }).click();
  await animated.waitForFunction(
    () => document.querySelector("#featured strong").textContent === "02",
  );
  await animated.getByRole("button", { name: "สินค้าก่อนหน้า", exact: true }).click();
  await animated.waitForFunction(
    () => document.querySelector('#featured [tabindex="0"]').dataset.activeIndex === "0",
  );
  await animated.close();

  const plain = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await plain.goto(origin, { waitUntil: "networkidle" });
  assert.equal(await plain.locator("#featured .v-product-card").count(), expected.length);
  await plain.locator("#featured .v-product-image").first().click();
  await plain.waitForURL(
    (url) => decodeURIComponent(url.pathname) === `/products/${expected[0].slug}`,
  );
  assert.equal(await plain.locator("main h1").innerText(), expected[0].name);
  await plain.close();
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/verification.json`,
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        origin,
        widths,
        cards: cardsChecked,
        data_source: featured.length ? "CMS featured selection" : "Published catalogue fallback",
        directly_after_scroll_animation: true,
        arrows: true,
        keyboard_and_focus: true,
        touch_swipe: true,
        product_navigation: true,
        images_without_cropping: true,
        no_horizontal_overflow: true,
        no_javascript_product_links: true,
        no_automatic_rotation: true,
        smooth_and_reduced_motion_controls: true,
        centred_3d_perspective: true,
        loop_in_both_directions: true,
        side_card_selection: true,
        mouse_drag_and_horizontal_wheel: true,
        browser_errors: errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "PASS all card images and links, touch swiping, product navigation and no-JavaScript fallback",
  );
} finally {
  await browser.close();
  await sql.end();
}
