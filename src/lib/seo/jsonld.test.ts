import { describe, expect, it } from "vitest";
import { articleJsonLd, breadcrumbJsonLd, productJsonLd } from "./jsonld";

const BASE = "https://cidapt.com";

describe("productJsonLd", () => {
  const common = {
    base: BASE,
    locale: "th",
    name: "พวงหรีดทรงกลม",
    path: "/product/puangreed-1",
    images: ["/media/abc/1600.jpg"],
  };

  it("never claims availability", () => {
    // §10: offers.availability is omitted because there is no online purchase.
    const data = productJsonLd({ ...common, priceDisplay: "exact", price: "500.00" });
    expect(JSON.stringify(data)).not.toContain("availability");
  });

  it("emits an offer with a THB price when the price is shown", () => {
    const data = productJsonLd({ ...common, priceDisplay: "exact", price: "500.00" });
    expect(data.offers).toMatchObject({ price: "500.00", priceCurrency: "THB" });
  });

  it("emits no offer at all for a contact-for-price product", () => {
    // Inventing one would be a public claim about a price nobody published.
    const data = productJsonLd({ ...common, priceDisplay: "contact" });
    expect(data.offers).toBeUndefined();
  });
  it("labels sharing and outright options as separate offers", () => {
    const data = productJsonLd({
      ...common,
      priceDisplay: "exact",
      price: "4000.00",
      sharingPrice: "1700.00",
    });
    expect(data.offers).toEqual([
      expect.objectContaining({ name: "ราคาขายขาด", price: "4000.00", priceCurrency: "THB" }),
      expect.objectContaining({ name: "ราคาแบ่งปัน", price: "1700.00", priceCurrency: "THB" }),
    ]);
    expect(JSON.stringify(data)).not.toContain("availability");
    expect(
      productJsonLd({ ...common, priceDisplay: "contact", sharingPrice: "1700.00" }).offers,
    ).toBeUndefined();
  });

  it("emits no offer for a hidden price even when a number exists", () => {
    const data = productJsonLd({ ...common, priceDisplay: "hidden", price: "500.00" });
    expect(data.offers).toBeUndefined();
  });

  it("makes image urls absolute", () => {
    const data = productJsonLd({ ...common, priceDisplay: "exact", price: "1" });
    expect(data.image).toEqual(["https://cidapt.com/media/abc/1600.jpg"]);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers positions from one and resolves each item to an absolute url", () => {
    const data = breadcrumbJsonLd(BASE, "th", [
      { name: "หน้าแรก", path: "/" },
      { name: "พวงหรีด", path: "/category/พวงหรีด" },
    ]);
    const items = data.itemListElement as { position: number; item: string }[];
    expect(items[0]).toMatchObject({ position: 1, item: "https://cidapt.com" });
    expect(items[1]?.position).toBe(2);
    expect(items[1]?.item).toContain("%E0%B8%9E");
  });
});

describe("articleJsonLd", () => {
  it("records the locale and an ISO publication date", () => {
    const data = articleJsonLd({
      base: BASE,
      locale: "th",
      headline: "ข่าว",
      path: "/news/a",
      publishedAt: new Date("2026-01-02T03:04:05Z"),
      siteName: "ทัณฑสถาน",
    });
    expect(data.inLanguage).toBe("th");
    expect(data.datePublished).toBe("2026-01-02T03:04:05.000Z");
  });

  it("omits datePublished rather than inventing one for an unscheduled post", () => {
    const data = articleJsonLd({
      base: BASE,
      locale: "th",
      headline: "ข่าว",
      path: "/news/a",
      publishedAt: null,
      siteName: "x",
    });
    expect(data.datePublished).toBeUndefined();
  });
});
