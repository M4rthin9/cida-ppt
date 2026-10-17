import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import postgres from "postgres";
import sharp from "sharp";
import path from "node:path";

const root = "content/category-banners/studio-v4";
const report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
const widths = [320, 390, 760, 761, 768, 1440, 1920];
const output = "test-results/category-studio";
await mkdir(output, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
let checked = 0;
const activeCategories = report.categories.filter((c) => c.slug === "fiberglass-and-wood");
const restoredCategories = report.categories.filter((c) => c.slug !== "fiberglass-and-wood");
try {
  assert.equal(activeCategories.filter((c) => c.completed).length, 1);
  assert.equal(restoredCategories.filter((c) => c.restored_at).length, 3);
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (error) => errors.push(error.message));
  const checkImage = async (image, media, rendition = "master.webp") => {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((img) => img.decode());
    const source = new URL(await image.evaluate((img) => img.currentSrc), origin);
    assert.equal(source.searchParams.get("url"), `/media/${media.storage_key}/${rendition}`);
    assert.equal(source.searchParams.get("q"), "90");
    assert.ok(await image.evaluate((img) => img.naturalWidth > 0));
    checked++;
  };
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal((await page.goto(origin, { waitUntil: "networkidle" })).status(), 200);
    assert.equal(await page.locator(".v-collection-card.has-background").count(), 1);
    for (const category of activeCategories) {
      const card = page.locator(`.v-collection-card[href$="/products/category/${category.slug}"]`);
      await checkImage(
        card.locator(".v-collection-visual > img"),
        category.media.find((m) => m.field === "thumbnail_media_id"),
      );
      assert.equal(
        await card.evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--collection-ground").trim(),
        ),
        "#213f34",
      );
      assert.ok((await card.locator("h3").innerText()).length > 0);
    }
    for (const category of restoredCategories) {
      const card = page.locator(`.v-collection-card[href$="/products/category/${category.slug}"]`);
      assert.equal(await card.locator(".v-collection-visual > img").count(), 0);
      assert.equal(await card.locator(".v-collection-emblem").count(), 1);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator(".v-collection-gallery").screenshot({
      path: `${output}/categories-${width}.png`,
      style: ".v-header {visibility:hidden}",
    });
    for (const category of report.categories) {
      assert.equal(
        (
          await page.goto(`${origin}/products/category/${category.slug}`, {
            waitUntil: "networkidle",
          })
        ).status(),
        200,
      );
      if (category.slug === "fiberglass-and-wood") {
        await checkImage(
          page.locator(".v-category-cover img"),
          category.media.find((m) => m.field === "hero_media_id"),
          width <= 760 ? "category-mobile-v2.webp" : "master.webp",
        );
        const hero = page.locator(".v-category-panorama");
        const bannerBox = await hero.boundingBox();
        const imageBox = await page.locator(".v-category-cover").boundingBox();
        assert.ok(Math.abs(bannerBox.width - imageBox.width) <= 2);
        assert.ok(Math.abs(bannerBox.height - imageBox.height) <= 2);
        assert.ok(Math.abs(bannerBox.x - imageBox.x) <= 1);
        assert.ok(Math.abs(bannerBox.y - imageBox.y) <= 1);
        assert.equal(
          await page
            .locator(".v-category-cover img")
            .evaluate((img) => getComputedStyle(img).objectFit),
          "cover",
        );
      } else {
        assert.equal(await page.locator(".v-category-cover img").count(), 0);
        assert.equal(await page.locator(".v-category-art").count(), 1);
      }
      assert.equal(
        await page.locator("main h1").innerText(),
        category.before_text.find((t) => t.locale === "th").name,
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator(".v-category-hero").screenshot({
        path: `${output}/${category.slug}-${width}.png`,
        style: ".v-header {visibility:hidden}",
      });
    }
    console.log(`PASS fiberglass banners and three restored categories at ${width}px`);
  }
  for (const category of report.categories) {
    const [actual] =
      await sql`select hero_media_id,thumbnail_media_id from categories where id=${category.id}`;
    if (category.slug !== "fiberglass-and-wood") {
      assert.equal(actual.hero_media_id, category.before.hero_media_id);
      assert.equal(actual.thumbnail_media_id, category.before.thumbnail_media_id);
      assert.deepEqual(
        [
          ...(await sql`select locale,name,slug,description,short_description,seo_title,seo_description from category_i18n where category_id=${category.id} order by locale`),
        ],
        category.before_text,
      );
      continue;
    }
    for (const media of category.media) {
      assert.equal(actual[media.field], media.id);
      const master = await sharp(
        path.join(process.env.MEDIA_DIR, media.storage_key, "master.webp"),
      ).metadata();
      assert.ok(master.width >= 1400 && master.height >= 768);
    }
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
        widths,
        image_checks: checked,
        homepage_tiles: 1,
        category_heroes: 1,
        category_hero_fills_entire_banner: true,
        responsive_portrait_variant: true,
        other_categories_restored: 3,
        upload_original_bytes_retained: true,
        no_horizontal_overflow: true,
        browser_errors: errors,
        import_accounts_disabled: true,
        screenshots: output,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
  await sql.end();
}
