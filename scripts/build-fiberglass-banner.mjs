import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const destination = "content/category-banners";
await mkdir(destination, { recursive: true });
// Use real catalogue photographs at their native resolution. No generated products,
// cutouts, perspective changes or retouching; the surrounding artwork is decorative.
const backdrop = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="650" viewBox="0 0 1100 650">
<defs><radialGradient id="ground" cx="75%" cy="15%" r="100%"><stop stop-color="#6b7e68"/><stop offset=".55" stop-color="#304d40"/><stop offset="1" stop-color="#142b23"/></radialGradient><linearGradient id="fade" x2="0" y2="1"><stop stop-color="#d5bd8a" stop-opacity=".22"/><stop offset="1" stop-color="#d5bd8a" stop-opacity="0"/></linearGradient></defs>
<rect width="1100" height="650" fill="url(#ground)"/>
<g fill="none" stroke="#d5bd8a" stroke-opacity=".2"><circle cx="770" cy="200" r="360"/><circle cx="770" cy="200" r="385"/><path d="M32 590H1068M32 610H1068"/></g>
<g fill="#e2cd9f"><circle cx="385" cy="199" r="4"/><circle cx="1030" cy="52" r="3"/></g>
</svg>`;
const pieces = [
  { file: "row-6-image15.png", left: 65, top: 100 },
  { file: "row-8-image9.png", left: 355, top: 35 },
  { file: "row-26-image20.png", left: 720, top: 190 },
];
const layers = [];
for (const piece of pieces) {
  const buffer = await readFile(`content/fiberglass-drafts/presentation/${piece.file}`);
  const { width, height } = await sharp(buffer).metadata();
  const frame = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 16}" height="${height + 16}"><rect x="1" y="1" width="${width + 14}" height="${height + 14}" rx="12" fill="#f3eee4" stroke="#dacdb0"/></svg>`,
  );
  layers.push({ input: frame, left: piece.left - 8, top: piece.top - 8 });
  layers.push({ input: buffer, left: piece.left, top: piece.top });
}
await sharp(Buffer.from(backdrop))
  .composite(layers)
  .png()
  .toFile(`${destination}/fiberglass-originals.png`);
await writeFile(
  `${destination}/README.md`,
  "# Fiberglass category banner\n\n`fiberglass-originals.png` is composed from the original workbook photographs for rows 6, 8 and 26. The products are not generated, redrawn, retouched, recoloured or cropped. Native-resolution, upright presentation copies sit on a forest-green decorative background with ivory photo frames. Text is supplied by the website's category tile.\n\nRebuild with `node scripts/build-fiberglass-banner.mjs`. Original photographs remain in `content/fiberglass-drafts/originals/`.\n",
);
console.log(`${destination}/fiberglass-originals.png`);
