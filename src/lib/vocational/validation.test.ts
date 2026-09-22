import { describe, it, expect } from "vitest";
import { productInput, categoryInput, newsInput } from "./validation";
import { priceLabel } from "./types";
const category = {
  name_th: "งานฝีมือ",
  name_en: "",
  slug: "craft",
  short_description_th: "",
  short_description_en: "",
  description_th: "",
  description_en: "",
  seo_title: "",
  seo_description: "",
  display_order: 0,
  is_featured: false,
  cover_image: null,
  thumbnail_image: null,
  icon_media_id: null,
  icon: "craft",
  status: "published",
  is_enabled: true,
};
const product = {
  name_th: "ผลงานทดสอบ",
  name_en: "",
  slug: "test-craft",
  short_description_th: "",
  short_description_en: "",
  description_th: "",
  description_en: "",
  seo_title: "",
  seo_description: "",
  display_order: 0,
  is_featured: false,
  sku: "",
  category_id: "64d4582a-10f6-4f69-a734-3821c9c494c7",
  price_mode: "contact",
  price: null,
  sale_price: null,
  media_ids: [],
  materials: "",
  dimensions: "",
  weight: null,
  quantity: null,
  stock_status: "available",
  made_to_order: false,
  lead_time: "",
  is_new: false,
  status: "draft",
};
describe("vocational publishing boundaries", () => {
  it("requires a Thai name and an existing-category-shaped id", () => {
    expect(productInput.safeParse({ ...product, name_th: " ", category_id: "" }).success).toBe(
      false,
    );
    expect(productInput.safeParse(product).success).toBe(true);
  });
  it("rejects negative, excessive-precision, missing and inconsistent prices", () => {
    for (const price of [-1, 1.001, null])
      expect(productInput.safeParse({ ...product, price_mode: "exact", price }).success).toBe(
        false,
      );
    expect(
      productInput.safeParse({ ...product, price_mode: "exact", price: 10, sale_price: 20 })
        .success,
    ).toBe(false);
    expect(productInput.safeParse({ ...product, quantity: 0.5 }).success).toBe(false);
  });
  it("permits honest nonnumeric price modes without exposing a zero price", () => {
    for (const mode of ["contact", "made_to_order", "showcase"] as const) {
      expect(productInput.safeParse({ ...product, price_mode: mode }).success).toBe(true);
      expect(productInput.safeParse({ ...product, price_mode: mode, price: 100 }).success).toBe(
        false,
      );
      expect(priceLabel({ price_mode: mode, price: null, sale_price: null })).not.toMatch(/0/);
    }
  });
  it("rejects duplicate gallery references and unsupported publishing states", () => {
    expect(
      productInput.safeParse({ ...product, media_ids: [product.category_id, product.category_id] })
        .success,
    ).toBe(false);
    expect(productInput.safeParse({ ...product, status: "approved" }).success).toBe(false);
  });
  it("validates safe unique-key input and disallows undeclared client fields", () => {
    expect(categoryInput.safeParse(category).success).toBe(true);
    expect(categoryInput.safeParse({ ...category, slug: "../admin" }).success).toBe(false);
    expect(categoryInput.safeParse({ ...category, created_by: "spoofed" }).success).toBe(false);
  });
  it("requires parseable publication dates", () => {
    const news = {
      title: "กิจกรรมฝึกอาชีพ",
      slug: "workshop",
      excerpt: "",
      description: "",
      cover_image: null,
      media_ids: [],
      is_published: true,
      published_at: "2026-01-01T02:30:00Z",
      seo_title: "",
      seo_description: "",
      type: "event",
    };
    expect(newsInput.safeParse(news).success).toBe(true);
    expect(newsInput.safeParse({ ...news, published_at: "not a date" }).success).toBe(false);
  });
});
