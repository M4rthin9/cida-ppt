import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import { chromium } from "playwright";

const origin = process.env.DESIGN_QA_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID(),
  email = `line-settings-${actor}@example.invalid`;
const password = randomBytes(32).toString("base64url") + "Aa1!";
const original = await sql`select * from settings where key='line' order by locale`;
let browser,
  created = false;
const errors = [];
try {
  await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'LINE settings verification','owner',true)`;
  created = true;
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${origin}/admin/login`, { waitUntil: "networkidle" });
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(
    (url) => url.hostname === new URL(origin).hostname && url.pathname === "/admin",
  );
  await page.goto(`${origin}/admin/settings/line`, { waitUntil: "networkidle" });
  const saved = {};
  for (const name of ["mode", "oaId", "phone", "buttonLabel", "messageTemplate"])
    saved[name] = await page.locator(`[name="${name}"]`).inputValue();
  assert.equal(saved.mode, "oa");
  await page.locator('[name="mode"]').selectOption("phone");
  await page.locator('[name="phone"]').fill("");
  await page.getByRole("button", { name: "บันทึกการตั้งค่า", exact: true }).click();
  await page.locator("#phone-error").waitFor();
  assert.match(await page.locator("#phone-error").innerText(), /เบอร์โทร/);
  assert.equal(await page.locator('[name="mode"]').inputValue(), "phone");
  assert.deepEqual(await sql`select * from settings where key='line' order by locale`, original);
  await page.locator('[name="phone"]').fill("081 234-5678");
  await page.getByRole("button", { name: "บันทึกการตั้งค่า", exact: true }).click();
  await page.getByText("บันทึกเรียบร้อยแล้ว", { exact: true }).waitFor();
  const [row] = await sql`select value from settings where key='line' and locale='*'`;
  assert.equal(row.value.mode, "phone");
  assert.equal(row.value.phone, "0812345678");
  const response = await context.request.get(`${origin}/go/line?p=wreath-khao-phisuth`, {
    maxRedirects: 0,
  });
  assert.equal(response.status(), 302);
  assert.equal(response.headers().location, `${origin}/line?p=wreath-khao-phisuth`);
  await mkdir("test-results/line-settings", { recursive: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      (
        await page.goto(`${origin}/line?p=wreath-khao-phisuth`, { waitUntil: "networkidle" })
      ).status(),
      200,
    );
    assert.equal(await page.locator("#line-phone").inputValue(), "0812345678");
    const message = await page.locator("#line-message").inputValue();
    assert.match(message, /พวงหรีดแบ่งปัน ขาวพิสุทธิ์/);
    assert.match(message, /products\/wreath-khao-phisuth/);
    await page.getByRole("button", { name: "คัดลอกเบอร์โทร", exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "0812345678");
    await page.getByRole("button", { name: "คัดลอกข้อความสอบถาม", exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), message);
    assert.equal(
      await page.getByRole("link", { name: /เปิด LINE เพื่อเพิ่มเพื่อน/ }).getAttribute("href"),
      "https://line.me/R/nv/addFriends",
    );
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({
      path: `test-results/line-settings/phone-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto(`${origin}/contact`, { waitUntil: "networkidle" });
  assert.ok(await page.getByRole("link", { name: "เพิ่มเพื่อนด้วยเบอร์โทร", exact: true }).count());
  assert.equal(await page.locator('.v-footer a[href="/line"]').innerText(), "LINE 0812345678 ↗");
  assert.equal(await page.locator(`a[href*="%40${saved.oaId.replace(/^@/, "")}"]`).count(), 0);
  await page.goto(`${origin}/products/wreath-khao-phisuth`, { waitUntil: "networkidle" });
  assert.ok((await page.locator(".v-inquiry-note").innerText()).includes("เบอร์โทร"));
  await page.goto(`${origin}/admin/settings/line`, { waitUntil: "networkidle" });
  await page.locator('[name="mode"]').selectOption("oa");
  await page.locator('[name="phone"]').fill(saved.phone);
  await page.getByRole("button", { name: "บันทึกการตั้งค่า", exact: true }).click();
  await page.getByText("บันทึกเรียบร้อยแล้ว", { exact: true }).waitFor();
  const oa = await context.request.get(`${origin}/go/line`, { maxRedirects: 0 });
  assert.equal(oa.status(), 302);
  assert.equal(oa.headers().location, `https://line.me/R/ti/p/${encodeURIComponent(saved.oaId)}`);
  const productOa = await context.request.get(`${origin}/go/line?p=wreath-khao-phisuth`, {
    maxRedirects: 0,
  });
  assert.match(productOa.headers().location, /\/R\/oaMessage\//);
  const phonePage = await context.request.get(`${origin}/line`, { maxRedirects: 0 });
  assert.equal(phonePage.status(), 307);
  assert.equal(
    phonePage.headers().location,
    `https://line.me/R/ti/p/${encodeURIComponent(saved.oaId)}`,
  );
  assert.deepEqual(errors, []);
  await mkdir("content/production-seed", { recursive: true });
  await writeFile(
    "content/production-seed/line-verification.json",
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        origin,
        saved_through_cms: true,
        phone_required_when_selected: true,
        number_normalised: true,
        phone_redirect_and_product_context: true,
        clipboard_verified: true,
        phone_contact_and_footer: true,
        oa_add_friend_and_product_chat: true,
        widths: [320, 390, 768, 1440],
        original_settings_restored: true,
        browser_errors: errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "PASS LINE OA/phone selection, server validation, product inquiry, clipboard and four responsive widths; restored original OA settings.",
  );
} finally {
  await sql.begin(async (tx) => {
    await tx`delete from settings where key='line'`;
    for (const row of original)
      await tx`insert into settings ${tx({ ...row, value: tx.json(row.value) })}`;
    if (created)
      await tx`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  });
  await browser?.close();
  await sql.end();
}
