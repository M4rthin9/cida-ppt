/** Idempotent configuration seed. Never inserts fictional products or news. */
import { v5 as seedId } from "uuid";
import { sql } from "./client";
const categories = [
  [
    "sharing-wreaths",
    "พวงหรีดแบ่งปัน",
    "wreath",
    "งานประดิษฐ์ที่ถ่ายทอดความตั้งใจ ผ่านการฝึกฝนและการสร้างคุณค่าจากทุกขั้นตอน",
  ],
  [
    "fiberglass-and-wood",
    "ไฟเบอร์กลาส และ ไม้",
    "material",
    "จากวัสดุ สู่ผลงานที่มีรูปทรงและคุณค่า ฝึกทักษะการขึ้นรูป ขัดแต่ง ทำสี และประกอบชิ้นงาน",
  ],
  [
    "artificial-flowers",
    "ดอกไม้ประดิษฐ์",
    "flower",
    "รายละเอียดของกลีบดอก สีสัน และการจัดวาง ถ่ายทอดความประณีตของงานฝีมือ",
  ],
  [
    "needlework",
    "เย็บปักถักร้อย",
    "textile",
    "ทุกฝีเข็ม คือการฝึกความละเอียดและความอดทน ผ่านงานเย็บ ปัก ถัก และงานผ้า",
  ],
] as const;
async function main() {
  await sql.begin(async (tx) => {
    for (const [code, label, enabled] of [
      ["th", "ไทย", true],
      ["en", "English", false],
      ["zh-Hans", "简体中文", false],
    ] as const)
      await tx`insert into locales(code,label_native,is_default,is_enabled,sort_order) values(${code},${label},${code === "th"},${enabled},${code === "th" ? 0 : 1}) on conflict(code) do nothing`;
    for (const [i, [slug, name, icon, description]] of categories.entries()) {
      // Stable identities keep a later seed from recreating a category after
      // an administrator renames its slug or archives it.
      const id = seedId(`cida-ppt:category:${slug}`, seedId.URL);
      const exists =
        await tx`select category_id from category_i18n where category_id=${id} or (locale='th' and slug=${slug})`;
      if (exists.length) continue;
      await tx`insert into categories(id,icon,sort_order,status,is_enabled,is_published,is_featured) values(${id},${icon},${i},'published',true,true,true)`;
      await tx`insert into category_i18n(category_id,locale,name,slug,short_description,description) values(${id},'th',${name},${slug},${description},${description})`;
    }
  });
  console.log("Seed complete: four vocational categories; no sample products/news.");
}
main().finally(() => sql.end());
