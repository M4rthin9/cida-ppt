import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const root = "content/category-banners/all-categories";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const previous = JSON.parse(
  await readFile("content/category-banners/studio-v4/manifest.json", "utf8"),
);
const panorama = JSON.parse(
  await readFile("content/category-banners/studio-v4/panorama-manifest.json", "utf8"),
);
const reused = Object.entries(manifest.reused_category)
  .filter(([key]) => key !== "slug")
  .map(([kind, output]) => ({
    key: `fiberglass-and-wood-${kind}`,
    slug: "fiberglass-and-wood",
    name: "ไฟเบอร์กลาส และ ไม้",
    kind,
    output,
    prompt: [...previous.assets, ...panorama.assets].find((a) => a.output === output)?.prompt,
  }));
const assets = [...reused, ...manifest.assets];
for (const a of assets) {
  try {
    const meta = await sharp(a.output).metadata();
    a.width = meta.width;
    a.height = meta.height;
    a.complete = true;
  } catch (e) {
    if (!e.message.includes("missing") && e.code !== "ENOENT") throw e;
  }
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
const escape = (v) =>
  String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const groups = [...new Set(assets.map((a) => a.slug))]
  .map((slug) => {
    const items = assets.filter((a) => a.slug === slug);
    return `<section><h2>${escape(items[0].name)}</h2><p><a href="http://localhost:3000/products/category/${slug}">ดูแบนเนอร์บนเว็บไซต์ ↗</a></p>${items.map((a) => `<figure><figcaption>${a.kind} · ${a.width ?? ""} × ${a.height ?? ""}</figcaption>${a.complete ? `<img class="${a.kind}" src="../../../${escape(a.output)}" alt="${escape(a.name)} ${a.kind}">` : "กำลังสร้างภาพ"}<details><summary>คำสั่งสร้างภาพ — built-in image_gen</summary><pre>${escape(a.prompt)}${a.refinement_prompt ? "\n\nCamera framing refinement:\n" + escape(a.refinement_prompt) : ""}</pre></details></figure>`).join("")}</section>`;
  })
  .join("\n");
await writeFile(
  `${root}/review.html`,
  `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>แบนเนอร์ครบ 4 หมวด</title><style>body{margin:0;background:#f6f2e9;color:#213f34;font:16px/1.8 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:40px 24px}h1,h2{font-weight:500}a{color:inherit}section{margin:36px 0;padding:28px;background:#fffdf7;border:1px solid #d8dbce;border-radius:18px}figure{margin:24px 0}img{display:block;width:100%;height:auto;border-radius:10px}.portrait{width:min(100%,360px)}.tile{width:min(100%,640px)}figcaption,summary{color:#667064;font-size:13px}pre{white-space:pre-wrap;font:13px/1.7 system-ui}</style><main><h1>แบนเนอร์สินค้าในธีมเดียวกันครบ 4 หมวด</h1><p>ภาพเต็มพื้นที่สำหรับหน้าใน ภาพหมวดบนหน้าแรก และภาพแนวตั้งสำหรับมือถือ พวงหรีดใช้ 3 แบบพร้อมขาตั้งตามคำสั่งล่าสุด</p><p><a href="manifest.json">ไฟล์ภาพ แหล่งอ้างอิง และคำสั่งสร้างทั้งหมด</a></p>${groups}</main></html>`,
);
console.log("Saved four-category banner review, actual dimensions and full prompts.");
