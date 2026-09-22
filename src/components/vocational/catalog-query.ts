export type PublicSearchParams = Record<string, string | string[] | undefined>;

/** Repeated and unknown parameters must never become catalog controls. */
export function catalogQuery(input: PublicSearchParams): Record<string, string | undefined> {
  const query: Record<string, string | undefined> = {};
  for (const [key, limit] of [
    ["q", 160],
    ["category", 255],
  ] as const) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) query[key] = value.trim().slice(0, limit);
  }
  if (
    typeof input.stock === "string" &&
    ["available", "made_to_order", "out_of_stock"].includes(input.stock)
  ) {
    query.stock = input.stock;
  }
  if (
    typeof input.sort === "string" &&
    ["featured", "newest", "name", "price_asc", "price_desc"].includes(input.sort)
  ) {
    query.sort = input.sort;
  }
  for (const key of ["featured", "new"] as const) {
    if (input[key] === "1") query[key] = "1";
  }
  const page = typeof input.page === "string" && /^\d+$/.test(input.page) ? Number(input.page) : 1;
  if (page > 1) query.page = String(Math.min(100000, page));
  return query;
}

export function catalogHref(base: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  return params.size ? `${base}?${params}` : base;
}
