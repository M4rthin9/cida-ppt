import { sql } from "drizzle-orm";
import { users } from "./users";
import {
  boolean,
  index,
  uniqueIndex,
  check,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { priceDisplay } from "./enums";
import { localeColumn } from "./locales";
import { media } from "./media";
import { categories } from "./categories";
import { primaryId, seedFlag, softDelete, timestamps } from "./shared";

export const products = pgTable(
  "products",
  {
    id: primaryId(),
    categoryId: varchar("category_id", { length: 36 })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    /** numeric, not float — money must not drift. Null when price_display is contact/hidden. */
    price: numeric("price", { precision: 12, scale: 2 }),
    priceDisplay: priceDisplay("price_display").notNull().default("exact"),
    priceMode: varchar("price_mode", { length: 24 }).notNull().default("contact"),
    salePrice: numeric("sale_price", { precision: 12, scale: 2 }),
    stockStatus: varchar("stock_status", { length: 24 }).notNull().default("available"),
    quantity: integer("quantity"),
    madeToOrder: boolean("made_to_order").notNull().default(false),
    leadTime: text("lead_time"),
    materials: text("materials"),
    dimensions: text("dimensions"),
    weight: numeric("weight", { precision: 12, scale: 3 }),
    isNew: boolean("is_new").notNull().default(false),
    status: varchar("status", { length: 24 }).notNull().default("draft"),
    createdBy: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: varchar("updated_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    sku: varchar("sku", { length: 64 }),
    badge: varchar("badge", { length: 64 }),
    /** Overrides settings.line.message_template for this product only (SPEC.md §8). */
    lineMessageOverride: text("line_message_override"),
    sortOrder: integer("sort_order").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    /**
     * Public queries filter on `is_published AND published_at <= now()` (SPEC.md §9),
     * which is what makes "scheduled" a state without a third column.
     */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ogMediaId: varchar("og_media_id", { length: 36 }).references(() => media.id, {
      onDelete: "set null",
    }),
    ...seedFlag,
    ...softDelete,
    ...timestamps,
  },
  (t) => [
    uniqueIndex("products_sku_unique").on(t.sku),
    index("products_catalog_idx").on(t.categoryId, t.status, t.sortOrder),
    index("products_featured_idx").on(t.isFeatured, t.status),
    check("products_prices_nonnegative", sql`${t.price} >= 0 AND ${t.salePrice} >= 0`),
    check("products_quantity_nonnegative", sql`${t.quantity} >= 0`),
    check("products_weight_nonnegative", sql`${t.weight} >= 0`),
    check(
      "products_sale_valid",
      sql`${t.salePrice} IS NULL OR (${t.price} IS NOT NULL AND ${t.salePrice} <= ${t.price})`,
    ),
    check(
      "products_status_valid",
      sql`${t.status} IN ('draft','published','out_of_stock','hidden','archived')`,
    ),
    check(
      "products_price_mode_valid",
      sql`${t.priceMode} IN ('exact','from','contact','made_to_order','showcase')`,
    ),
    check(
      "products_stock_valid",
      sql`${t.stockStatus} IN ('available','out_of_stock','made_to_order')`,
    ),
    check(
      "products_price_required",
      sql`${t.priceMode} NOT IN ('exact','from') OR ${t.price} IS NOT NULL`,
    ),
  ],
);

export const productI18n = pgTable(
  "product_i18n",
  {
    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locale: localeColumn(),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    shortDesc: text("short_desc"),
    /** Tiptap JSON. Sanitised server-side before storing (CLAUDE.md). */
    body: jsonb("body"),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.locale] }),
    unique("product_i18n_locale_slug_key").on(t.locale, t.slug),
  ],
);

export const productMedia = pgTable(
  "product_media",
  {
    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: varchar("media_id", { length: 36 })
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.productId, t.mediaId] })],
);

/** Size, material, colour… — the label and value are both translatable. */
export const productSpecs = pgTable("product_specs", {
  id: primaryId(),
  productId: varchar("product_id", { length: 36 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const productSpecI18n = pgTable(
  "product_spec_i18n",
  {
    specId: varchar("spec_id", { length: 36 })
      .notNull()
      .references(() => productSpecs.id, { onDelete: "cascade" }),
    locale: localeColumn(),
    label: varchar("label", { length: 255 }).notNull(),
    value: text("value").notNull(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.specId, t.locale] })],
);
