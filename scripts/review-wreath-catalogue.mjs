import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const root = "content/sharing-wreaths";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
let report;
try {
  report = JSON.parse(await readFile(`${root}/installation.json`, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const escape = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
for (const p of manifest.products) {
  const meta = await sharp(p.output).metadata();
  p.output_width = meta.width;
  p.output_height = meta.height;
  p.generation_status = "complete";
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
const cards = manifest.products
  .map(
    (p) =>
      `<article><small>${p.key}${p.is_featured ? " · สินค้าแนะนำอันดับ 1" : ""}</small><h2>${escape(p.name_th)}</h2><dl><div><dt>ราคาแบ่งปัน</dt><dd>1,700 บาท</dd></div><div><dt>ราคาขายขาด</dt><dd>4,000 บาท</dd></div></dl><div class="photos"><figure><div class="photo"><img src="references/${escape(p.reference.split("/").pop())}" alt="ภาพต้นฉบับ"></div><figcaption>ต้นฉบับ: ${escape(p.source.split(/[\\/]/).pop())}</figcaption></figure><figure><div class="photo studio"><img src="studio/wreath-${p.key}.png" alt="${escape(p.name_th)}"></div><figcaption>ภาพสินค้าใหม่ · ${p.output_width} × ${p.output_height} · PNG โปร่งใส</figcaption></figure></div>${report?.products.some((r) => r.key === p.key && r.completed) ? `<p><a href="${report.origin}/products/${p.slug}">ดูสินค้าบนเว็บไซต์ ↗</a></p>` : ""}</article>`,
  )
  .join("\n");
await writeFile(
  `${root}/review.html`,
  `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>พวงหรีดแบ่งปัน — ภาพและราคาสินค้า</title><style>body{margin:0;background:#f6f2e9;color:#213f34;font:16px/1.8 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:40px 24px}h1,h2{font-weight:500}a{color:inherit}article{margin:28px 0;padding:28px;background:#fffdf7;border:1px solid #d8dbce;border-radius:16px}small,figcaption{font-size:13px;color:#667064}.photos{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}.photo{aspect-ratio:1;background:#f7f3e9;display:grid;place-items:center}.photo img{width:100%;height:100%;object-fit:contain}.studio{background:linear-gradient(145deg,#f4f0e3,#fffdf7 55%,#e8eddf)}.studio img{width:86%;height:86%;filter:drop-shadow(0 12px 10px #213f3425)}dl{max-width:360px}dl>div{display:flex;justify-content:space-between}dd{margin:0;color:#806431}@media(max-width:600px){.photos{grid-template-columns:1fr}article{padding:18px}}</style><main><h1>พวงหรีดแบ่งปัน 11 แบบ</h1><p>ผู้ใช้ยืนยันให้แยกสินค้า 11 แบบ เลือก “ขาวพิสุทธิ์” เป็นสินค้าแนะนำอันดับแรก ราคาแบ่งปัน 1,700 บาท และราคาขายขาด 4,000 บาททุกแบบ ภาพซ้ำ 06/07 และ 13/IMG_0164 ใช้เป็นหลักฐานอ้างอิง ไม่สร้างสินค้าซ้ำ</p><p><a href="manifest.json">ไฟล์ภาพต้นฉบับและคำสั่งสร้างภาพทั้งหมด — built-in image_gen</a></p>${cards}</main></html>`,
);
console.log("Saved 11-product wreath review with both prices and image provenance.");
