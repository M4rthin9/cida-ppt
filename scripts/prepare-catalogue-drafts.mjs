import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { format, resolveConfig } from "prettier";

const directory = path.resolve(process.argv[2] || "content/fiberglass-drafts");
const source = JSON.parse(await readFile(path.join(directory, "source.json"), "utf8"));
// Photo corrections below belong to this workbook, not a generic spreadsheet importer.
if (source.sha256 !== "1ae6fa7ae3dc2dad6ab88317886e742e4d0c370e9e6f29deb58c54920aee15e5") {
  throw Error("Workbook changed. Review photo associations before preparing updated drafts.");
}
const formatting = (await resolveConfig(path.resolve(".prettierrc.json"))) || {};
await writeFile(
  path.join(directory, "source.json"),
  await format(JSON.stringify(source), { ...formatting, parser: "json" }),
);
const digits = (value) =>
  String(value).replace(/[๐-๙]/g, (digit) => String(digit.charCodeAt(0) - 0x0e50));
const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
const slug = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0e00-\u0e7f]+/g, "-")
    .replace(/^-|-$/g, "");
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
const mergedValue = (column, row) => {
  const direct = source.rows.find((entry) => entry.row === row)?.cells[`${column}${row}`];
  if (direct !== undefined) return direct;
  const range = source.mergedCells.find((value) => {
    const match = value.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    return (
      match &&
      match[1] === column &&
      match[3] === column &&
      row >= Number(match[2]) &&
      row <= Number(match[4])
    );
  });
  if (!range) return "";
  const first = range.split(":")[0];
  return (
    source.rows.find((entry) => entry.row === Number(first.replace(/\D/g, "")))?.cells[first] ?? ""
  );
};

const turnedPhotos = new Set([2, 3, 4, 5, 10, 11, 12, 13, 15, 22, 31]);
const products = [];
for (const entry of source.rows.filter((entry) => entry.row >= 5 && entry.cells[`C${entry.row}`])) {
  const row = entry.row;
  const cell = (column) => clean(mergedValue(column, row));
  const issues = [];
  const name = cell("C");
  const originalDescription = cell("D");
  const priceText = digits(cell("I"));
  if (!/^\d+(?:\.\d{1,2})?$/.test(priceText)) throw Error(`Invalid price at I${row}`);
  const price = Number(priceText);
  const measurements = {};
  for (const [key, column] of [
    ["width_cm", "E"],
    ["length_cm", "F"],
    ["height_cm", "G"],
  ]) {
    const value = digits(cell(column));
    measurements[key] = value && value !== "-" ? Number(value) : null;
    if (
      measurements[key] !== null &&
      (!Number.isFinite(measurements[key]) || measurements[key] <= 0)
    )
      throw Error(`Invalid dimension at ${column}${row}`);
  }
  const weightSource = cell("H");
  const weightText = digits(weightSource);
  let grams = null;
  if (/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?\s*g$/i.test(weightText)) {
    grams = Number(weightText.replace(/[,\s]|g/gi, ""));
  } else if (weightText && weightText !== "-") {
    issues.push({
      field: "weight",
      message:
        row === 21
          ? "น้ำหนักต้นฉบับ 1,85 g มีรูปแบบตัวเลขกำกวม ต้องยืนยันก่อนกรอกน้ำหนัก"
          : "ต้นฉบับระบุน้ำหนักโดยไม่มีหน่วย ต้องยืนยันหน่วยก่อนแปลงเป็นกิโลกรัม",
    });
  }
  let photos = source.images.filter((image) => image.row === row && image.column === 10);
  // Preserve all bytes. These are proposed associations, never alterations of the photos.
  if (row === 19) {
    photos = photos.filter((image) => image.file !== "originals/image6.png");
    issues.push({
      field: "photos",
      message:
        "ไม่นำภาพชุดข้าราชการที่ลอยอยู่ข้างแถวแจกันมาใช้กับสินค้านี้ ภาพดังกล่าวเก็บไว้ในภาพรอตรวจสอบ",
    });
  }
  if (row === 13) {
    photos = photos.filter((image) => image.file !== "originals/image32.png");
    issues.push({
      field: "photos",
      message: "แยกภาพตัวละครสีขาวออกจากนิลพัด เสนอจับคู่ภาพกับหนุมาน (การ์ตูน) ในแถว 14 รอตรวจสอบ",
    });
  }
  if (row === 14) {
    photos = source.images.filter((image) => image.file === "originals/image32.png");
    issues.push({
      field: "photos",
      message:
        "เสนอใช้ภาพหนุมานสีขาวจากภาพที่ลอยอยู่ในแถว 13 โปรดยืนยันการจับคู่ก่อนนำขึ้นเว็บไซต์",
    });
  }
  const images = [];
  for (const image of photos) {
    const filename = path.basename(image.file);
    const metadata = await sharp(path.join(directory, image.file)).metadata();
    images.push({
      file: image.file,
      source_anchor_row: image.row,
      alt_th: `ภาพผลิตภัณฑ์ ${name} จากรายการต้นฉบับ`,
      width: metadata.width,
      height: metadata.height,
      display_rotation_degrees: turnedPhotos.has(Number(filename.match(/\d+/)[0])) ? 90 : 0,
      original_bytes_preserved: true,
    });
  }
  if (row === 20)
    issues.push({
      field: "sale_unit",
      message:
        "ภาพมีหลายแบบ แต่ต้นฉบับไม่ได้ระบุว่าราคา 500 บาทเป็นราคาต่อชิ้นหรือต่อชุด ต้องยืนยันหน่วยขายและตัวเลือก",
    });
  const dimensions = [
    ["กว้าง", measurements.width_cm],
    ["ยาว", measurements.length_cm],
    ["สูง", measurements.height_cm],
  ]
    .filter(([, value]) => value !== null)
    .map(([label, value]) => `${label} ${value} ซม.`)
    .join(" × ");
  const material = originalDescription.includes("งานไม้") ? "wood" : "fiberglass";
  if (!originalDescription.includes("งานไม้") && !originalDescription.includes("ไฟเบอร์กลาส"))
    throw Error(`Unknown material at D${row}`);
  products.push({
    draft_key: `workbook-${source.sha256.slice(0, 12)}-row-${row}`,
    status: "draft",
    is_published: false,
    category_slug: "fiberglass-and-wood",
    name_th: name,
    name_en: "",
    slug: slug(name),
    sku: "",
    short_description_th: originalDescription,
    description_th: `${originalDescription}\n${dimensions}\nราคาขายรวมค่าจัดส่งตามรายการต้นฉบับ`,
    material_group: material,
    materials:
      material === "wood"
        ? originalDescription.includes("อะครีลิค")
          ? "ไม้ สีอะครีลิค เคลือบเงา"
          : "ไม้"
        : "ไฟเบอร์กลาส สีอะครีลิค เคลือบเงา",
    dimensions,
    measurements,
    weight_kg: grams === null ? null : Number((grams / 1000).toFixed(3)),
    price,
    currency: "THB",
    price_mode: "exact",
    price_includes_shipping: true,
    sale_price: null,
    stock_status: null,
    quantity: null,
    made_to_order: null,
    lead_time: "",
    is_featured: false,
    is_new: false,
    display_order: products.length,
    source: {
      sheet: source.sheet,
      row,
      item_number: cell("A"),
      institution: cell("B"),
      weight_original: weightSource,
    },
    images,
    review_issues: issues,
  });
}
if (
  products.length !== 31 ||
  new Set(products.map((product) => product.slug)).size !== products.length
)
  throw Error("Unexpected product count or duplicate slug");
