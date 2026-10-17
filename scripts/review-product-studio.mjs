import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("content/product-studio");
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const photos = [];
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
for (const asset of manifest.assets) {
  try {
    const buffer = await readFile(asset.output);
    const meta = await sharp(buffer).metadata();
    const stats = await sharp(buffer).stats();
    assert.ok(meta.width >= 1024 && meta.height >= 1024);
    assert.ok(meta.hasAlpha && stats.channels[3].min === 0);
    photos.push({ ...asset, width: meta.width, height: meta.height });
    asset.generated_width = meta.width;
    asset.generated_height = meta.height;
    asset.alpha_verified = true;
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
await writeFile(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
await writeFile(
  path.join(root, "review.html"),
  `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ภาพผลิตภัณฑ์สตูดิโอ</title><style>body{margin:0;padding:40px;background:#f8f6f0;color:#243b32;font:16px/1.7 system-ui,sans-serif}h1{font-weight:500}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px}.photos{display:grid;grid-template-columns:1fr 1fr;gap:8px}.studio{background:radial-gradient(ellipse at 32% 22%,#f8f6f0,transparent 68%),linear-gradient(155deg,#efede5,#f8f6f0 48%,#d3d7cb);border:1px solid #d8dbce;border-radius:8px}img{display:block;width:100%;height:240px;object-fit:contain;padding:16px;box-sizing:border-box}.studio img{filter:drop-shadow(0 10px 8px #243b322b)}small{color:#667064}article h2{font-size:16px;margin-bottom:4px}</style><h1>ภาพผลิตภัณฑ์ · Premium Studio</h1><p>ต้นฉบับ / ภาพแต่งแสงและตัดพื้นหลัง · ${photos.length} ภาพ</p><div class="grid">${photos.map((a) => `<article><div class="photos"><img src="${escape(path.relative(root, path.resolve(a.reference)).replaceAll("\\", "/"))}" alt="ต้นฉบับ ${escape(a.product_name)}"><div class="studio"><img src="${escape(path.relative(root, path.resolve(a.output)).replaceAll("\\", "/"))}" alt="ภาพสตูดิโอ ${escape(a.product_name)}"></div></div><h2>${escape(a.product_name)}</h2><small>${a.generated_width ?? a.width} × ${a.generated_height ?? a.height} · PNG โปร่งใส${a.library_only ? " · คลังภาพ" : a.source_note ? " · ใช้ต้นฉบับเดิม" : ""}</small></article>`).join("")}</div></html>`,
);
console.log(`Verified alpha and resolution for ${photos.length} photos; saved review.html.`);
