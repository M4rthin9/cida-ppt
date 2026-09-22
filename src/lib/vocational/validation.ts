import { z } from "zod";
const text = (max = 2000) => z.string().trim().max(max, "ข้อความยาวเกินไป");
const id = z.string().uuid("รหัสข้อมูลไม่ถูกต้อง");
const optionalId = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  id.nullable(),
);
const amount = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().finite().min(0, "ต้องไม่ติดลบ").max(9999999999.99, "จำนวนมากเกินไป").nullable(),
);
const money = amount.refine(
  (v) => v === null || Math.abs(v * 100 - Math.round(v * 100)) < 0.0001,
  "ราคาใช้ทศนิยมได้ไม่เกิน 2 ตำแหน่ง",
);
const integer = z.coerce
  .number()
  .int("ต้องเป็นจำนวนเต็ม")
  .min(0, "ต้องไม่ติดลบ")
  .max(2147483647)
  .default(0);
const slug = text(255)
  .min(1, "กรุณากรอกลิงก์")
  .regex(
    /^[a-z0-9\u0e00-\u0e7f]+(?:-[a-z0-9\u0e00-\u0e7f]+)*$/,
    "ใช้ตัวอักษรไทย อังกฤษพิมพ์เล็ก ตัวเลข และขีดกลาง",
  );
const common = {
  name_th: text(255).min(1, "กรุณากรอกชื่อภาษาไทย"),
  name_en: text(255),
  slug,
  short_description_th: text(),
  short_description_en: text(),
  description_th: text(50000),
  description_en: text(50000),
  seo_title: text(255),
  seo_description: text(1000),
  display_order: integer,
  is_featured: z.boolean().default(false),
};
export const categoryInput = z
  .object({
    ...common,
    cover_image: optionalId,
    thumbnail_image: optionalId,
    icon_media_id: optionalId,
    icon: z.enum(["wreath", "material", "flower", "textile", "craft"]).default("craft"),
    status: z.enum(["draft", "published", "hidden"]),
    is_enabled: z.boolean().default(true),
  })
  .strict();
export const productInput = z
  .object({
    ...common,
    sku: text(64),
    category_id: id,
    price_mode: z.enum(["exact", "from", "contact", "made_to_order", "showcase"]),
    price: money,
    sale_price: money,
    media_ids: z
      .array(id)
      .max(20, "เลือกรูปได้ไม่เกิน 20 รูป")
      .refine((v) => new Set(v).size === v.length, "รูปภาพซ้ำกัน"),
    materials: text(),
    dimensions: text(500),
    weight: amount,
    quantity: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      integer.nullable(),
    ),
    stock_status: z.enum(["available", "out_of_stock", "made_to_order"]),
    made_to_order: z.boolean(),
    lead_time: text(500),
    is_new: z.boolean(),
    status: z.enum(["draft", "published", "out_of_stock", "hidden", "archived"]),
  })
  .strict()
  .superRefine((v, c) => {
    if (["exact", "from"].includes(v.price_mode) && v.price === null)
      c.addIssue({ code: "custom", path: ["price"], message: "กรุณากรอกราคาสำหรับรูปแบบที่เลือก" });
    if (v.sale_price !== null && (v.price === null || v.sale_price > v.price))
      c.addIssue({ code: "custom", path: ["sale_price"], message: "ราคาพิเศษต้องไม่เกินราคาปกติ" });
    if (!["exact", "from"].includes(v.price_mode) && (v.price !== null || v.sale_price !== null))
      c.addIssue({
        code: "custom",
        path: ["price"],
        message: "รูปแบบนี้ไม่ใช้ราคาตัวเลข กรุณาล้างราคา",
      });
  });
export const newsInput = z
  .object({
    title: text(255).min(1, "กรุณากรอกหัวข้อ"),
    slug,
    excerpt: text(),
    description: text(50000),
    cover_image: optionalId,
    media_ids: z
      .array(id)
      .max(20)
      .refine((v) => new Set(v).size === v.length, "รูปภาพซ้ำกัน"),
    is_published: z.boolean(),
    published_at: text(40).refine((v) => !v || !Number.isNaN(Date.parse(v)), "วันเวลาไม่ถูกต้อง"),
    seo_title: text(255),
    seo_description: text(1000),
    type: z.enum(["news", "event"]),
  })
  .strict();
export const idInput = id;
export function readFields(form: FormData) {
  const raw = JSON.parse(String(form.get("payload") ?? "{}")) as unknown;
  return raw;
}
export function plainDocument(value: string) {
  return {
    type: "doc",
    content: value
      .split("\n")
      .map((text) => ({ type: "paragraph", content: text ? [{ type: "text", text }] : [] })),
  };
}
export function documentText(value: unknown): string {
  if (typeof value !== "object" || !value) return "";
  const n = value as { text?: unknown; content?: unknown; type?: unknown };
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.content))
    return n.content.map(documentText).join(n.type === "doc" ? "\n" : "");
  return "";
}
