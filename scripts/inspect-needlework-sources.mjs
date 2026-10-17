import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
const source = "รูปผลิตภัณฑ์/เย็บปักถักร้อย";
const root = "content/needlework";
await mkdir(`${root}/references`, { recursive: true });
const inventory = [];
for (const filename of (await readdir(source)).sort((a, b) =>
  a.localeCompare(b, "th", { numeric: true }),
)) {
  const filepath = path.join(source, filename);
  const bytes = await readFile(filepath);
  const metadata = await sharp(bytes).metadata();
  const ref = `${root}/references/${filename.replace(/\.[^.]+$/, "")}-${path.extname(filename).slice(1)}.jpg`;
  await sharp(bytes)
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#f6f2e9" })
    .jpeg({ quality: 92 })
    .toFile(ref);
  inventory.push({
    filename,
    source: filepath,
    reference: ref,
    width: metadata.width,
    height: metadata.height,
    has_alpha: metadata.hasAlpha,
    source_sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
await writeFile(`${root}/inventory.json`, JSON.stringify(inventory, null, 2) + "\n");
console.log(inventory);
