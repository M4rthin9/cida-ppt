import { describe, expect, it } from "vitest";
import { catalogHref, catalogQuery } from "./catalog-query";

describe("public catalog query", () => {
  it("accepts public filters while rejecting repeated and privileged parameters", () => {
    expect(
      catalogQuery({
        q: "  งานไม้  ",
        stock: "available",
        category: "wood",
        featured: "1",
        admin: "true",
        status: "archived",
        new: ["1", "0"],
        sort: ["price_asc", "name"],
      }),
    ).toEqual({ q: "งานไม้", stock: "available", category: "wood", featured: "1" });
  });
  it("bounds input and makes page navigation preserve encoded filters", () => {
    const query = catalogQuery({ q: "a".repeat(200), page: "999999", stock: "unknown" });
    expect(query.q).toHaveLength(160);
    expect(query.page).toBe("100000");
    expect(catalogQuery({ page: "-3" }).page).toBeUndefined();
    expect(catalogQuery({ page: "3extra" }).page).toBeUndefined();
    expect(catalogHref("/products", { q: "wood & fabric", category: "wood", page: "2" })).toBe(
      "/products?q=wood+%26+fabric&category=wood&page=2",
    );
  });
});
