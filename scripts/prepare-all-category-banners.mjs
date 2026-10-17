import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = "content/category-banners/all-categories";
await mkdir(root, { recursive: true });
const categories = [
  {
    slug: "sharing-wreaths",
    name: "พวงหรีดแบ่งปัน",
    references: [
      "content/sharing-wreaths/studio/wreath-09.png",
      "content/sharing-wreaths/studio/wreath-10.png",
      "content/sharing-wreaths/studio/wreath-11.png",
    ],
    subject:
      "Exactly THREE distinct sharing wreaths, each on its ORIGINAL COMPLETE BLACK THREE-LEGGED EASEL STAND. Image 1 is the round pale-pink hydrangea wreath with ivory jasmine accents; image 2 is the black oval wreath with cyan folded-petal flowers, ivory roses and three white garland tassels; image 3 is the ivory oval wreath with pink/magenta folded-petal floral clusters. Keep the actual flower designs, shapes, colours and white printed signs faithfully, including their existing พวงหรีดแบ่งปัน lettering; add no donor names. Arrange the three complete standing wreaths as a graceful close group, pink circular wreath left and slightly behind, cyan/black oval in the middle, ivory/pink oval right. All stand legs and feet are visible and grounded on the continuous studio floor, no pedestal hiding the legs. Do not replace stands with plinths, do not duplicate a design, do not omit a wreath, and do not crop any leg or garland. The group must visibly contain exactly three full standing wreaths.",
  },
  {
    slug: "artificial-flowers",
    name: "ดอกไม้ประดิษฐ์",
    references: [
      "content/artificial-flowers/studio/flower-01.png",
      "content/artificial-flowers/studio/flower-04.png",
      "content/artificial-flowers/studio/flower-10.png",
    ],
    subject:
      "Exactly the three supplied products: image 1 is a yellow-and-ivory handmade floral bouquet with white/gold hanging garlands in its original silver cut-glass vase; image 2 is a blue-and-ivory handmade floral bouquet with teal folded petals and hanging white garlands in its original silver cut-glass vase; image 3 is a round woven lidded basket with a curved handle, pink fabric flower, white ribbon and white/gold tassels. Retain each product's original colours, shape, flower construction, vase, basket and garland details. Arrange yellow vase behind left, blue vase behind right and pink basket in front on low staggered warm-ivory stone plinths. No extra flower arrangements or vases.",
  },
  {
    slug: "needlework",
    name: "เย็บปักถักร้อย",
    references: [
      "content/needlework/studio/needlework-01.png",
      "content/needlework/studio/needlework-04.png",
      "content/needlework/studio/needlework-23-v2.png",
    ],
    subject:
      "Exactly the three supplied products: the black round-neck tee with colourful embroidered LOVE and leafy details from image 1; the white round-neck tee with the embroidered Thai girl in a pale floral blouse and pink skirt from image 2; the ivory tote bag with the original black seated-character line drawing and Thai words รอคอย / โอกาส from image 3. Preserve the exact garment colours, patterns, graphic placement and thread texture. Display the two complete tees front-facing on a discreet thin dark metal rail with simple hangers, with natural fabric drape and their original artwork clearly visible. Display the complete tote and both handles upright on a low ivory stone plinth in the foreground. No models, no visible mannequin, no additional clothing or sewing tools. Do not recolour, redraw or replace the embroidery or tote printing.",
  },
];
const base =
  "Use case: compositing, premium commercial category photography. The input images are the exact product identity references. Match an established ivory and forest-green craft website: very dark forest-green limewashed studio wall and continuous forest-green floor, warm-ivory stone display plinths, soft warm upper-left key light, restrained fine foliage shadows near the edges, subtle brass atmosphere, realistic contact shadows and crisp product texture. Preserve the actual reference products. Scene fills the ENTIRE canvas, no inset photograph, no border, no collage. No new text overlays, price stickers, watermarks or logos. Retain only wording that is part of the original product artwork.";
const layouts = {
  panorama:
    "Asset type: full-width desktop category-page hero, panoramic aspect ratio 8:3, requested 2048x768. LEFT 45% is calm empty dark forest-green negative space for website title and description. All complete products form a compact group in the RIGHT HALF, within x54%–94% and y6%–92%, including every vase base, wreath tassel, sleeve, shirt hem and bag handle. The group is brightly and naturally lit but leaves the entire left text area dark. Do not spread any product into the left copy area.",
  portrait:
    "Asset type: mobile category-page hero, VERY TALL 4:9 aspect ratio, requested 1024x2304. All complete products and low plinths are grouped within the UPPER 42% OF IMAGE HEIGHT and CENTRAL 72% OF IMAGE WIDTH with at least 12% safe margins at both sides. The LOWER 58% is quiet continuous very dark forest-green empty wall/floor for website title and multiple lines of description. Reduce product group size to keep every product and its base fully visible in the upper region. No crop of any petal, tassel, sleeve, hem or bag handle.",
  tile: "Asset type: responsive homepage category photograph, landscape 3:2 aspect ratio, requested 1536x1024. Cluster all products tightly within the CENTRAL 42% OF IMAGE WIDTH and the UPPER 58% OF HEIGHT. Leave wide quiet dark-green side margins so the complete group survives centre cropping to square and narrow mobile cards. LOWER 40% is uncluttered dark-green negative space for live website category copy. Every product, base, sleeve and handle fully inside frame with safe margins.",
};
let previous;
try {
  previous = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const assets = [];
for (const category of categories) {
  const references = await Promise.all(
    category.references.map(async (source) => ({
      source,
      sha256: createHash("sha256")
        .update(await readFile(source))
        .digest("hex"),
    })),
  );
  for (const [kind, layout] of Object.entries(layouts)) {
    const key = `${category.slug}-${kind}`;
    assets.push({
      ...previous?.assets.find((a) => a.key === key),
      key,
      slug: category.slug,
      name: category.name,
      kind,
      output:
        category.slug === "sharing-wreaths"
          ? (previous?.assets.find((a) => a.key === key)?.output ?? `${root}/${key}-stands-v2.png`)
          : (previous?.assets.find((a) => a.key === key)?.output ?? `${root}/${key}.png`),
      references: category.references,
      reference_hashes: references,
      prompt: `${base}\nSubject: ${category.subject}\n${layout}`,
    });
  }
}
await writeFile(
  `${root}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      mode: "built-in image_gen",
      scope: "All four categories, following the user's latest instruction",
      reused_category: {
        slug: "fiberglass-and-wood",
        panorama: "content/category-banners/studio-v4/fiberglass-and-wood-panorama.png",
        portrait: "content/category-banners/studio-v4/fiberglass-and-wood-portrait-v2.png",
        tile: "content/category-banners/studio-v4/fiberglass-and-wood-tile.png",
      },
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Prepared nine product-based assets for three categories; the matching fiberglass set remains active.",
);
