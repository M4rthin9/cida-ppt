import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import postgres from "postgres";

const root = "content/category-banners/studio-v4";
const report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
const origin = new URL(process.env.AUTH_URL || "http://localhost:3000");
assert.ok(["localhost", "127.0.0.1"].includes(origin.hostname));
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const restored = report.categories.filter((c) => c.slug !== "fiberglass-and-wood");
assert.equal(restored.length, 3);
try {
  const products = await sql`select * from products order by id`;
  const galleries = await sql`select * from product_media order by product_id,sort_order,media_id`;
  await sql.begin(async (tx) => {
    for (const record of restored) {
      const [current] = await tx`select * from categories where id=${record.id} for update`;
      assert.ok(current);
      const alreadyRestored = ["hero_media_id", "thumbnail_media_id"].every(
        (field) => current[field] === record.before[field],
      );
      if (!alreadyRestored) {
        for (const media of record.media)
          assert.equal(current[media.field], media.id, `${record.slug}: expected installed media`);
        for (const [field, value] of Object.entries(record.before)) {
          if (["hero_media_id", "thumbnail_media_id", "updated_by", "updated_at"].includes(field))
            continue;
          assert.equal(
            JSON.stringify(current[field]),
            JSON.stringify(value),
            `${record.slug}: no unrelated changes`,
          );
        }
        const patch = Object.fromEntries(
          ["hero_media_id", "thumbnail_media_id", "updated_by", "updated_at"].map((field) => [
            field,
            record.before[field],
          ]),
        );
        await tx`update categories set ${tx(patch)} where id=${record.id}`;
      }
      const texts =
        await tx`select locale,name,slug,description,short_description,seo_title,seo_description from category_i18n where category_id=${record.id} for update`;
      for (const text of texts) {
        const previous = record.before_text.find((old) => old.locale === text.locale);
        if (previous) {
          for (const [field, value] of Object.entries(previous))
            assert.equal(text[field] ?? "", value ?? "", `${record.slug}: text unchanged`);
          const { locale, ...fields } = previous;
          await tx`update category_i18n set ${tx(fields)} where category_id=${record.id} and locale=${locale}`;
        } else {
          assert.equal(text.locale, "en");
          assert.equal(text.slug, record.slug);
          for (const field of [
            "name",
            "description",
            "short_description",
            "seo_title",
            "seo_description",
          ])
            assert.equal(text[field] ?? "", "");
          await tx`delete from category_i18n where category_id=${record.id} and locale=${text.locale}`;
        }
      }
      const [after] = await tx`select * from categories where id=${record.id}`;
      assert.equal(JSON.stringify(after), JSON.stringify(record.before));
      assert.deepEqual(
        [
          ...(await tx`select locale,name,slug,description,short_description,seo_title,seo_description from category_i18n where category_id=${record.id} order by locale`),
        ],
        record.before_text,
      );
    }
  });
  assert.deepEqual(await sql`select * from products order by id`, products);
  assert.deepEqual(
    await sql`select * from product_media order by product_id,sort_order,media_id`,
    galleries,
  );
  for (const record of restored) record.restored_at = new Date().toISOString();
  report.scope = "Fiberglass and wood only, as clarified by the user";
  report.restoration_method =
    "Guarded local SQL transaction restoring recorded category snapshots and original language fields";
  await writeFile(`${root}/installation.json`, JSON.stringify(report, null, 2) + "\n");
  console.log(
    "Restored all three other category records and original language fields. Fiberglass banners and product galleries retained.",
  );
} finally {
  await sql.end();
}
