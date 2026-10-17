import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = "content/artificial-flowers";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
let report;
try {
  report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const escape = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const price = (amount) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
for (const product of manifest.products) {
  try {
    const meta = await sharp(product.output).metadata();
    product.output_width = meta.width;
    product.output_height = meta.height;
    product.generation_status = "complete";
  } catch (error) {
    if (!error.message.includes("missing") && error.code !== "ENOENT") throw error;
  }
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
const cards = manifest.products
  .map((product) => {
    const record = report?.products.find((p) => p.key === product.key && p.completed);
    return `<article><header><span>${product.key}</span><h2>${escape(product.name_th)}</h2><strong>${price(product.price)}${product.selling_unit ? " / ชุด 2 ใบ" : ""}</strong></header><p>${escape(product.short_description_th)}</p><div class="photos"><figure><div class="photo"><img src="references/${product.key}.jpg" alt="ภาพต้นฉบับ ${escape(product.name_th)}"></div><figcaption>ต้นฉบับ: ${escape(product.filename)}</figcaption></figure><figure><div class="photo studio">${product.generation_status === "complete" ? `<img src="studio/${product.key}.png" alt="ภาพสตูดิโอ ${escape(product.name_th)}">` : "กำลังเตรียมภาพ"}</div><figcaption>ภาพพรีเมียมพื้นหลังโปร่งใส</figcaption></figure></div><p class="metadata">พร้อมส่ง · หมวดดอกไม้ประดิษฐ์${record ? " · เผยแพร่แล้ว" : " · เตรียมนำเข้า"}</p>${record ? `<p><a href="${report.origin}/products/${product.slug}">ดูสินค้าบนเว็บไซต์ ↗</a> · <a href="${report.origin}/admin/products/${record.id}">แก้ไขใน CMS ↗</a></p>` : ""}</article>`;
  })
  .join("\n");
await writeFile(
  `${root}/review.html`,
  `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ดอกไม้ประดิษฐ์ — ชื่อ ราคา และภาพสินค้า</title><style>body{margin:0;background:#f6f2e9;color:#213f34;font:16px/1.8 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:40px 24px}h1,h2{font-weight:500;line-height:1.5}h1{font-size:32px}h2{font-size:22px;margin:8px 0}a{color:inherit}article{margin:32px 0;padding:28px;background:#fffdf7;border:1px solid #d8dbce;border-radius:16px}header>span,.metadata,figcaption{color:#667064;font-size:13px}strong{color:#806431;font-size:20px;font-weight:500}.photos{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}.photo{aspect-ratio:1;display:grid;place-items:center;background:#f7f3e9;border:1px solid #e3e2d7;overflow:hidden}.photo img{width:100%;height:100%;object-fit:contain}.studio{background:linear-gradient(145deg,#f4f0e3,#fffdf7 55%,#e8eddf)}.studio img{width:86%;height:86%;filter:drop-shadow(0 12px 10px #213f3425)}figcaption{padding-top:8px}@media(max-width:600px){article{padding:18px}.photos{grid-template-columns:1fr}}</style><main><h1>ดอกไม้ประดิษฐ์ 13 แบบ</h1><p>ชื่อที่ตั้งให้แต่ละแบบและราคาตามชื่อไฟล์ต้นฉบับ ผู้ใช้ยืนยันว่าพร้อมส่งและให้แสดงขายบนเว็บไซต์ ชุดแจกันสีฟ้า 3,500 บาทและสีม่วง 4,000 บาทเป็นราคาสำหรับคู่ (2 ใบ)</p><p><a href="manifest.json">ข้อมูลสินค้า แหล่งภาพ และคำสั่งสร้างภาพทั้งหมด</a></p>${cards}</main></html>`,
);
console.log("Saved named-product review with exact prices and before/after photos.");
