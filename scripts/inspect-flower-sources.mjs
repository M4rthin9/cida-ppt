import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

const source = "รูปผลิตภัณฑ์/ดอกไม้ประดิษฐ์";
const root = "content/artificial-flowers";
await mkdir(`${root}/references`, { recursive: true });
const images = [];
for (const [index, filename] of (await readdir(source))
  .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
  .sort()
  .entries()) {
  const file = `${source}/${filename}`;
  const bytes = await readFile(file);
  const meta = await sharp(bytes).metadata();
  const reference = `${root}/references/flower-${String(index + 1).padStart(2, "0")}.jpg`;
  await sharp(bytes)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#f7f3e9" })
    .jpeg({ quality: 95 })
    .toFile(reference);
  images.push({
    key: `flower-${String(index + 1).padStart(2, "0")}`,
    filename,
    source: file,
    source_sha256: createHash("sha256").update(bytes).digest("hex"),
    source_width: meta.width,
    source_height: meta.height,
    source_has_alpha: meta.hasAlpha,
    price_thb: Number(filename.match(/^\d+/)?.[0]),
    reference,
  });
}
await writeFile(`${root}/source-inventory.json`, JSON.stringify(images, null, 2) + "\n");
await writeFile(
  `${root}/source-review.html`,
  `<!doctype html><meta charset="utf-8"><title>Flower source review</title><style>body{font:16px system-ui;background:#f5f1e8;color:#213f34;padding:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}figure{margin:0}img{width:100%;height:400px;object-fit:contain;background:white}figcaption{padding:12px}</style><h1>Supplied artificial flower photographs</h1><main>${images.map((i) => `<figure><img src="references/${i.key}.jpg"><figcaption>${i.key} · ${i.filename} · ${i.price_thb} THB</figcaption></figure>`).join("")}</main>`,
);
console.log(
  JSON.stringify(
    images.map(({ key, filename, price_thb, source_width, source_height, source_has_alpha }) => ({
      key,
      filename,
      price_thb,
      source_width,
      source_height,
      source_has_alpha,
    })),
    null,
    2,
  ),
);
