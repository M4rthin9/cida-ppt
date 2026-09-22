/**
 * Re-encode staged frames for delivery, in place.
 *
 * The importer copies original bytes by default. A camera or editor export is
 * usually far heavier than the web needs — a 20-second 720p set can be a
 * megabyte a frame — and a sequence that large never keeps up with the scroll
 * however well the player preloads. This is the opt-in step that makes one
 * deliverable, run from import-frames.py rather than on its own.
 *
 * Sharp is already a dependency; it also gives the importer a real decoder to
 * check the frames with instead of trusting the file name.
 */
import { readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { join, parse } from "node:path";
import sharp from "sharp";

const [directory, widthArg, qualityArg] = process.argv.slice(2);
if (!directory) {
  console.error("Usage: encode-frames.mjs <directory> [maxWidth] [quality]");
  process.exit(1);
}
const maxWidth = Number(widthArg) || 1280;
const quality = Number(qualityArg) || 76;
if (!Number.isInteger(maxWidth) || maxWidth < 320 || maxWidth > 3840) {
  console.error("maxWidth must be between 320 and 3840");
  process.exit(1);
}
if (!Number.isInteger(quality) || quality < 40 || quality > 95) {
  console.error("quality must be between 40 and 95");
  process.exit(1);
}

const names = (await readdir(directory)).filter((name) => !name.startsWith(".")).sort();
let before = 0;
let after = 0;
for (const name of names) {
  const source = join(directory, name);
  const image = sharp(source, { failOn: "error" });
  const { width } = await image.metadata();
  const encoded = await image
    // Never upscale: a source narrower than the ceiling is left at its own size.
    .resize({ width: Math.min(maxWidth, width ?? maxWidth), withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toBuffer();
  before += (await stat(source)).size;
  after += encoded.length;
  // Write the encoded bytes as they are. Handing the buffer back to sharp to
  // save it would encode a second time, for a second generation of loss.
  const destination = join(directory, `${parse(name).name}.jpg`);
  await writeFile(`${destination}.tmp`, encoded);
  await unlink(source);
  await rename(`${destination}.tmp`, destination);
}
console.log(
  JSON.stringify({
    frames: names.length,
    bytesBefore: before,
    bytesAfter: after,
    quality,
    maxWidth,
  }),
);
