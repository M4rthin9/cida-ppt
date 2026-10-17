import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import { chromium } from "playwright";

const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const output = "test-results/admin-products";
await mkdir(output, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const actors = [],
  errors = [];
let paginationPages = 0;
try {
  const productsBefore = await sql`select * from products order by id`;
  const galleriesBefore = await sql`select * from product_media order by product_id,media_id`;
  const expected =
    await sql`select p.id,p.category_id,p.sharing_price,t.name,t.slug from products p join product_i18n t on t.product_id=p.id and t.locale='th' join categories c on c.id=p.category_id join category_i18n ct on ct.category_id=c.id and ct.locale='th' where p.deleted_at is null order by p.is_featured desc,p.sort_order,p.created_at desc,p.id`;
  const categories =
    await sql`select c.id,t.slug,t.name from categories c join category_i18n t on t.category_id=c.id and t.locale='th' where c.deleted_at is null order by c.sort_order,c.created_at`;
  assert.ok(expected.length > 20, "A multipage catalogue is required to exercise this regression");
  const pages = Math.ceil(expected.length / 20);
  const checkList = async (page, records, number = 1) => {
    await page
      .getByRole("heading", { name: new RegExp(`จัดการสินค้า\\s*${records.length}`) })
      .waitFor();
    assert.equal(await page.locator("#admin-error-title").count(), 0);
    const expectedLinks = records
      .slice((number - 1) * 20, number * 20)
      .map((p) => `/admin/products/${p.id}`);
    await page.waitForFunction(
      (hrefs) =>
        [...document.querySelectorAll(".cms-name")]
          .map((link) => link.getAttribute("href"))
          .join("\n") === hrefs.join("\n"),
      expectedLinks,
    );
    assert.deepEqual(
      await page
        .locator(".cms-name")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
      records.slice((number - 1) * 20, number * 20).map((p) => `/admin/products/${p.id}`),
    );
    if (records.length > 20)
      assert.equal(
        (await page.locator(".v-pager").innerText()).match(/หน้า (\d+) จาก (\d+)/)?.[1],
        String(number),
      );
  };
  for (const role of ["editor", "owner"]) {
    const id = randomUUID(),
      email = `products-qa-${id}@example.invalid`,
      password = randomBytes(32).toString("base64url") + "Aa1!";
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${id},${email},${await hash(password)},'Product page verification',${role},true)`;
    actors.push(id);
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${origin}/admin/login`, { waitUntil: "networkidle" });
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(
      (url) => url.hostname === new URL(origin).hostname && url.pathname === "/admin",
    );
    assert.equal(
      (await page.goto(`${origin}/admin/products`, { waitUntil: "networkidle" })).status(),
      200,
    );
    for (let number = 1; number <= pages; number++) {
      await checkList(page, expected, number);
      paginationPages++;
      if (number < pages) {
        const next = page.locator(".v-pager").getByRole("link", { name: /ถัดไป/ });
        assert.equal(new URL(await next.getAttribute("href"), origin).pathname, "/admin/products");
        await next.click();
        await page.waitForURL(
          (url) =>
            url.pathname === "/admin/products" &&
            url.searchParams.get("page") === String(number + 1),
        );
        await page.waitForLoadState("networkidle");
      }
    }
    assert.equal(await page.locator(".v-pager").getByRole("link", { name: /ถัดไป/ }).count(), 0);
    await page
      .locator(".v-pager")
      .getByRole("link", { name: /ก่อนหน้า/ })
      .click();
    await page.waitForURL((url) => url.searchParams.get("page") === String(pages - 1));
    await page.waitForLoadState("networkidle");
    await checkList(page, expected, pages - 1);
    await page.locator(".cms-name").first().click();
    await page.getByRole("heading", { name: "แก้ไขสินค้า", exact: true }).waitFor();
    const editId = page.url().split("/").at(-1),
      product = expected.find((p) => p.id === editId);
    assert.equal(await page.locator('[name="name_th"]').inputValue(), product.name);
    assert.equal(await page.locator("#admin-error-title").count(), 0);
    await page.getByRole("link", { name: /กลับรายการสินค้า/ }).click();
    await checkList(page, expected);
    await page
      .getByRole("link", { name: /เพิ่มสินค้า/, exact: false })
      .first()
      .click();
    await page.getByRole("heading", { name: "เพิ่มสินค้า", exact: true }).waitFor();
    assert.equal(await page.locator('[name="name_th"]').inputValue(), "");
    assert.equal(await page.locator("#admin-error-title").count(), 0);
    for (const category of categories) {
      await page.goto(`${origin}/admin/products`, { waitUntil: "networkidle" });
      await page.locator('[name="category"]').selectOption(category.id);
      await page.getByRole("button", { name: "ค้นหา", exact: true }).click();
      await page.waitForLoadState("networkidle");
      await checkList(
        page,
        expected.filter((p) => p.category_id === category.id),
      );
    }
    const category = categories.find((c) => c.slug === "fiberglass-and-wood");
    assert.ok(category);
    await page.goto(`${origin}/admin/products`, { waitUntil: "networkidle" });
    await page.locator('[name="category"]').selectOption(category.id);
    await page.locator('.cms-filters [name="q"]').fill(category.name);
    await page.locator('[name="sort"]').selectOption("name");
    await page.getByRole("button", { name: "ค้นหา", exact: true }).click();
    await page.waitForLoadState("networkidle");
    const filtered =
      await sql`select p.id from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.category_id=${category.id} and p.deleted_at is null order by t.name,p.id`;
    await checkList(page, filtered);
    assert.ok(filtered.length > 20);
    await page.locator(".v-pager").getByRole("link", { name: /ถัดไป/ }).click();
    await page.waitForLoadState("networkidle");
    await checkList(page, filtered, 2);
    const query = new URL(page.url()).searchParams;
    assert.equal(query.get("category"), category.id);
    assert.equal(query.get("q"), category.name);
    assert.equal(query.get("sort"), "name");
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${origin}/admin/products`, { waitUntil: "networkidle" });
      await checkList(page, expected);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${output}/${role}-list-${width}.png`, fullPage: true });
    }
    const sharing = expected.find((p) => p.sharing_price !== null);
    assert.ok(sharing);
    await page.goto(`${origin}/admin/products?q=${encodeURIComponent(sharing.name)}`, {
      waitUntil: "networkidle",
    });
    const prices = await page.locator(".v-price-options").first().innerText();
    assert.match(prices, /ราคาแบ่งปัน/);
    assert.match(prices, /1,700 บาท/);
    assert.match(prices, /ราคาขายขาด/);
    assert.match(prices, /4,000 บาท/);
    await page.goto(`${origin}/admin/news`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "ข่าวและกิจกรรม", exact: true }).waitFor();
    assert.equal(await page.locator("#admin-error-title").count(), 0);
    await page.goto(`${origin}/products/category/fiberglass-and-wood`, {
      waitUntil: "networkidle",
    });
    const publicNext = page.locator(".v-pager").getByRole("link", { name: /ถัดไป/ });
    assert.equal(
      new URL(await publicNext.getAttribute("href"), origin).pathname,
      "/products/category/fiberglass-and-wood",
    );
    await publicNext.click();
    await page.waitForURL(
      (url) =>
        url.pathname === "/products/category/fiberglass-and-wood" &&
        url.searchParams.get("page") === "2",
    );
    await page.waitForLoadState("networkidle");
    assert.equal(new URL(page.url()).searchParams.get("page"), "2");
    assert.equal(await page.locator(".v-product-card").count(), 12);
    await context.close();
    console.log(
      `PASS ${role}: all ${pages} product pages, previous/next, editors, four category filters, search/sort retention, prices and public pagination`,
    );
  }
  const anonymous = await browser.newPage();
  await anonymous.goto(`${origin}/admin/products`, { waitUntil: "networkidle" });
  assert.equal(new URL(anonymous.url()).pathname, "/admin/login");
  assert.equal(await anonymous.locator(".cms-name").count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(await sql`select * from products order by id`, productsBefore);
  assert.deepEqual(
    await sql`select * from product_media order by product_id,media_id`,
    galleriesBefore,
  );
  await writeFile(
    `${output}/verification.json`,
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        origin,
        products: expected.length,
        roles: ["editor", "owner"],
        pagination_pages_checked: paginationPages,
        previous_next_and_last_page: true,
        edit_and_create_pages_open: true,
        category_search_and_sort_preserved: true,
        sharing_and_outright_prices: true,
        public_pagination_unchanged: true,
        anonymous_access_protected: true,
        widths: [390, 1440],
        products_and_galleries_unchanged: true,
        browser_errors: errors,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  for (const id of actors)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${id}`;
  await browser.close();
  await sql.end();
}
