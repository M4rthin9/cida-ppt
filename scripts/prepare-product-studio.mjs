import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("content/product-studio");
try {
  await access(path.join(root, "manifest.json"));
  console.log("Existing studio manifest retained; preparation is already complete.");
  process.exit(0);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await mkdir(path.join(root, "references"), { recursive: true });
await mkdir(path.join(root, "cutouts"), { recursive: true });
const inventory = JSON.parse(await readFile(path.join(root, "source-inventory.json"), "utf8"));
const imported = JSON.parse(await readFile("content/fiberglass-drafts/cms-import.json", "utf8"));
const rows = [
  32, 33, 26, 24, 21, 18, 23, 29, 35, 34, 28, 22, 20, 16, 13, 15, 20, 8, 9, 10, 11, 30, 31, 6, 12,
  17, 14, 5, 27, 19, 25,
];
const details = [
  "The small green Thai boxing character keychain with silver gloves. Preserve its metal ring and spring clip, and every painted detail.",
  "The white-and-red Thai boxing character keychain. Preserve the silver key ring, connector chain and attached textured grey wrist strap.",
  "The glossy deep-red bull sculpture, tail curling over its back, shown from the same three-quarter viewpoint. Preserve the complete horns, legs and tail.",
  "The single black marble-effect lidded urn, including its sculpted lid and pointed finial. The surrounding posters and other ornaments are background.",
  "The miniature blue wooden tuk-tuk vehicle. Preserve its three wheels, seats, mirrors, steering controls, painted roof and TAXI sign. This is an existing physical model, not a life-size vehicle.",
  "The green-faced Thai boxing figure with red gloves, red clothing, a small head ornament above the gold crown, and textured dark base. Preserve all sculpted and painted parts.",
  "The angular black-and-white panda figurine holding its complete brass-colored oval tray. Preserve the tray shape and the faceted face.",
  "The blue-and-gold Muay Thai shorts-shaped bottle opener. Preserve the painted gold Thai lettering and black waistband exactly, along with its actual opener shape.",
  "The purple tuk-tuk-shaped side-view bottle opener magnet. Preserve the depicted side view, wheels, windows and paint.",
  "The blue tuk-tuk-shaped front-view bottle opener magnet with TAXI sign, round yellow lights, red pinstriping and a single front wheel.",
  "The black Thai mask-shaped bottle opener with white fangs, red mouth, green and gold brow. Preserve the opening in its mouth and glossy carved shape.",
  "The black marble-effect elephant-shaped holder. Preserve the curled trunk and circular opening in its body, with correct transparent holes after background removal.",
  "Exactly TWO matching beige-shirt uniform ART TOY figures, on separate black round bases, both wearing black berets and reflective sunglasses. Preserve both figures, shirts, trousers, facial shape and beret emblems.",
  "The green guardian cartoon figure in a tall gold pointed crown, dark outfit, green gloves, gold trim and black base. Preserve the violet gemstone in the crown.",
  "The full black-skinned ornate Thai warrior statue carrying a sword, with gold crown, red-and-green clothes, green and blue sculpted wave base. Preserve the entire sword, crown, fingers and base.",
  "The blue-faced cartoon guardian waving a small Thai flag, with gold crown, red mouth, black outfit and black base. Preserve the flag stripes and count of visible accessories.",
  "Exactly TWO dark-shirt uniform ART TOY figures on separate black round bases, wearing black berets and sunglasses. Preserve both figures, shirts, trousers, facial shape and emblems.",
  "The lavender reclining Ganesha on a red-and-black oval base. Preserve all limbs, jewelry, trunk, cushion and existing Thai base inscription without making up letters.",
  "The pink seated Ganesha on its black circular base. Preserve all arms, gold ornaments, green objects, trunk and headpiece, and the visible base inscription.",
  "The pink standing Ganesha with gold ornaments, a small white rat on its circular black base and a red symbol on the front hand. Preserve every limb, prop, rat and painted detail.",
  "The pink cartoon Ganesha with a gold conical crown and blue forehead stone on a black rectangular base. Preserve all four arms, trident, pink flower, gold jewelry and green painted patterns.",
  "The purple Muay Thai shorts keychain, INCLUDING the turquoise wrist strap, connector rings and clasp. Preserve the existing gold/red lettering and trim.",
  "The red boxing glove keychain INCLUDING its white wrist strap, silver rings and clasp. Preserve the gold and white decorative paint and black cuff with its original text.",
  "The large green Thai giant figurine with cylindrical gold helmet, gold ears, white tusks, detailed outfit, green arms and black base. Exactly one figure.",
  "The full white-skinned ornate Thai warrior statue holding its sword, gold crown, red and green painted costume and green sculpted wave base. Keep the exact pose and accessories; do not add a flag.",
  "The white Thai cartoon boxing figure with dark blue gloves and shorts, black-and-blue headband, red facial paint and dark textured base. Preserve the small pink crown detail.",
  "The white-faced cartoon Hanuman waving a small Thai flag, gold crown, red mouth and black oval base. Preserve the flag, painted swirls, gold trim and costume.",
  "The pale-pink giant-head pot with gold brow ornament, big round eyes, white tusks, red mouth and sculpted ears. Preserve the actual rim and base shape.",
  "The sculpted Thai head on its red circular stand and thin upright stem, with black hair, pink flame-shaped crest, red face and gold-green-white brow. Include the whole head, stem and red stand.",
  "Exactly TWO matching red marble-effect vases, one slightly behind the other. Preserve both vases and their complete flared rims, red-black marbling and base shapes.",
  "The complete wooden market-stall table with dark-green-and-ivory striped canopy and striped fabric counter front. Preserve every upright, canopy rib, counter leg and correct open transparent spaces. Remove shop and room behind it. Do not populate the stall or invent stock.",
];
const common =
  "Use case: background-extraction with commercial photographic relighting. Edit THIS reference into a premium, tack-sharp close-up e-commerce product photograph. Remove ALL original room, wall, floor, tabletop and surrounding items. Output a genuine transparent alpha PNG, including clean transparent holes and completely transparent space around the product. No white/black rectangle, fake checkerboard, or detached background remnants. Preserve the exact real product geometry, number of objects, colors, handmade painted detail, face, attachments and original inscriptions. Only improve photographic clarity, exposure and lighting. Use warm-neutral large softbox illumination from upper left, gentle right fill, controlled highlights, realistic surface texture and clearly focused edges. Entire product visible, upright using the reference orientation, same camera viewpoint. Square 2048x2048 hero composition with complete subject centered at 84 percent of canvas's longest dimension and at least 8 percent empty margin. Do not crop any part. No added props, platforms, lettering, frame or watermark. Subject specifics: ";
const assets = [];
for (const [i, item] of inventory.entries()) {
  const row = rows[i];
  const variant = row === 20 ? (i === 12 ? 1 : 0) : 0;
  const key = `row${row}${row === 20 ? `-${variant}` : ""}`;
  const source = path.join("รูปผลิตภัณฑ์", item.file).replaceAll("\\", "/");
  const bytes = await readFile(source);
  await sharp(bytes)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toFile(path.join(root, "references", `${key}.jpg`));
  const product = imported.products.find((p) => p.source_row === row);
  assets.push({
    key,
    source,
    source_sha256: createHash("sha256").update(bytes).digest("hex"),
    source_width: item.width,
    source_height: item.height,
    reference: `content/product-studio/references/${key}.jpg`,
    output: `content/product-studio/cutouts/${key}.png`,
    product_id: product?.id ?? null,
    product_name: product?.name_th ?? (row === 21 ? "โมเดลรถตุ๊กตุ๊ก" : "โต๊ะซุ้ม"),
    slug: product?.slug ?? null,
    source_row: row,
    variant,
    prompt: common + details[i],
    status: "pending",
    library_only: !product,
  });
}
const legacy = "content/fiberglass-drafts/presentation/row-7-image5.png";
const product = imported.products.find((p) => p.source_row === 7);
await sharp(legacy)
  .jpeg({ quality: 95 })
  .toFile(path.join(root, "references", "row7.jpg"));
assets.push({
  key: "row7",
  source: legacy,
  source_sha256: createHash("sha256")
    .update(await readFile(legacy))
    .digest("hex"),
  reference: "content/product-studio/references/row7.jpg",
  output: "content/product-studio/cutouts/row7.png",
  product_id: product.id,
  product_name: product.name_th,
  slug: product.slug,
  source_row: 7,
  variant: 0,
  prompt:
    common +
    "The small seated red Thai giant cartoon figure in a gold cylindrical helmet, red gloves, ornate gold-and-red costume and glossy black base. No matching high-resolution photo was supplied; this existing image is its sole identity reference. Do not replace it with the large green giant or white boxing character.",
  status: "pending",
  library_only: false,
  source_note: "No matching new photo; existing product photo used as identity reference.",
});
await writeFile(
  path.join(root, "manifest.json"),
  JSON.stringify(
    {
      version: 1,
      generated_with: "built-in imagegen",
      art_direction:
        "Transparent, professionally relit product cutouts on shared forest-green and warm-ivory studio presentation",
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${assets.length} asset briefs: ${assets.filter((a) => !a.library_only).length} catalogue photos for ${new Set(assets.filter((a) => a.product_id).map((a) => a.product_id)).size} published products; ${assets.filter((a) => a.library_only).length} additional library photos.`,
);
