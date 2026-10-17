import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = path.resolve("รูปผลิตภัณฑ์");
const output = path.resolve("content/product-studio");
await mkdir(output, { recursive: true });
const files = (await readdir(source)).filter((file) => /\.(jpe?g|png)$/i.test(file)).sort();
const inventory = [];
const sheets = [];
for (const [index, file] of files.entries()) {
  const bytes = await readFile(path.join(source, file));
  const meta = await sharp(bytes).metadata();
  inventory.push({
    index: index + 1,
    file,
    width: meta.width,
    height: meta.height,
    orientation: meta.orientation,
    bytes: bytes.length,
  });
  const tile = await sharp(bytes)
    .rotate()
    .resize(300, 270, { fit: "contain", background: "#f8f6f0" })
    .png()
    .toBuffer();
  const label = Buffer.from(
    `<svg width="300" height="30"><rect width="300" height="30" fill="#f8f6f0"/><text x="12" y="22" fill="#243b32" font-size="18">${index + 1}</text></svg>`,
  );
  sheets.push(
    await sharp({ create: { width: 300, height: 300, channels: 4, background: "#f8f6f0" } })
      .composite([
        { input: tile, left: 0, top: 0 },
        { input: label, left: 0, top: 270 },
      ])
      .png()
      .toBuffer(),
  );
}
for (let start = 0; start < sheets.length; start += 12) {
  const batch = sheets.slice(start, start + 12);
  await sharp({
    create: {
      width: 1200,
      height: Math.ceil(batch.length / 4) * 300,
      channels: 4,
      background: "#f8f6f0",
    },
  })
    .composite(
      batch.map((input, i) => ({ input, left: (i % 4) * 300, top: Math.floor(i / 4) * 300 })),
    )
    .png()
    .toFile(path.join(output, `sources-${Math.floor(start / 12) + 1}.png`));
}
await writeFile(
  path.join(output, "source-inventory.json"),
  JSON.stringify(inventory, null, 2) + "\n",
);
console.log(JSON.stringify(inventory));
const imported = JSON.parse(await readFile("content/fiberglass-drafts/cms-import.json", "utf8"));
console.log(
  JSON.stringify(
    imported.products.map((p) => ({
      id: p.id,
      name: p.name_th,
      slug: p.slug,
      row: p.source_row,
      media: p.media_ids,
    })),
  ),
);
