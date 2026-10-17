import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const root = "content/needlework";
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
  try {
    const meta = await sharp(p.output).metadata();
    p.output_width = meta.width;
    p.output_height = meta.height;
    p.generation_status = "complete";
  } catch (e) {
    if (!e.message.includes("missing") && e.code !== "ENOENT") throw e;
  }
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
const cards = manifest.products
  .map(
    (p) =>
      `<article><small>${p.key} · ${escape(p.filename)}</small><h2>${escape(p.name_th)}</h2><strong>${p.price.toLocaleString("th-TH")} บาท / ${p.kind === "bag" ? "ใบ" : "ตัว"}</strong><div class="photos"><figure><div class="photo"><img src="references/${escape(p.reference.split("/").pop())}" alt="ภาพต้นฉบับ"></div><figcaption>ลายต้นฉบับ</figcaption></figure><figure><div class="photo studio">${p.generation_status === "complete" ? `<img src="studio/${escape(p.output.split("/").pop())}" alt="${escape(p.name_th)}">` : "กำลังจัดทำภาพ"}</div><figcaption>ภาพพรีเมียมพื้นหลังโปร่งใส${p.output_width ? ` · ${p.output_width} × ${p.output_height}` : ""}</figcaption></figure></div>${report?.products.some((r) => r.key === p.key && r.completed) ? `<p><a href="${report.origin}/products/${p.slug}">ดูสินค้าบนเว็บไซต์ ↗</a></p>` : ""}</article>`,
  )
  .join("\n");
await writeFile(
  `${root}/review.html`,
  `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>เย็บปักถักร้อย — ภาพและราคาสินค้า</title><style>body{margin:0;background:#f6f2e9;color:#213f34;font:16px/1.8 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:40px 24px}h1,h2{font-weight:500}a{color:inherit}article{margin:28px 0;padding:28px;background:#fffdf7;border:1px solid #d8dbce;border-radius:16px}small,figcaption{font-size:13px;color:#667064}strong{color:#806431;font-weight:500}.photos{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}figure{margin:0}.photo{aspect-ratio:1;background:#f7f3e9;display:grid;place-items:center}.photo img{width:100%;height:100%;object-fit:contain}.studio{background:linear-gradient(145deg,#f4f0e3,#fffdf7 55%,#e8eddf)}.studio img{width:86%;height:86%;filter:drop-shadow(0 12px 10px #213f3425)}@media(max-width:600px){.photos{grid-template-columns:1fr}article{padding:18px}}</style><main><h1>เย็บปักถักร้อย 23 แบบ</h1><p>เสื้อยืด 22 ลาย ราคา 399 บาททุกลาย · กระเป๋าผ้า 1 แบบ ราคา 199 บาท เก็บสี ลาย และตำแหน่งงานปักตามต้นฉบับ ปรับการถ่ายภาพและแสงให้เข้ากับเว็บไซต์</p><p><a href="manifest.json">แหล่งภาพ ชื่อสินค้า ราคา และคำสั่งสร้างภาพทั้งหมด — built-in image_gen</a></p>${cards}</main></html>`,
);
console.log("Saved needlework names, prices, full prompts and before/after review.");
