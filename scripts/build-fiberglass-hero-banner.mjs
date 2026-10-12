import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const directory = "content/category-banners";
const original = await readFile("content/fiberglass-drafts/originals/image32.png");
const background = await sharp(`${directory}/studio-setting-v3.png`)
  .resize(750, 500)
  .png()
  .toBuffer();
const shadow = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="750" height="500"><defs><filter id="soft"><feGaussianBlur stdDeviation="3"/></filter></defs><ellipse cx="535" cy="276" rx="69" ry="5" fill="#182218" opacity=".24" filter="url(#soft)"/></svg>',
);
// The workbook already supplies a transparent PNG. Use it directly without
// segmentation, repainting, scaling, colour adjustment or product generation.
const scene = await sharp(background)
  .composite([
    { input: shadow, left: 0, top: 0 },
    { input: original, left: 439, top: 36 },
  ])
  .png()
  .toBuffer();
const banner = await sharp(scene)
  .extract({ left: 0, top: 0, width: 750, height: 420 })
  .png()
  .toBuffer();
const sourcePixels = await sharp(original).ensureAlpha().raw().toBuffer();
const placedPixels = await sharp(banner)
  .extract({ left: 439, top: 36, width: 180, height: 241 })
  .ensureAlpha()
  .raw()
  .toBuffer();
for (let i = 0; i < sourcePixels.length; i += 4) {
  if (sourcePixels[i + 3] !== 255) continue;
  for (let channel = 0; channel < 3; channel++)
    assert.equal(placedPixels[i + channel], sourcePixels[i + channel]);
}
await writeFile(`${directory}/fiberglass-hero-v3.png`, banner);
await writeFile(
  `${directory}/studio-v3-notes.md`,
  "# Final studio banner\n\nThe generated setting uses a forest-green wall, warm architectural lighting and one ivory display plinth. The original transparent workbook photograph `image32.png` is composited at its native 180 × 241 resolution, without segmentation, resampling, retouching, repainting or AI product generation. All opaque product RGB pixels are verified identical in the final PNG. Original transparency is composited naturally over the setting.\n\nBackground generated with the built-in image tool. Prompt: premium ecommerce category background only; one warm-ivory cylindrical plinth right of centre; forest-green limewashed studio, soft warm side light and subtle foliage shadows; dark negative space left and below; no products, sculptures, text or collage.\n\nFinal asset: `fiberglass-hero-v3.png`. Reproduce with `node scripts/build-fiberglass-hero-banner.mjs`.\n",
);
console.log("Final banner saved; original opaque product pixels verified unchanged.");