const bundle = {
  schema_version: 1,
  preparation:
    "Catalogue review files; no CMS records or published content are created by this script.",
  source: { filename: source.source, sha256: source.sha256, sheet: source.sheet },
  category_slug: "fiberglass-and-wood",
  counts: {
    total: products.length,
    fiberglass: products.filter((product) => product.material_group === "fiberglass").length,
    wood: products.filter((product) => product.material_group === "wood").length,
  },
  review_before_import: [
    "ยืนยันสถานะสต็อก จำนวนสินค้า และเงื่อนไขการสั่งทำ ต้นฉบับไม่ได้ระบุ",
    "ราคาต้นฉบับรวมส่ง แต่ไม่ระบุขอบเขตพื้นที่จัดส่ง วันที่มีผล และหน่วยขาย ต้องตรวจสอบก่อนเผยแพร่",
    "หน่วยน้ำหนักใน CMS เป็นกิโลกรัม แปลงเฉพาะค่าที่ระบุหน่วย g ชัดเจน",
    "ภาพมีความละเอียดตามไฟล์ Excel และบางภาพต้องปรับแนวการแสดงผล โดยต้นฉบับทุกไฟล์เก็บไว้ครบ",
    "ไม่สร้างรหัส SKU ไม่เติมขนาดที่หายไป และไม่แต่งคำรับรองคุณภาพหรือราคาส่วนลด",
  ],
  unassigned_images: [
    {
      file: "originals/image6.png",
      source_anchor_row: 19,
      reason: "ภาพชุดข้าราชการไม่ตรงกับรายการแจกันหรือผลิตภัณฑ์อื่นที่ระบุอย่างชัดเจน",
    },
    {
      file: "originals/hdphoto1.wdp",
      reason: "ไฟล์ภาพสำรองของ Excel เก็บต้นฉบับไว้ แต่ไม่ใช้แสดงในเว็บ",
    },
  ],
  products,
};
await writeFile(
  path.join(directory, "drafts.json"),
  await format(JSON.stringify(bundle), { ...formatting, parser: "json" }),
);
const columns = [
  "source_row",
  "source_item",
  "name_th",
  "material",
  "price_thb_including_shipping",
  "width_cm",
  "length_cm",
  "height_cm",
  "weight_original",
  "weight_kg",
  "stock_status",
  "status",
  "photos",
  "review_notes",
];
const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const csv = [
  columns,
  ...products.map((product) => [
    product.source.row,
    product.source.item_number,
    product.name_th,
    product.material_group,
    product.price,
    product.measurements.width_cm,
    product.measurements.length_cm,
    product.measurements.height_cm,
    product.source.weight_original,
    product.weight_kg,
    "UNCONFIRMED",
    "draft",
    product.images.map((image) => image.file).join(" | "),
    product.review_issues.map((issue) => issue.message).join(" | "),
  ]),
]
  .map((row) => row.map(csvCell).join(","))
  .join("\r\n");
