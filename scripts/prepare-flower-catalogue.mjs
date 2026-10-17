import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = "content/artificial-flowers";
const sources = JSON.parse(await readFile(`${root}/source-inventory.json`, "utf8"));
const designs = [
  [
    "flower-01",
    "แจกันดอกไม้ประดิษฐ์ บุษราคัม",
    "floral-vase-butsarakam",
    "ช่อดอกไม้ประดิษฐ์โทนเหลืองและขาว แต่งดอกบัวและสายประดับในแจกันลายเจียระไน",
    "one yellow-and-white floral bouquet in its exact cut-pattern transparent vase, including every hanging ivory bead garland",
  ],
  [
    "flower-02",
    "แจกันดอกไม้ประดิษฐ์ แสงอรุณ",
    "floral-vase-saeng-arun",
    "ช่อดอกไม้ประดิษฐ์โทนส้มและขาว จัดทรงกลมพร้อมสายประดับในแจกันลายเจียระไน",
    "one orange-and-white floral bouquet in its exact cut-pattern transparent vase, including every hanging ivory bead garland",
  ],
  [
    "flower-03",
    "แจกันดอกไม้ประดิษฐ์ ม่วงละมุน",
    "floral-vase-muang-lamun",
    "ช่อดอกไม้ประดิษฐ์โทนม่วงและขาว ผสานกลีบบัวพับและดอกประดับ พร้อมสายดอกไม้ห้อย",
    "one purple-and-white floral bouquet in its exact patterned transparent vase, including every white, green and purple hanging floral garland",
  ],
  [
    "flower-04",
    "แจกันดอกไม้ประดิษฐ์ ฟ้าคราม",
    "floral-vase-fa-khram",
    "ช่อดอกไม้ประดิษฐ์โทนฟ้าและขาว จัดทรงกลมพร้อมสายดอกไม้ห้อยและแจกันลายเจียระไน",
    "one turquoise-blue-and-white floral bouquet in its exact patterned transparent vase, including every white, green and blue hanging floral garland",
  ],
  [
    "flower-05",
    "พานดอกไม้ประดิษฐ์ บัวบุษรา",
    "floral-tray-bua-butsara",
    "พานประดับดอกไม้โทนขาวและส้ม ฐานกลีบพับสีเขียวและพานสีทอง พร้อมสายดอกไม้ห้อย",
    "one gold pedestal floral tray with its exact green folded-petal circular base, central white lotus, orange flowers and hanging white-green-orange garlands",
  ],
  [
    "flower-06",
    "ชุดแจกันคู่ ฟ้าพิสุทธิ์",
    "floral-vase-pair-fa-phisuth",
    "ชุดแจกันดอกไม้ประดิษฐ์โทนฟ้าและขาว 2 ใบ พร้อมสายดอกไม้ห้อย ราคาสำหรับทั้งคู่",
    "exactly TWO turquoise-blue-and-white floral vases side by side, retain both distinct original arrangements, vases and all hanging garlands",
  ],
  [
    "flower-07",
    "พานพุ่มประดิษฐ์ ศรีอำไพ",
    "floral-topiary-sri-amphai",
    "พานพุ่มประดิษฐ์ทรงสูง โทนเขียว ส้ม และขาว แต่งกลีบพับเป็นชั้นบนฐานสีทอง",
    "one exact tall tiered green-orange-white folded-petal ornamental arrangement on its gold base, preserve the pointed top and all tiers, garlands and geometry",
  ],
  [
    "flower-08",
    "ชุดแจกันคู่ ม่วงพิมาน",
    "floral-vase-pair-muang-phiman",
    "ชุดแจกันดอกไม้ประดิษฐ์โทนม่วงและขาว 2 ใบ แต่งกลีบบัวพับและสายดอกไม้ห้อย ราคาสำหรับทั้งคู่",
    "exactly TWO purple-and-white floral vases side by side, retain both distinct original arrangements, vases and all hanging garlands",
  ],
  [
    "flower-09",
    "ฐานกลีบบัวประดิษฐ์ มรกต",
    "folded-petal-base-morakot",
    "ฐานกลีบพับทรงกลม ไล่โทนสีเขียว พร้อมรายละเอียดกลีบซ้อนรอบวงตามภาพ",
    "one empty circular green folded-petal base only, preserve the opening, exact layered petal folds and green colour gradient; do not add flowers, water, candle or pedestal",
  ],
  [
    "flower-10",
    "ตะกร้าดอกไม้ประดิษฐ์ ชมพูพริ้ม",
    "floral-basket-chomphu-phrim",
    "ตะกร้าสานทรงกลมพร้อมฝาและหูหิ้ว แต่งดอกไม้สีชมพู ริบบิ้นขาว และสายประดับสีขาวทอง",
    "one round lidded woven basket with the exact tall curved handle, pink flower, white ribbon and ivory-gold garlands; preserve the closed lid and weave holes",
  ],
  [
    "flower-11",
    "ตะกร้าดอกไม้ประดิษฐ์ บัวชมพู",
    "floral-basket-bua-chomphu",
    "ตะกร้าสานทรงกลมพร้อมหูหิ้ว แต่งดอกบัวสีชมพูบนฝาวางเอียง และสายดอกไม้ประดับ",
    "one round woven basket with the exact tall handle and tilted lid, large pink folded lotus and hanging garlands; preserve the lid angle and weave holes",
  ],
  [
    "flower-12",
    "ตะกร้าดอกไม้ประดิษฐ์ ส้มอรุณ",
    "floral-basket-som-arun",
    "ตะกร้าสานพร้อมฝาและหูหิ้ว ประดับดอกไม้โทนส้มและเหลือง พร้อมสายดอกไม้สีขาว",
    "one round lidded woven basket with the exact tall handle, orange-yellow flower decoration and white floral garlands; preserve the closed lid and weave holes",
  ],
  [
    "flower-13",
    "ตะกร้าดอกไม้ประดิษฐ์ บุษบานวล",
    "floral-basket-butsaba-nuan",
    "ตะกร้าสานเปิดทรงรีพร้อมหูหิ้ว แต่งดอกไม้สีเหลืองนวลและขาว พร้อมริบบิ้นตามภาพ",
    "one exact open oval woven basket with its rounded handle, ivory-yellow flower decoration and ribbon; preserve the empty interior and weave holes; no lid",
  ],
];
const commonPrompt =
  "Use case: lighting-weather and background-extraction. Asset type: premium commercial close-up product photograph on a genuinely transparent background. Use the supplied photograph as exact product identity reference. Preserve the original product design, shapes, flower placement, petal folds, colours, vase or basket, hanging garlands and all attached decorative parts. Remove every background pixel, floor line, detached fragment and extraction halo. Reframe the complete product upright, centrally, occupying 85% of a square 1280x1280 canvas, with safe margins around all handles, petals, bases and garland tips. Professional soft neutral studio lighting with gentle upper-left highlights, realistic material texture, restrained highlights and crisp fine detail. Commercial photographic realism, not illustration. Do not redesign or substitute flowers; do not add extra objects or props. No lettering, price, logo, watermark, border, plinth or opaque background. Do not bake a floor shadow into the transparent cutout. Product: ";
