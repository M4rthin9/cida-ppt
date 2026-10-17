import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = "content/sharing-wreaths";
await mkdir(`${root}/studio`, { recursive: true });
const inventory = JSON.parse(await readFile(`${root}/inventory.json`, "utf8"));
const designs = [
  [
    "IMG_0142.png",
    "พวงหรีดแบ่งปัน ขาวพิสุทธิ์",
    "wreath-khao-phisuth",
    "All-ivory circular wreath with dense white artificial flowers, curved jasmine garland and a central hanging tassel with small gold accents.",
  ],
  [
    "IMG_0148.png",
    "พวงหรีดแบ่งปัน บุษราคัม",
    "wreath-butsarakam",
    "Green oval backing with ivory orchids and orange folded-petal flowers across the lower half, five hanging white garland tassels.",
  ],
  [
    "IMG_0158.png",
    "พวงหรีดแบ่งปัน นวลพิมาน",
    "wreath-nuan-phiman",
    "Green oval backing with asymmetric ivory orchids, peach folded-petal flowers and layered hanging white garland swags.",
  ],
  [
    "IMG_0160.png",
    "พวงหรีดแบ่งปัน ม่วงละมุน",
    "wreath-muang-lamun",
    "Green oval backing with asymmetric purple hydrangea petals, ivory folded-petal flowers and delicate white buds.",
  ],
  [
    "IMG_0164.png",
    "พวงหรีดแบ่งปัน ชมพูพริ้ม",
    "wreath-chomphu-phrim",
    "Green round backing with ivory flowers and pink folded-petal flowers across the top, long white garland tassels and curved hanging strands below.",
  ],
  [
    "07-1-700x933.jpg",
    "พวงหรีดแบ่งปัน ม่วงอำไพ",
    "wreath-muang-amphai",
    "Ivory oval backing, original purple and gold emblem at top, magenta and lilac folded-petal flowers below, three garland tassels, black easel and original printed white sign.",
  ],
  [
    "08-1-700x933.jpg",
    "พวงหรีดแบ่งปัน ม่วงพิลาส",
    "wreath-muang-philat",
    "Ivory oval backing, original purple and gold emblem, asymmetric purple and magenta floral clusters, layered white garland swags, black easel and original printed sign.",
  ],
  [
    "09-1-700x933.jpg",
    "พวงหรีดแบ่งปัน บุษบาสีอรุณ",
    "wreath-butsaba-si-arun",
    "Round pink hydrangea wreath with white orchids, orange roses, purple folded-petal flowers, green centre, black easel and original printed sign.",
  ],
  [
    "10-1-700x933.jpg",
    "พวงหรีดแบ่งปัน ชมพูละไม",
    "wreath-chomphu-lamai",
    "Round pale-pink hydrangea wreath with small ivory jasmine accents, green centre, black easel and original printed sign.",
  ],
  [
    "11-1-700x933.jpg",
    "พวงหรีดแบ่งปัน ฟ้าอาลัย",
    "wreath-fa-alai",
    "Black oval backing with delicate white jasmine lattice border at the top, cyan folded-petal flowers and ivory roses below, three tassels, black easel and original printed sign.",
  ],
  [
    "12-1-700x933.jpg",
    "พวงหรีดแบ่งปัน ชมพูอำไพ",
    "wreath-chomphu-amphai",
    "Ivory oval backing with pink and magenta folded-petal floral clusters around the lower edge, black easel and original printed sign.",
  ],
];
const products = [];
for (const [index, [filename, name, slug, subject]] of designs.entries()) {
  const source = inventory.find((item) => item.source.endsWith(filename));
  const key = String(index + 1).padStart(2, "0");
  products.push({
    key,
    name_th: name,
    slug,
    source: source.source,
    reference: source.ref,
    source_sha256: createHash("sha256")
      .update(await readFile(source.source))
      .digest("hex"),
    output: `${root}/studio/wreath-${key}.png`,
    price: 4000,
    sharing_price: 1700,
    display_order: index,
    is_featured: index === 0,
    short_description_th:
      "พวงหรีดดอกไม้ประดิษฐ์ จัดเรียงอย่างประณีตเพื่อสื่อความอาลัย พร้อมราคาแบ่งปันและราคาขายขาดให้เลือก",
    description_th: `${name}\nราคาแบ่งปัน 1,700 บาท\nราคาขายขาด 4,000 บาท\nสอบถามรายละเอียดการแบ่งปัน แบบที่ต้องการ และความพร้อมในการจัดส่งกับเจ้าหน้าที่ก่อนสั่งซื้อ`,
    prompt: `Use case: background-extraction with premium commercial product relighting. Asset type: transparent ecommerce product photograph, matching an ivory and forest-green premium craft website. Input image 1 is the exact edit target and product identity reference. Subject: ${subject} Preserve the actual wreath design, backing shape, original colours, individual flower types, garland structure, hanging tassels and any easel shown. Keep any original printed sign and emblem faithfully, including their original lettering; do not invent donor names, change wording or add badges. Remove only the surrounding background. Re-light with a soft neutral studio key and subtle rim light, improve clarity of handmade petals and threads without plastic CGI smoothing. Straight-on near-frontal catalogue view, entire product and any stand fully visible, centred on a square high-resolution canvas around 2048px, occupying about 88% of canvas height with at least 5% transparent safe margin at all edges. Genuinely transparent alpha background including gaps between garland strands and easel legs. No backdrop, no floor, no props, no cast floor shadow, no watermark, no extra flowers, no crop. Retain product colours; let the website supply its own ivory studio background.`,
  });
}
await writeFile(
  `${root}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      category_slug: "sharing-wreaths",
      mode: "built-in image_gen",
      confirmation: "แยก 11 สินค้า สีขาวแนะนำอันดับ 1",
      prices_confirmation: "ราคาแบ่งปัน 1700 บาท และราคาขายขาด 4000 บาท",
      products,
    },
    null,
    2,
  ) + "\n",
);
console.log("Prepared 11 unique wreath designs; duplicate views remain in the source folder.");