await writeFile(path.join(directory, "review.csv"), `\ufeff${csv}\r\n`);
const money = new Intl.NumberFormat("th-TH");
const cards = products
  .map(
    (
      product,
    ) => `<article data-material="${product.material_group}" data-issues="${product.review_issues.length > 0}">
<div class="photos">${product.images.map((image) => `<figure><div class="photo"><img class="${image.display_rotation_degrees ? "turned" : ""}" src="${escape(image.file)}" alt="${escape(image.alt_th)}" loading="lazy"></div><figcaption>${escape(path.basename(image.file))}${image.source_anchor_row !== product.source.row ? ` · แถวต้นฉบับ ${image.source_anchor_row}` : ""}</figcaption></figure>`).join("")}</div>
<div class="copy"><p class="eyebrow">แถว ${product.source.row} · ลำดับต้นฉบับ ${escape(product.source.item_number)} · ${product.material_group === "wood" ? "งานไม้" : "ไฟเบอร์กลาส"}</p><h2>${escape(product.name_th)}</h2><p class="price">${money.format(product.price)} บาท <span>รวมส่งตามต้นฉบับ</span></p><p>${escape(product.short_description_th)}</p><dl><dt>ขนาด</dt><dd>${escape(product.dimensions)}</dd><dt>น้ำหนัก</dt><dd>${product.weight_kg !== null ? `${product.weight_kg} กก. (ต้นฉบับ ${escape(product.source.weight_original)})` : `ยังไม่ระบุ · ต้นฉบับ ${escape(product.source.weight_original || "ไม่ระบุ")}`}</dd><dt>สต็อก</dt><dd>รอยืนยัน</dd><dt>สถานะ</dt><dd>ฉบับร่างสำหรับตรวจสอบ</dd></dl>${product.review_issues.length ? `<aside><strong>ตรวจสอบก่อนนำเข้า</strong><ul>${product.review_issues.map((issue) => `<li>${escape(issue.message)}</li>`).join("")}</ul></aside>` : ""}</div></article>`,
  )
  .join("\n");
