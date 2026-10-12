import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import { chromium } from "playwright";

const directory = "content/fiberglass-drafts";
const imported = JSON.parse(await readFile(`${directory}/cms-import.json`, "utf8"));
const photos = JSON.parse(await readFile(`${directory}/presentation/manifest.json`, "utf8"));
assert.equal(imported.products.length, 29);
if (!process.argv.includes("--apply")) {
  console.log(
    "Publish the 29 imported fiberglass products through the CMS: node --env-file=.env scripts/publish-fiberglass-catalogue.mjs --apply",
  );
  process.exit(0);
}
const origin = new URL(process.env.AUTH_URL || "http://localhost:3000").origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const actor = randomUUID(),
  password = randomBytes(32).toString("base64url") + "Aa1!";
const email = `catalogue-publish-${actor}@example.invalid`;
let actorCreated = false,
  browser;
const report = {
  authorized: "User requested finish images and publish",
  published: [],
  photos_verified: 0,
};
const persist = () =>
  writeFile(`${directory}/publication.json`, JSON.stringify(report, null, 2) + "\n");
try {
  const before = [];
  // Validate every product and image before changing any publication state.
  for (const entry of imported.products) {
    const [row] =
      await sql`select p.*,t.name,t.slug,t.body from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.id=${entry.id}`;
    assert.equal(row.name, entry.name_th);
    assert.equal(row.slug, entry.slug);
    assert.equal(Number(row.price), entry.price);
    assert.equal(row.stock_status, "available");
    assert.ok(["draft", "published"].includes(row.status));
    assert.equal(row.deleted_at, null);
    const media =
      await sql`select m.id,m.storage_key from product_media pm join media m on m.id=pm.media_id and m.deleted_at is null where pm.product_id=${entry.id} order by pm.sort_order`;
    assert.deepEqual(
      media.map((m) => m.id),
      entry.media_ids,
    );
    assert.ok(media.length > 0);
    for (const item of media) {
      const importedMedia = imported.media.find((m) => m.id === item.id);
      assert.ok(importedMedia);
      const photo = photos.photos.find((p) => p.file === importedMedia.file);
      const original = await readFile(path.join(directory, photo.source));
      assert.equal(createHash("sha256").update(original).digest("hex"), photo.source_sha256);
      assert.deepEqual(
        await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "original.png")),
        await readFile(path.join(directory, photo.file)),
      );
      await readFile(path.join(process.env.MEDIA_DIR, item.storage_key, "master.webp"));
      report.photos_verified++;
    }
    before.push(row);
  }
  try {
    await writeFile(
      `${directory}/publication-before.json`,
      JSON.stringify(before, null, 2) + "\n",
      { flag: "wx" },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  console.log(
    `Preflight passed: 29 products, ${report.photos_verified} images, source bytes preserved.`,
  );
  const pending = imported.products.filter((p) => !before.find((r) => r.id === p.id)?.is_published);
  if (pending.length) {
    await sql`insert into users(id,email,password_hash,name,role,is_active) values(${actor},${email},${await hash(password)},'Authorised catalogue publication','editor',true)`;
    actorCreated = true;
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.goto(origin + "/admin/login", { waitUntil: "networkidle" });
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(origin + "/admin");
    for (const entry of pending) {
      await page.goto(`${origin}/admin/products/${entry.id}`, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".cms-media-item").count(), entry.media_ids.length);
      if (entry.source_row === 20) {
        const field = page.locator('[name="description_th"]');
        const existing = await field.inputValue();
        const note = "กรุณาสอบถามรูปแบบและจำนวนชิ้นต่อชุดก่อนสั่งซื้อ";
        if (!existing.includes(note)) await field.fill(existing + "\n" + note);
      }
      await page.locator('[name="status"]').selectOption("published");
      await page.locator('.cms-save button[type="submit"]').click();
      await page.locator(".cms-success").waitFor();
      const [saved] =
        await sql`select status,is_published,published_at,stock_status,price from products where id=${entry.id}`;
      assert.equal(saved.status, "published");
      assert.equal(saved.is_published, true);
      assert.equal(saved.stock_status, "available");
      assert.equal(Number(saved.price), entry.price);
      assert.ok(new Date(saved.published_at).getTime() <= Date.now());
      report.published.push({
        id: entry.id,
        name_th: entry.name_th,
        slug: entry.slug,
        published_at: saved.published_at,
      });
      await persist();
      console.log(`Published ${report.published.length}/${pending.length}: ${entry.name_th}`);
    }
  }
  const ids = imported.products.map((p) => p.id);
  const rows =
    await sql`select p.id,t.name name_th,t.slug,p.published_at from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.id in ${sql(ids)} and p.status='published' and p.is_published=true and p.published_at<=now() and p.deleted_at is null`;
  assert.equal(rows.length, 29);
  report.published = rows;
  report.verified_at = new Date().toISOString();
  await persist();
  console.log("All 29 fiberglass products published and verified.");
} finally {
  if (actorCreated)
    await sql`update users set is_active=false,session_version=session_version+1,updated_at=now() where id=${actor}`;
  await browser?.close();
  await sql.end();
}
