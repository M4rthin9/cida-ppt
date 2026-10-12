import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const directory = path.resolve("content/fiberglass-drafts");
const drafts = JSON.parse(await readFile(path.join(directory, "drafts.json"), "utf8"));
const output = path.join(directory, "presentation");
await mkdir(output, { recursive: true });
// Visually inspected: these photographs have the figure's head on the left.
// Quarter-turns preserve geometry; natural poses and camera viewpoints remain unchanged.
const clockwise = new Set([2, 3, 4, 5, 10, 11, 12, 13, 15, 22, 23, 29, 30, 31]);
const manifest = {
  source_sha256: drafts.source.sha256,
  method:
    "Lossless quarter-turn orientation and ivory square padding only. No AI, retouching, background removal, perspective warping, crop, resampling or product redraw.",
  original_pixels_verified: true,
  photos: [],
};
for (const product of drafts.products.filter((p) => p.material_group === "fiberglass")) {
  for (const photo of product.images) {
    const source = await readFile(path.join(directory, photo.file));
    const number = Number(path.basename(photo.file).match(/image(\d+)/)[1]);
    const rotation = clockwise.has(number) ? 90 : 0;
    const upright = await sharp(source).rotate(rotation).ensureAlpha().png().toBuffer();
    const { width, height } = await sharp(upright).metadata();
    const side = Math.ceil(Math.max(width, height) / 0.82);
    const left = Math.floor((side - width) / 2);
    const top = Math.floor((side - height) / 2);
    const framed = await sharp(upright)
      .extend({
        left,
        top,
        right: side - width - left,
        bottom: side - height - top,
        background: { r: 243, g: 238, b: 228, alpha: 1 },
      })
      .png()
      .toBuffer();
    // Remove padding and undo orientation: decoded source pixels must match exactly.
    const restored = await sharp(framed).extract({ left, top, width, height }).png().toBuffer();
    const originalPixels = await sharp(source).ensureAlpha().raw().toBuffer();
    const recoveredPixels = await sharp(restored)
      .rotate((360 - rotation) % 360)
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.deepEqual(recoveredPixels, originalPixels, photo.file);
    const file = `presentation/row-${product.source.row}-${path.basename(photo.file, path.extname(photo.file))}.png`;
    await writeFile(path.join(directory, file), framed);
    manifest.photos.push({
      draft_key: product.draft_key,
      source: photo.file,
      file,
      rotation_degrees: rotation,
      source_sha256: createHash("sha256").update(source).digest("hex"),
      width: side,
      height: side,
      source_pixels_preserved: true,
      review_issues: product.review_issues,
    });
  }
}
await writeFile(path.join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Prepared ${manifest.photos.length} original-preserving photos; ${manifest.photos.filter((p) => p.rotation_degrees).length} corrected orientations. Every source pixel verified.`,
);