const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>ตรวจสอบฉบับร่าง · ผลิตภัณฑ์ไฟเบอร์กลาสและไม้</title><style>
*{box-sizing:border-box}body{margin:0;background:#f8f6f0;color:#243b32;font:16px/1.8 Tahoma,Arial,sans-serif}header,main,footer{max-width:1240px;margin:auto;padding:32px 24px}header{border-bottom:1px solid #d8dbce}h1{font-size:clamp(26px,4vw,44px);line-height:1.5;margin:8px 0}h2{font-size:22px;line-height:1.5;margin:8px 0}.eyebrow{font-size:13px;color:#667064;margin:0}.intro{max-width:850px}.summary{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.summary span{padding:10px 16px;border:1px solid #d8dbce;border-radius:6px;background:#efede5}.notice{background:#e7eee6;padding:20px 24px;border-radius:8px;margin:24px 0}ul{padding-left:24px}a{color:#294c3c}button{font:inherit;min-height:44px;padding:8px 16px;background:transparent;border:1px solid #d8dbce;border-radius:4px;color:inherit;cursor:pointer}button[aria-pressed=true]{background:#294c3c;color:white}.filters{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}a:focus-visible,button:focus-visible{outline:2px solid #294c3c;outline-offset:4px}article{display:grid;grid-template-columns:290px minmax(0,1fr);gap:32px;background:white;border:1px solid #d8dbce;border-radius:8px;margin:24px 0;padding:24px}.photos{display:grid;gap:16px;align-content:start}figure{margin:0}.photo{height:250px;display:grid;place-items:center;overflow:hidden;background:#efede5;border-radius:4px}img{width:100%;height:100%;object-fit:contain;max-height:250px}img.turned{width:230px;height:230px;transform:rotate(90deg)}figcaption{font-size:12px;color:#667064;margin:8px 0}.price{font-size:23px;font-weight:bold;color:#294c3c}.price span{font-size:13px;font-weight:normal;margin-left:8px}dl{display:grid;grid-template-columns:85px minmax(0,1fr);gap:8px 16px;font-size:14px}dt{color:#667064}dd{margin:0;overflow-wrap:anywhere}aside{font-size:14px;border-left:3px solid #806431;background:#f8f6f0;padding:12px 16px;margin-top:20px}aside ul{margin:8px 0}.unassigned{border-top:1px solid #d8dbce;margin-top:40px;padding-top:24px}.unassigned img{width:240px;height:220px}footer{font-size:13px;color:#667064;overflow-wrap:anywhere}[hidden]{display:none!important}@media(max-width:680px){header,main,footer{padding:24px 16px}article{grid-template-columns:1fr;padding:20px;gap:16px}.photos{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}.price span{display:block;margin:0}dl{grid-template-columns:70px minmax(0,1fr)}}@media print{.filters{display:none}article{break-inside:avoid}header,main,footer{padding:12px}.notice{font-size:12px}}
</style></head><body><header><p class="eyebrow">ไฟล์ตรวจสอบข้อมูลสินค้า · ยังไม่ได้บันทึกหรือเผยแพร่ใน CMS</p><h1>ผลิตภัณฑ์ไฟเบอร์กลาสและงานไม้</h1><p class="intro">ฉบับร่างจาก ${escape(source.source)} จัดเตรียมชื่อ รายละเอียด ขนาด น้ำหนัก ราคา และภาพต้นฉบับสำหรับตรวจสอบก่อนนำเข้าระบบ</p><div class="summary"><span>31 รายการ</span><span>ไฟเบอร์กลาส ${bundle.counts.fiberglass}</span><span>งานไม้ ${bundle.counts.wood}</span><span>ราคา ${money.format(Math.min(...products.map((product) => product.price)))}–${money.format(Math.max(...products.map((product) => product.price)))} บาท</span></div></header><main><section class="notice" aria-labelledby="review-notes"><h2 id="review-notes">ข้อมูลที่ต้องยืนยัน</h2><ul>${bundle.review_before_import.map((note) => `<li>${escape(note)}</li>`).join("")}</ul><p><a href="review.csv" download>ดาวน์โหลดตารางตรวจสอบ CSV</a> · <a href="drafts.json" download>ข้อมูลฉบับร่าง JSON</a></p></section><nav class="filters" aria-label="กรองฉบับร่าง"><button data-filter="all" aria-pressed="true">ทั้งหมด</button><button data-filter="fiberglass" aria-pressed="false">ไฟเบอร์กลาส</button><button data-filter="wood" aria-pressed="false">งานไม้</button><button data-filter="issues" aria-pressed="false">มีรายการรอตรวจสอบ</button></nav><p id="result-count" role="status">แสดง 31 รายการ</p><section aria-label="รายการฉบับร่าง">${cards}</section><section class="unassigned"><h2>ภาพรอตรวจสอบการจับคู่</h2><img src="originals/image6.png" alt="ภาพตุ๊กตาในชุดข้าราชการชายและหญิงที่ไม่ได้จับคู่กับรายการสินค้า"><p>image6.png อยู่ข้างแถวแจกันในไฟล์ต้นฉบับ แต่ภาพไม่ตรงกับชื่อสินค้า จึงเก็บแยกไว้ ไม่มีการสร้างสินค้าใหม่จากภาพนี้</p></section></main><footer><p>ต้นฉบับทุกภาพเก็บไว้ครบ ไม่มีการแก้ไขไฟล์ Excel หรือฐานข้อมูล เว็บไซต์สาธารณะยังไม่ใช้ฉบับร่างชุดนี้</p><p>Source SHA-256: ${source.sha256}</p></footer><script>
const buttons=[...document.querySelectorAll('[data-filter]')];const cards=[...document.querySelectorAll('article')];for(const button of buttons){button.addEventListener('click',()=>{for(const other of buttons)other.setAttribute('aria-pressed',String(other===button));for(const card of cards){const filter=button.dataset.filter;card.hidden=!(filter==='all'||filter===card.dataset.material||(filter==='issues'&&card.dataset.issues==='true'));}document.querySelector('#result-count').textContent='แสดง '+cards.filter(card=>!card.hidden).length+' รายการ';});}
</script></body></html>`;
await writeFile(
  path.join(directory, "review.html"),
  await format(html, { ...formatting, parser: "html" }),
);
console.log(
  `Prepared ${bundle.counts.total} unpublished review drafts (${bundle.counts.fiberglass} fiberglass, ${bundle.counts.wood} wood), ${products.reduce((count, product) => count + product.images.length, 0)} mapped photos. No database changes.`,
);