await mkdir(`${root}/studio`, { recursive: true });
let manifest;
try {
  manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
manifest ??= {
  version: 1,
  mode: "Built-in image_gen",
  category_slug: "artificial-flowers",
  stock_status: "available",
  status: "published",
  stock_and_publication_confirmation:
    "User confirmed ready to ship and display for sale on the website",
  pair_price_confirmation:
    "User confirmed 3500 2.png and 4000 b.png prices cover both vases (2 pieces)",
  products: [],
};
for (const [index, [key, name, slug, summary, subject]] of designs.entries()) {
  if (manifest.products.some((p) => p.key === key)) continue;
  const source = sources.find((s) => s.key === key);
  const pair = ["flower-06", "flower-08"].includes(key);
  manifest.products.push({
    ...source,
    name_th: name,
    name_en: "",
    slug,
    price: source.price_thb,
    price_mode: "exact",
    short_description_th: summary,
    description_th: `${summary}${pair ? `\nจำหน่ายเป็นชุด 2 ใบ ราคาต่อชุด ${source.price_thb.toLocaleString("th-TH")} บาท` : ""}`,
    selling_unit: pair ? "pair (2 vases)" : null,
    materials: "",
    dimensions: "",
    weight: null,
    quantity: null,
    is_featured: false,
    is_new: false,
    display_order: index,
    output: `${root}/studio/${key}.png`,
    prompt: commonPrompt + subject,
    generation_status: "pending",
  });
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  "Prepared 13 named products; filename prices retained, two confirmed pairs, no invented stock counts or dimensions.",
);
