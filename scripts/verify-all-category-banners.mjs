import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import postgres from "postgres";
import { chromium } from "playwright";
const root = "content/category-banners/all-categories";
const report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
const widths = [320, 390, 760, 761, 768, 1440, 1920];
const screenshots = "test-results/all-category-banners";
await mkdir(screenshots, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 }),
  browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
let imageChecks = 0;
try {
  assert.equal(report.categories.filter((c) => c.completed).length, 3);
  assert.ok(report.products_galleries_and_fiberglass_unchanged);
  const records = report.categories.map((c) => ({
    ...c,
    hero: c.media.find((m) => m.field === "hero_media_id"),
    tile: c.media.find((m) => m.field === "thumbnail_media_id"),
  }));
  records.push(report.reused_category);
  const categories =
    await sql`select c.id,c.hero_media_id,c.thumbnail_media_id,c.is_enabled,c.is_published,t.name,t.slug from categories c join category_i18n t on t.category_id=c.id and t.locale='th' where c.deleted_at is null order by c.sort_order`;
  assert.equal(categories.length, 4);
  assert.equal(records.length, 4);
  for (const c of categories) {
    const record = records.find((r) => r.slug === c.slug);
    assert.ok(record);
    assert.equal(c.hero_media_id, record.hero.id);
    assert.equal(c.thumbnail_media_id, record.tile.id);
    assert.ok(c.is_enabled && c.is_published);
    for (const item of [record.hero, record.tile]) {
      const directory = path.join(process.env.MEDIA_DIR, item.storage_key);
      assert.deepEqual(
        await readFile(path.join(directory, "original.png")),
        await readFile(item.output),
      );
      const meta = await sharp(path.join(directory, "master.webp")).metadata();
      assert.ok(meta.width >= 1200 && meta.height >= 700);
    }
    const mobile = await sharp(
      path.join(process.env.MEDIA_DIR, record.hero.storage_key, "category-mobile-v2.webp"),
    ).metadata();
    assert.ok(mobile.width >= 768 && mobile.height >= 1600);
    assert.deepEqual(
      await readFile(
        path.join(
          process.env.MEDIA_DIR,
          record.hero.storage_key,
          "category-mobile-v2-original.png",
        ),
      ),
      await readFile(record.mobile.output),
    );
  }
  const wreathAssets = manifest.assets.filter((a) => a.slug === "sharing-wreaths");
  assert.equal(wreathAssets.length, 3);
  for (const a of wreathAssets) {
    assert.equal(a.references.length, 3);
    assert.ok(a.prompt.includes("THREE") && a.prompt.includes("EASEL STAND"));
    assert.ok(a.output.includes(a.kind === "tile" ? "stands-v3" : "stands-v2"));
  }
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => errors.push(e.message));
  const checkImage = async (image, record, variant) => {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((img) => img.decode());
    const url = new URL(await image.evaluate((img) => img.currentSrc), origin);
    assert.equal(url.searchParams.get("url"), `/media/${record.storage_key}/${variant}`);
    assert.equal(url.searchParams.get("q"), "90");
    assert.ok(await image.evaluate((img) => img.naturalWidth > 0));
    imageChecks++;
  };
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal((await page.goto(origin, { waitUntil: "networkidle" })).status(), 200);
    assert.equal(await page.locator(".v-collection-card.has-background").count(), 4);
    for (const c of categories) {
      const record = records.find((r) => r.slug === c.slug),
        card = page.locator(`.v-collection-card[href$='/products/category/${c.slug}']`);
      assert.equal(await card.locator("h3").innerText(), c.name);
      await checkImage(card.locator(".v-collection-visual > img"), record.tile, "master.webp");
      const resolution = await card.locator(".v-collection-visual > img").evaluate((img) => {
        const box = img.getBoundingClientRect();
        const ratio = img.naturalWidth / img.naturalHeight;
        const required =
          getComputedStyle(img).objectFit === "cover"
            ? Math.max(box.width, box.height * ratio)
            : Math.min(box.width, box.height * ratio);
        return { width: img.naturalWidth, required };
      });
      assert.ok(
        resolution.width >= resolution.required * 0.98,
        `${c.slug}: adequate image resolution after cropping at ${width}px`,
      );
      assert.equal(
        await card.evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--collection-ground").trim(),
        ),
        "#213f34",
      );
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator(".v-collection-gallery").screenshot({
      path: `${screenshots}/homepage-${width}.png`,
      style: ".v-header{visibility:hidden}",
    });
    assert.equal(
      await page.locator('#featured [data-active="true"] h3 a').getAttribute("href"),
      "/products/wreath-khao-phisuth",
    );
    for (const c of categories) {
      const record = records.find((r) => r.slug === c.slug);
      assert.equal(
        (
          await page.goto(`${origin}/products/category/${c.slug}`, { waitUntil: "networkidle" })
        ).status(),
        200,
      );
      assert.equal(await page.locator("main h1").innerText(), c.name);
      const hero = page.locator(".v-category-panorama"),
        cover = page.locator(".v-category-cover"),
        image = cover.locator("img");
      assert.equal(await hero.count(), 1);
      await checkImage(
        image,
        record.hero,
        width <= 760 ? "category-mobile-v2.webp" : "master.webp",
      );
      const bannerBox = await hero.boundingBox(),
        imageBox = await cover.boundingBox(),
        copyBox = await page.locator(".v-category-hero-copy").boundingBox();
      for (const dimension of ["width", "height", "x", "y"])
        assert.ok(
          Math.abs(bannerBox[dimension] - imageBox[dimension]) <= 2,
          `${c.slug}: photograph fills ${dimension}`,
        );
      assert.ok(
        copyBox.x >= bannerBox.x && copyBox.x + copyBox.width <= bannerBox.x + bannerBox.width + 1,
      );
      assert.ok(
        copyBox.y >= bannerBox.y &&
          copyBox.y + copyBox.height <= bannerBox.y + bannerBox.height + 1,
      );
      assert.equal(await image.evaluate((img) => getComputedStyle(img).objectFit), "cover");
      assert.equal(await cover.locator('source[media="(max-width: 760px)"]').count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok((await page.locator(".v-product-card").count()) > 0);
      await hero.screenshot({
        path: `${screenshots}/${c.slug}-${width}.png`,
        style: ".v-header{visibility:hidden}",
      });
    }
    console.log(
      `PASS all four homepage tiles, full-width heroes and responsive images at ${width}px`,
    );
  }
  for (const actor of report.actors) {
    const [user] = await sql`select is_active from users where id=${actor}`;
    assert.equal(user.is_active, false);
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `${root}/verification.json`,
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        origin,
        widths,
        categories: 4,
        homepage_tiles: 4,
        panoramic_heroes: 4,
        mobile_variants: 4,
        image_checks: imageChecks,
        full_banner_geometry_verified: true,
        original_uploads_byte_identical: true,
        three_standing_wreath_references: true,
        existing_featured_wreath_first: true,
        quality: 90,
        adequate_homepage_resolution_after_cropping: true,
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
