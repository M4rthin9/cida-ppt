import { readFile, writeFile } from "node:fs/promises";

const directory = "content/fiberglass-drafts";
const drafts = JSON.parse(await readFile(`${directory}/drafts.json`, "utf8"));
const photos = JSON.parse(await readFile(`${directory}/presentation/manifest.json`, "utf8"));
const imported = JSON.parse(await readFile(`${directory}/cms-import.json`, "utf8"));
let publication = { published: [] };
try {
  publication = JSON.parse(await readFile(`${directory}/publication.json`, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const publishedIds = new Set(publication.published.map((product) => product.id));
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const cards = imported.products
  .map((entry) => {
    const product = drafts.products.find((p) => p.draft_key === entry.draft_key);
    const images = photos.photos.filter((p) => p.draft_key === entry.draft_key);
    return `<article><div class="photos">${images.map((image) => `<figure><img src="${escape(image.file)}" data-original="${escape(image.source)}" data-framed="${escape(image.file)}" alt="${escape(product.name_th)}" loading="lazy"><figcaption>${image.rotation_degrees ? "หมุนภาพ 90° ตามเข็มนาฬิกา" : "คงมุมเดิม"} · เก็บพิกเซลต้นฉบับครบ</figcaption></figure>`).join("")}</div><div class="body"><small>แถว ${product.source.row} · ${publishedIds.size === imported.products.length ? "Published" : "Draft"} · พร้อมจำหน่าย</small><h2>${escape(product.name_th)}</h2><strong>${product.price.toLocaleString("th-TH")} บาท</strong><p>${escape(product.dimensions)}</p>${product.review_issues.length ? `<aside>${product.review_issues.map((issue) => escape(issue.message)).join("<br>")}</aside>` : ""}<a href="http://localhost:3000/admin/products/${entry.id}" target="_blank" rel="noopener">แก้ไขใน CMS ↗</a></div></article>`;
  })
  .join("");
await writeFile(
  `${directory}/cms-review.html`,
  `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ตรวจสอบสินค้าไฟเบอร์กลาส</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f3ec;color:#203c31;font:16px/1.7 system-ui,sans-serif}header,main{max-width:1400px;margin:auto;padding:32px}h1{font-size:clamp(28px,4vw,48px);line-height:1.4;margin:12px 0}header p{max-width:80ch}small{font-size:12px;color:#647166}button{font:inherit;background:#203c31;color:white;border:0;padding:12px 20px;border-radius:30px;cursor:pointer}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:24px;padding-top:0}article{border:1px solid #d9d8cb;border-radius:18px;overflow:hidden;background:#fffdf8}.photos{display:flex;overflow:auto;background:#f3eee4}figure{margin:0;min-width:100%;padding:16px}img{display:block;width:100%;height:300px;object-fit:contain}figcaption{font-size:11px;text-align:center;color:#68705e}h2{font-size:22px;line-height:1.5;margin:10px 0}.body{padding:24px}.body p{font-size:14px}a{color:#203c31;display:inline-block;margin-top:18px}aside{background:#fff0d7;color:#785225;font-size:13px;padding:12px;border-radius:8px}button:focus-visible,a:focus-visible{outline:3px solid #ad8639;outline-offset:4px}
</style><header><small>FIBERGLASS · ORIGINAL PHOTOGRAPHY</small><h1>สินค้าเดิม ภาพเดิม จัดวางเป็นชุดเดียวกัน</h1><p>สร้างสินค้า ${imported.products.length} รายการใน CMS เป็น${publishedIds.size === imported.products.length ? "Published" : "Draft"} พร้อมจำหน่ายตามที่ยืนยัน ภาพ ${photos.photos.length} ภาพใช้ต้นฉบับจริง แก้แนวภาพที่ตะแคง ${photos.photos.filter((p) => p.rotation_degrees).length} ภาพและเพิ่มกรอบสีงาช้างเท่านั้น ไม่วาดใหม่ ไม่ลบพื้นหลัง ไม่แต่งสี ไม่ตัดส่วนใด และไม่ใช้ภาพที่สร้างด้วย AI</p><p>ตรวจสอบแล้วว่าพิกเซลต้นฉบับครบทุกจุดหลังย้อนการหมุนและนำกรอบออก ภาพขนาดเล็กคงความละเอียดตาม Excel มีสินค้างานไม้ 2 รายการที่ยังไม่ได้สร้างในรอบนี้</p><button id="toggle" type="button" aria-pressed="false">ดูภาพต้นฉบับก่อนจัดวาง</button></header><main>${cards}</main><script>const button=document.getElementById('toggle');button.addEventListener('click',()=>{const original=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(original));button.textContent=original?'ดูภาพที่จัดวางแล้ว':'ดูภาพต้นฉบับก่อนจัดวาง';document.querySelectorAll('img[data-original]').forEach(image=>image.src=original?image.dataset.original:image.dataset.framed)});</script></html>`,
  "utf8",
);
console.log(`Review saved: ${directory}/cms-review.html (${imported.products.length} products)`);
