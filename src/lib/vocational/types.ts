export const CATEGORY_STATUSES = {
  draft: "ฉบับร่าง",
  published: "เผยแพร่",
  hidden: "ซ่อน",
} as const;
export const PRODUCT_STATUSES = {
  ...CATEGORY_STATUSES,
  out_of_stock: "สินค้าหมด",
  archived: "เก็บถาวร",
} as const;
export const PRICE_MODES = {
  exact: "ราคาคงที่",
  from: "ราคาเริ่มต้น",
  contact: "สอบถามราคา",
  made_to_order: "รับสั่งทำ",
  showcase: "จัดแสดงผลงาน",
} as const;
export const STOCK_STATUSES = {
  available: "พร้อมจำหน่าย",
  out_of_stock: "สินค้าหมด",
  made_to_order: "ผลิตตามสั่ง",
} as const;
export type PriceMode = keyof typeof PRICE_MODES;
export type MediaItem = {
  id: string;
  storage_key: string;
  filename: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};
export type Category = {
  id: string;
  name_th: string;
  name_en: string;
  slug: string;
  short_description_th: string;
  short_description_en: string;
  description_th: string;
  description_en: string;
  cover_image: string | null;
  thumbnail_image: string | null;
  icon_media_id: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  icon_url: string | null;
  icon: string;
  display_order: number;
  status: keyof typeof CATEGORY_STATUSES;
  is_enabled: boolean;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
  product_count: number;
  updated_at: string;
  deleted_at: string | null;
};
export type Product = {
  id: string;
  name_th: string;
  name_en: string;
  slug: string;
  sku: string | null;
  category_id: string;
  category_name: string;
  category_slug: string;
  short_description_th: string;
  short_description_en: string;
  description_th: string;
  description_en: string;
  price: string | null;
  sale_price: string | null;
  price_mode: PriceMode;
  materials: string | null;
  dimensions: string | null;
  weight: string | null;
  quantity: number | null;
  stock_status: keyof typeof STOCK_STATUSES;
  made_to_order: boolean;
  lead_time: string | null;
  status: keyof typeof PRODUCT_STATUSES;
  display_order: number;
  is_featured: boolean;
  is_new: boolean;
  seo_title: string;
  seo_description: string;
  image_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};
export type News = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  cover_image: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  deleted_at: string | null;
  seo_title: string;
  seo_description: string;
  type: "news" | "event";
};
export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  id?: string;
};
export function priceLabel(p: Pick<Product, "price_mode" | "price" | "sale_price">) {
  const amount = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(p.sale_price ?? p.price ?? 0));
  if (p.price_mode === "exact") return amount;
  if (p.price_mode === "from") return `เริ่มต้น ${amount}`;
  return PRICE_MODES[p.price_mode];
}
