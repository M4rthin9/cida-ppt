import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const root = "content/new-wreaths";
const sourceRoot = process.argv[2] || path.join(homedir(), "Downloads");
const designs = [
  [
    "coral",
    "Vibrant Coral Oval Floral Wreath.png",
    "พวงหรีดแบ่งปัน รุ่นใหม่ โทนคอรัล",
    "พวงหรีดทรงวงรีโทนคอรัล ชมพู ส้ม และขาว ตกแต่งมาลัย พร้อมขาตั้งสีขาว",
  ],
  [
    "white-green",
    "Elegant White and Green Floral Wreath.png",
    "พวงหรีดแบ่งปัน รุ่นใหม่ ขาวเขียว",
    "พวงหรีดทรงวงรีโทนขาวและเขียว ตกแต่งดอกไม้และมาลัย พร้อมขาตั้งสีขาว",
  ],
  [
    "yellow-white",
    "Ceremonial Yellow and White Floral Wreath.png",
    "พวงหรีดแบ่งปัน รุ่นใหม่ เหลืองขาว",
    "พวงหรีดทรงวงรีโทนเหลืองและขาว ประดับยอดและมาลัย พร้อมขาตั้งสีขาว",
  ],
  [
    "royal-blue",
    "Royal Blue Floral Wreath Display.png",
    "พวงหรีดแบ่งปัน รุ่นใหม่ รอยัลบลู",
    "พวงหรีดพื้นสีน้ำเงิน ประดับดอกไม้โทนฟ้าและขาวพร้อมมาลัย บนขาตั้งสีขาว",
  ],
  [
    "thai-red-white",
    "Thai Floral Wreath on White Easel.png",
    "พวงหรีดแบ่งปัน รุ่นใหม่ แดงขาวทรงไทย",
    "พวงหรีดพื้นสีดำ ตกแต่งดอกไม้โทนแดงและขาว ยอดทรงไทย และมาลัย พร้อมขาตั้งสีขาว",
  ],
  [
    "pink",
    "Elegant Pink Floral Wreath on Easel.png",
    "พวงหรีดแบ่งปัน รุ่นใหม่ ชมพูขาว",
    "พวงหรีดพื้นสีงาช้าง ประดับดอกไม้โทนชมพูและขาวพร้อมมาลัย บนขาตั้งสีขาว",
  ],
];
await mkdir(root, { recursive: true });
const products = [];
for (const [key, filename, name_th, description] of designs) {
  assert.match(name_th, /[\u0e00-\u0e7f]/);
  const source = path.resolve(sourceRoot, filename);
  const bytes = await readFile(source);
  const output = `${root}/${key}.png`;
  await copyFile(source, output);
  products.push({
    key,
    source,
    output,
    source_sha256: createHash("sha256").update(bytes).digest("hex"),
    name_th,
    slug: `wreath-premium-${key}`,
    short_description_th: description,
    description_th: description,
    price: 5000,
    sharing_price: 2000,
    is_featured: true,
    display_order: products.length,
  });
}
await writeFile(
  `${root}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      category_slug: "sharing-wreaths",
      confirmation:
        "User supplied six new wreath images and requested featured placement, new category covers, sharing price 2000 THB and outright price 5000 THB. Existing wreath prices remain unchanged.",
      products,
    },
    null,
    2,
  ) + "\n",
);
console.log("Prepared six supplied original photographs and UTF-8 Thai product descriptions.");
