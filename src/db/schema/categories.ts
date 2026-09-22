import { sql } from "drizzle-orm";
import { users } from "./users";
import {
  check,
  index,
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { localeColumn } from "./locales";
import { media } from "./media";
import { primaryId, seedFlag, softDelete, timestamps } from "./shared";

/**
 * Non-translatable data only (SPEC.md §6): media, publish state, sort order,
 * nesting. Anything a human reads lives in `category_i18n`.
 * Publish state is global, never per-locale.
 */
export const categories = pgTable(
  "categories",
  {
    id: primaryId(),
    parentId: varchar("parent_id", { length: 36 }).references((): AnyPgColumn => categories.id, {
      onDelete: "restrict",
    }),
    heroMediaId: varchar("hero_media_id", { length: 36 }).references(() => media.id, {
      onDelete: "set null",
    }),
    iconMediaId: varchar("icon_media_id", { length: 36 }).references(() => media.id, {
      onDelete: "set null",
    }),
    ogMediaId: varchar("og_media_id", { length: 36 }).references(() => media.id, {
      onDelete: "set null",
    }),
    thumbnailMediaId: varchar("thumbnail_media_id", { length: 36 }).references(() => media.id, {
      onDelete: "set null",
    }),
    icon: varchar("icon", { length: 40 }).notNull().default("craft"),
    status: varchar("status", { length: 24 }).notNull().default("draft"),
    isEnabled: boolean("is_enabled").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdBy: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: varchar("updated_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(false),
    ...seedFlag,
    ...softDelete,
    ...timestamps,
  },
  (t) => [
    index("categories_public_idx").on(t.status, t.isEnabled, t.sortOrder),
    check("categories_status_valid", sql`${t.status} IN ('draft','published','hidden')`),
  ],
);

export const categoryI18n = pgTable(
  "category_i18n",
  {
    categoryId: varchar("category_id", { length: 36 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: localeColumn(),
    /** Per-locale, so a Thai slug and an English slug can coexist. */
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.categoryId, t.locale] }),
    unique("category_i18n_locale_slug_key").on(t.locale, t.slug),
  ],
);
