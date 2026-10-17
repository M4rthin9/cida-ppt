import { readFile, writeFile, mkdir } from "node:fs/promises";
const root = "content/needlework";
await mkdir(`${root}/studio`, { recursive: true });
const inventory = JSON.parse(await readFile(`${root}/inventory.json`, "utf8"));
const designs = [
  [
    "1.jpg",
    "เสื้อยืดปัก ลาย LOVE สีสัน",
    "embroidered-tee-colourful-love",
    "Black tee. Across the centre chest is the exact multicoloured embroidered LOVE motif: a red decorated L, pink round O, blue heart-shaped V and lime-green E with leafy sprigs.",
  ],
  [
    "2.jpg",
    "เสื้อยืดปัก ลายช้างน้อย",
    "embroidered-tee-little-elephant",
    "Black tee. The central embroidery is the exact playful little elephant with oversized pink/gold ears, pale mint raised trunk and a yellow/orange body made from dense colourful small stitched dots.",
  ],
  [
    "3.jpg",
    "เสื้อยืดปัก ลายหมีร้องเพลง",
    "embroidered-tee-singing-bear",
    "White tee with the exact central cartoon bear singing into a colourful microphone, yellow toy and multicoloured patchwork shapes, with a small speech bubble containing a red music note.",
  ],
  [
    "4.jpg",
    "เสื้อยืดปัก ลายสาวไทย",
    "embroidered-tee-thai-girl",
    "White tee with the exact central full-body cartoon Thai girl, olive-brown tied hair, pale floral blouse, pink long skirt, and gold/green waist sash.",
  ],
  [
    "4.png",
    "เสื้อยืดปัก ลาย Love U",
    "embroidered-tee-love-u",
    "Black tee. Preserve the exact thin embroidered cursive wording 'Love U' across the centre chest, with a red heart on a small outlined stand to the left and an outlined finger-heart hand holding a red heart to the right.",
  ],
  [
    "5.jpg",
    "เสื้อยืดปัก ลายแมวตีกลอง",
    "embroidered-tee-drumming-cat",
    "White tee with the exact smiling orange-striped cartoon cat, tiny red/green flower on its head, beating a red/gold drum with purple legs. Keep all original thread colours and expression.",
  ],
  [
    "5.png",
    "เสื้อยืดปัก ลายหัวใจ I Love You",
    "embroidered-tee-heart-i-love-you",
    "Black tee. The exact centre-chest pink outlined heart contains colourful stitched words on three lines: 'I', 'LOVE', 'YOU', with the original small stitched colourful ornament at the upper right.",
  ],
  [
    "6.jpg",
    "เสื้อยืดปัก ลายหนูน้อยแก้มชมพู",
    "embroidered-tee-little-mouse",
    "White tee with the exact centre-chest round cartoon mouse/hamster outlined in dark red, white body, dark navy ears and feet, pink cheek patches, olive/gold belly stripe and a black round nose.",
  ],
  [
    "6.png",
    "เสื้อยืดปัก ลายหัวใจสวนกุหลาบ",
    "embroidered-tee-rose-garden-heart",
    "Black tee. The exact centre-chest pink dotted embroidered heart frames an orange birdcage at the upper left, a pink outlined rose at upper right and colourful small flowers and leafy vines within.",
  ],
  [
    "7.png",
    "เสื้อยืดปัก ลายหัวใจพฤกษา",
    "embroidered-tee-botanical-heart",
    "Black tee. Preserve the SMALL original motif on the WEARER'S LEFT CHEST (right side to the viewer), not centred or enlarged: a pink outlined heart with green and yellow leafy floral details, a pink flower and the original small cursive Love.",
  ],
  [
    "8.png",
    "เสื้อยืดปัก ลายบอลลูน Love You",
    "embroidered-tee-love-you-balloons",
    "Black tee. Preserve the exact original colourful embroidered LOVE above-left, YOU below-right and the group of four small multicoloured heart-shaped balloons with trailing curved stems on the centre chest.",
  ],
  [
    "9.png",
    "เสื้อยืดปัก ลายหัวใจเมืองในฝัน",
    "embroidered-tee-city-heart",
    "Black tee. Preserve the centre-chest embroidered heart containing an orange twin-tower bridge, blue curved wave patterns below, a leafy green garden and window with hanging colourful lanterns on the right, and a small cloud at top-left.",
  ],
  [
    "10.png",
    "เสื้อยืดปัก ลาย I Love U มินิ",
    "embroidered-tee-mini-i-love-u",
    "Black tee. Preserve the SMALL original motif on the WEARER'S LEFT CHEST (right to viewer): thin pink embroidered 'I LOVE' above a solid bright pink outlined heart containing a pale pink U. Keep its original position and size.",
  ],
  [
    "11.png",
    "เสื้อยืดปัก ลายหัวใจ Love",
    "embroidered-tee-outline-love-heart",
    "Black tee. Preserve the centre-chest large double pale-yellow heart outline and four hanging coloured embroidered LOVE letters, with O as a solid pink circle and V as a lime heart.",
  ],
  [
    "12.png",
    "เสื้อยืดปัก ลายกวางพฤกษา",
    "embroidered-tee-botanical-deer",
    "Black tee. Preserve the SMALL original motif on the WEARER'S LEFT CHEST (right to viewer): delicate golden embroidered deer head and antlers with green leaves flanking its neck. Keep the original position and size.",
  ],
  [
    "14.jpg",
    "เสื้อยืดปัก ลายแมวตาฟ้า",
    "embroidered-tee-blue-eyed-cat",
    "Black tee. Preserve the SMALL original motif on the WEARER'S LEFT CHEST (right to viewer): detailed orange-and-white cat face with bright blue eyes and the original small pink Japanese lettering below it. Keep exact lettering, thread colours, position and scale.",
  ],
  [
    "15.jpg",
    "เสื้อยืดปัก ลายแมวปั่นจักรยาน",
    "embroidered-tee-cycling-cat",
    "Black tee. Preserve the original centre-chest colourful cartoon cat riding a bicycle, outlined in pink, with orange torso, multicoloured striped details and two yellow/gold dotted bicycle wheels with bright green centres.",
  ],
  [
    "19.png",
    "เสื้อยืดปัก ลายพลังรักดอกไม้",
    "embroidered-tee-floral-power-of-love",
    "White tee. Preserve the exact original colourful floral arch embroidery in the centre chest: pink/red/blue flowers and leaves, a small heart with the original letter/symbol inside and the hand-stitched 'Power' and 'Love' lettering below. Do not typeset, correct or replace the hand-stitched lettering.",
  ],
  [
    "20.png",
    "เสื้อยืดปัก ลายหัวใจเสียงเพลง",
    "embroidered-tee-music-heart",
    "White tee. Preserve the exact original embroidery across the chest: outlined left heart with I, larger central burgundy heart with the word LOVE and a headphone-like arch, right heart with U, joined by two horizontal green lines reaching the shirt's body side seams.",
  ],
  [
    "24.jpg",
    "เสื้อยืดปัก ลายโจรสลัดหมวกฟาง",
    "embroidered-tee-straw-hat-pirate",
    "White tee. Preserve the exact large central embroidered cartoon straw-hat pirate character: magenta/purple spiky hair, yellow straw hat behind the head, excited open mouth, raised fists, red open jacket, blue shorts, gold sash and sandals. Retain the actual pose and colours, do not redesign the character.",
  ],
  [
    "25.jpg",
    "เสื้อยืดปัก ลายหุ่นยนต์แมวสีฟ้า",
    "embroidered-tee-blue-robot-cat",
    "White tee. Preserve the exact central embroidered blue robot-cat cartoon, white face and belly pocket, red nose and collar, yellow bell, open smiling red mouth and one raised hand. Retain the original character shape and colours.",
  ],
  [
    "เสื้อหมา.jpg",
    "เสื้อยืดปัก ลายสุนัขโบฟ้า",
    "embroidered-tee-blue-bow-dog",
    "Black tee. Preserve the exact central embroidered fluffy white small dog shown in profile with its face looking at the camera, pale cream ears, blue head bow, black nose and pink tongue. Keep the fine hair-like stitches and the original dog proportions.",
  ],
  [
    "กระเป๋าผ้า.png",
    "กระเป๋าผ้า รอคอยโอกาส",
    "canvas-tote-waiting-for-opportunity",
    "Ivory fabric tote bag with two matching fabric handles and the exact original black line illustration of a seated character wearing a small work cap, a scarf behind the neck and a heart on the chest. Preserve the exact Thai wording 'รอคอย' and 'โอกาส' on two lines beside the character. Preserve the printed line-drawing style; do not turn it into thick embroidery or redraw the character.",
  ],
];
let prior;
try {
  prior = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const products = designs.map(([filename, name, slug, subject], index) => {
  const source = inventory.find((p) => p.filename === filename);
  const key = String(index + 1).padStart(2, "0");
  const bag = index === 22;
  return {
    ...prior?.products.find((p) => p.key === key),
    key,
    name_th: name,
    slug,
    ...source,
    kind: bag ? "bag" : "tshirt",
    price: bag ? 199 : 399,
    display_order: index,
    is_featured: false,
    output:
      prior?.products.find((p) => p.key === key)?.output ?? `${root}/studio/needlework-${key}.png`,
    short_description_th: bag
      ? "กระเป๋าผ้าลายรอคอยโอกาส โทนสีเรียบ ใช้งานได้ในชีวิตประจำวัน"
      : "เสื้อยืดลายปักสีสัน ถ่ายทอดรายละเอียดของงานฝีมือผ่านลวดลายบนผืนผ้า",
    description_th: bag
      ? `${name}\nราคา 199 บาทต่อใบ\nสอบถามรายละเอียดและความพร้อมในการจัดส่งกับเจ้าหน้าที่ก่อนสั่งซื้อ`
      : `${name}\nราคา 399 บาทต่อตัว\nสอบถามขนาดเสื้อที่มีจำหน่ายและความพร้อมในการจัดส่งกับเจ้าหน้าที่ก่อนสั่งซื้อ`,
    prompt: `Use case: precise-object-edit / background-extraction. Asset type: premium transparent ecommerce product photograph for an ivory and forest-green craft website. Image 1 is the actual edit target; preserve the product identity and original artwork. Subject: ${subject} ${bag ? "Remove the person entirely and photograph ONLY the same tote bag upright in a front view, complete body and both fabric handles visible, naturally shaped with subtle fabric folds. Reconstruct only fabric/handle portions hidden by the person and promotional stickers, with plain matching fabric, no invented pockets, zips or trim." : "Photograph ONLY the same T-shirt in a premium front-facing invisible-form catalogue presentation, no human or mannequin visible, collar naturally shaped, sleeves gently spread, entire shirt and hem visible. Remove the clothes hanger and reconstruct only plain shirt fabric hidden by the price sticker. Maintain the exact original black or white fabric colour, round neckline, sleeve length, cut, and seams. CRITICAL: preserve the embroidery's original design, colours, wording, size and chest placement; small left-chest designs must stay small and left-chest, never centred or enlarged."} Remove the background, rail, surrounding logo badge, yellow price sticker and ALL promotional graphics that are outside the garment artwork. Never remove, simplify, recolour or redesign actual embroidery/printing on the product. Soft neutral studio lighting with subtle side definition, crisp fabric weave and thread texture, natural handmade irregularities, no CGI gloss. Centred square high-resolution photograph with the complete product occupying about 85% of the canvas and at least 6% transparent safe margins at every edge. Genuine alpha transparency including the tote handle openings; no floor, no backdrop, no props, no external lettering, no watermark, no cast floor shadow. The website supplies the warm ivory studio surface; keep only the beautifully lit original product.`,
  };
});
await writeFile(
  `${root}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      category_slug: "needlework",
      mode: "built-in image_gen",
      price_confirmation: "เสื้อทุกลาย 399 บาท กระเป๋า 199 บาท ตามคำสั่งผู้ใช้",
      products,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Prepared 22 distinct embroidered shirts and one tote, preserving every supplied design.",
);
