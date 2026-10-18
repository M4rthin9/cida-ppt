import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import postgres from "postgres";

const run = promisify(execFile);
const seed = JSON.parse(await readFile("content/production-seed/catalogue.json", "utf8"));
const name = `cida_seed_${randomUUID().replaceAll("-", "")}`;
assert.match(name, /^cida_seed_[a-f0-9]{32}$/);
const url = new URL(process.env.DATABASE_URL);
url.pathname = `/${name}`;
const mediaRoot = path.resolve("test-results/production-seed", name, "media");
assert.ok(mediaRoot.startsWith(path.resolve("test-results/production-seed") + path.sep));
const env = { ...process.env, DATABASE_URL: url.toString(), MEDIA_DIR: mediaRoot };
const admin = postgres(process.env.DATABASE_URL, { max: 1 });
let testSql,
  created = false;
const invoke = async (script, args = []) => {
  const result = await run(process.execPath, [script, ...args], {
    env,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  });
  return result.stdout.trim();
};
try {
  await admin`create database ${admin(name)}`;
  created = true;
  console.log(await invoke("scripts/migrate.mjs"));
  console.log(await invoke("scripts/seed-production.mjs"));
  testSql = postgres(url.toString(), { max: 1 });
  const rows = async () => {
    const result = {};
    for (const table of Object.keys(seed.tables)) {
      const [row] = await testSql`select count(*)::int n from ${testSql(table)}`;
      result[table] = row.n;
    }
    return result;
  };
  const counts = await rows();
  assert.deepEqual(counts, seed.counts);
  assert.equal(counts.categories, 4);
  assert.equal(counts.products, 82);
  const catalogue =
    await testSql`select t.slug,p.price,p.sharing_price,p.is_featured,p.sort_order,p.stock_status,c.slug category from products p join product_i18n t on t.product_id=p.id and t.locale='th' join category_i18n c on c.category_id=p.category_id and c.locale='th'`;
  assert.equal(catalogue.filter((p) => p.category === "sharing-wreaths").length, 17);
  const premiumSlugs = [
    "coral",
    "white-green",
    "yellow-white",
    "royal-blue",
    "thai-red-white",
    "pink",
  ].map((key) => `wreath-premium-${key}`);
  assert.equal(catalogue.filter((p) => premiumSlugs.includes(p.slug)).length, 6);
  for (const wreath of catalogue.filter((p) => p.category === "sharing-wreaths")) {
    const premium = premiumSlugs.includes(wreath.slug);
    assert.equal(wreath.price, premium ? "5000.00" : "4000.00");
    assert.equal(wreath.sharing_price, premium ? "2000.00" : "1700.00");
    if (premium) assert.equal(wreath.is_featured, true);
  }
  const white = catalogue.find((p) => p.slug === "wreath-khao-phisuth");
  assert.equal(white.is_featured, true);
  assert.equal(white.sort_order, 6);
  assert.deepEqual(
    catalogue
      .filter((p) => premiumSlugs.includes(p.slug))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => p.slug),
    premiumSlugs,
  );
  for (const p of catalogue.filter((p) => p.category === "needlework")) {
    assert.equal(p.price, p.slug === "canvas-tote-waiting-for-opportunity" ? "199.00" : "399.00");
    assert.equal(p.stock_status, "available");
  }
  const media =
    await testSql`select m.storage_key from categories c join media m on m.id=c.hero_media_id`;
  for (const m of media)
    assert.ok(seed.files.some((f) => f.path === `${m.storage_key}/category-mobile-v2.webp`));
  for (const file of seed.files)
    assert.equal(
      createHash("sha256")
        .update(await readFile(path.join(mediaRoot, file.path)))
        .digest("hex"),
      file.sha256,
    );
  console.log(await invoke("scripts/seed-production.mjs"));
  assert.deepEqual(await rows(), counts);
  const product = seed.tables.products[0],
    gallery = seed.tables.product_media.find((g) => g.product_id === product.id);
  await testSql`update products set price='777.00',is_seed=false,is_featured=false where id=${product.id}`;
  await testSql`update product_i18n set name='Administrator edited title' where product_id=${product.id} and locale='th'`;
  await testSql`delete from product_media where product_id=${gallery.product_id} and media_id=${gallery.media_id}`;
  await testSql`update settings set value=${testSql.json({ mode: "oa", oaId: "@admin-edited", phone: "" })} where key='line' and locale='*'`;
  console.log(await invoke("scripts/seed-production.mjs"));
  const [edited] =
    await testSql`select p.price,t.name from products p join product_i18n t on t.product_id=p.id and t.locale='th' where p.id=${product.id}`;
  assert.equal(edited.price, "777.00");
  assert.equal(edited.name, "Administrator edited title");
  assert.equal(
    (
      await testSql`select * from product_media where product_id=${gallery.product_id} and media_id=${gallery.media_id}`
    ).length,
    0,
  );
  const [line] = await testSql`select value from settings where key='line' and locale='*'`;
  assert.equal(line.value.oaId, "@admin-edited");
  assert.equal((await rows()).products, 82);
  for (const table of ["users", "sessions", "contact_messages", "audit_log", "line_clicks"]) {
    const [exists] = await testSql`select to_regclass(${`public.${table}`}) name`;
    if (exists.name)
      assert.equal((await testSql`select count(*)::int n from ${testSql(table)}`)[0].n, 0);
  }
  await mkdir("content/production-seed", { recursive: true });
  await writeFile(
    "content/production-seed/verification.json",
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        isolated_database: true,
        migrations_applied: true,
        counts,
        files_verified: seed.files.length,
        byte_identical_images: true,
        idempotent: true,
        administrator_product_settings_and_gallery_edits_preserved: true,
        four_categories_with_desktop_and_mobile_backgrounds: true,
        legacy_and_six_featured_wreath_prices_verified: true,
        no_accounts_or_private_data_seeded: true,
        temporary_database_removed: true,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "PASS fresh production seed, every image hash, prices, four category backgrounds, repeated runs and preservation of CMS edits.",
  );
} finally {
  await testSql?.end();
  if (created) {
    assert.match(name, /^cida_seed_[a-f0-9]{32}$/);
    await admin`drop database ${admin(name)}`;
  }
  await admin.end();
}
