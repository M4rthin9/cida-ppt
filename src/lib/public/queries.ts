import "server-only";

import { and, asc, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  categories,
  categoryI18n,
  media,
  mediaI18n,
  postI18n,
  posts,
  productI18n,
  productMedia,
  products,
} from "@/db/schema";
import { FALLBACK_LOCALE, resolveTranslations } from "@/db/i18n";
import type { ThumbMedia } from "@/components/media/media-thumb";

/**
 * Every read the public site does. SPEC.md §9, §10.
 *
 * Two rules are enforced here and nowhere else, so a page cannot forget them:
 *
 *  - Published means `is_published AND published_at <= now()` AND not
 *    soft-deleted (§9). "Scheduled" is that predicate, not a third column.
 *  - Thai is the fallback for every locale (§6). Rows are fetched for the
 *    requested locale *and* Thai, then resolved in `src/db/i18n.ts`, so a page
 *    in a locale with no translation renders Thai rather than an empty string.
 */

/** The locales a query must fetch to be able to fall back. */
function localeSet(locale: string): string[] {
  return locale === FALLBACK_LOCALE ? [FALLBACK_LOCALE] : [locale, FALLBACK_LOCALE];
}

const productIsLive = and(
  eq(products.isPublished, true),
  lte(products.publishedAt, sql`now()`),
  isNull(products.deletedAt),
);

const postIsLive = and(
  eq(posts.isPublished, true),
  lte(posts.publishedAt, sql`now()`),
  isNull(posts.deletedAt),
);

const categoryIsLive = and(eq(categories.isPublished, true), isNull(categories.deletedAt));

export type PublicMedia = ThumbMedia & { alt: string | null; width: number | null };

export type ProductCardData = {
  id: string;
  /** Carried so the admin preview can apply a block's category filter exactly. */
  categoryId: string;
  slug: string;
  name: string;
  price: string | null;
  priceDisplay: "exact" | "from" | "contact" | "hidden";
  image: PublicMedia | null;
};

export type CategoryCardData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: PublicMedia | null;
  productCount: number;
};

export type PostCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  type: "news" | "event";
  publishedAt: Date | null;
  eventStartAt: Date | null;
  cover: PublicMedia | null;
};

/**
 * Alt text for a set of media, resolved per locale. Kept separate because every
 * consumer needs it and a join would multiply rows on the media side.
 */
async function altFor(mediaIds: string[], locale: string): Promise<Map<string, string | null>> {
  if (mediaIds.length === 0) return new Map();

  const rows = await db
    .select({ mediaId: mediaI18n.mediaId, locale: mediaI18n.locale, alt: mediaI18n.alt })
    .from(mediaI18n)
    .where(and(inArray(mediaI18n.mediaId, mediaIds), inArray(mediaI18n.locale, localeSet(locale))));

  const resolved = resolveTranslations(rows, (r) => r.mediaId, locale);
  return new Map([...resolved].map(([id, r]) => [id, r.row.alt]));
}

/** The primary image of each product, or its lowest-sorted one. */
async function primaryImages(
  productIds: string[],
  locale: string,
): Promise<Map<string, PublicMedia>> {
  if (productIds.length === 0) return new Map();

  const rows = await db
    .select({
      productId: productMedia.productId,
      isPrimary: productMedia.isPrimary,
      sortOrder: productMedia.sortOrder,
      id: media.id,
      storageKey: media.storageKey,
      filename: media.filename,
      blurhash: media.blurhash,
      focalX: media.focalX,
      focalY: media.focalY,
      width: media.width,
    })
    .from(productMedia)
    .innerJoin(media, eq(media.id, productMedia.mediaId))
    .where(and(inArray(productMedia.productId, productIds), isNull(media.deletedAt)))
    .orderBy(desc(productMedia.isPrimary), asc(productMedia.sortOrder));

  const alts = await altFor(
    rows.map((r) => r.id),
    locale,
  );

  const out = new Map<string, PublicMedia>();
  for (const row of rows) {
    if (out.has(row.productId)) continue; // ordered above: first hit is the primary
    out.set(row.productId, { ...row, alt: alts.get(row.id) ?? null });
  }
  return out;
}

async function toProductCards(
  rows: {
    id: string;
    categoryId: string;
    price: string | null;
    priceDisplay: ProductCardData["priceDisplay"];
  }[],
  locale: string,
): Promise<ProductCardData[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const i18n = await db
    .select({
      productId: productI18n.productId,
      locale: productI18n.locale,
      slug: productI18n.slug,
      name: productI18n.name,
    })
    .from(productI18n)
    .where(and(inArray(productI18n.productId, ids), inArray(productI18n.locale, localeSet(locale))));

  const names = resolveTranslations(i18n, (r) => r.productId, locale);
  const images = await primaryImages(ids, locale);

  const cards: ProductCardData[] = [];
  for (const row of rows) {
    const t = names.get(row.id);
    // No translation in any locale is a data error, not a missing translation —
    // rendering a card with no name would be worse than omitting it.
    if (!t) continue;
    cards.push({
      id: row.id,
      categoryId: row.categoryId,
      slug: t.row.slug,
      name: t.row.name,
      price: row.price,
      priceDisplay: row.priceDisplay,
      image: images.get(row.id) ?? null,
    });
  }
  return cards;
}

export async function featuredProducts(
  locale: string,
  limit = 8,
  categoryId?: string,
): Promise<ProductCardData[]> {
  const rows = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      price: products.price,
      priceDisplay: products.priceDisplay,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        productIsLive,
        categoryIsLive,
        eq(products.isFeatured, true),
        categoryId ? eq(products.categoryId, categoryId) : undefined,
      ),
    )
    .orderBy(asc(products.sortOrder))
    .limit(limit);

  return toProductCards(rows, locale);
}

export async function publishedCategories(locale: string): Promise<CategoryCardData[]> {
  const rows = await db
    .select({
      id: categories.id,
      heroMediaId: categories.heroMediaId,
      productCount: sql<number>`(
        select count(*)::int from ${products}
        where ${products.categoryId} = ${categories.id}
          and ${products.isPublished} = true
          and ${products.publishedAt} <= now()
          and ${products.deletedAt} is null
      )`,
    })
    .from(categories)
    .where(and(categoryIsLive, isNull(categories.parentId)))
    .orderBy(asc(categories.sortOrder));

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const i18n = await db
    .select({
      categoryId: categoryI18n.categoryId,
      locale: categoryI18n.locale,
      slug: categoryI18n.slug,
      name: categoryI18n.name,
      description: categoryI18n.description,
    })
    .from(categoryI18n)
    .where(
      and(inArray(categoryI18n.categoryId, ids), inArray(categoryI18n.locale, localeSet(locale))),
    );

  const names = resolveTranslations(i18n, (r) => r.categoryId, locale);
  const heroIds = rows.map((r) => r.heroMediaId).filter((v): v is string => Boolean(v));
  const heroes = await mediaByIds(heroIds, locale);

  const out: CategoryCardData[] = [];
  for (const row of rows) {
    const t = names.get(row.id);
    if (!t) continue;
    out.push({
      id: row.id,
      slug: t.row.slug,
      name: t.row.name,
      description: t.row.description,
      image: row.heroMediaId ? (heroes.get(row.heroMediaId) ?? null) : null,
      productCount: row.productCount,
    });
  }
  return out;
}

export async function mediaByIds(ids: string[], locale: string): Promise<Map<string, PublicMedia>> {
  if (ids.length === 0) return new Map();

  const rows = await db
    .select({
      id: media.id,
      storageKey: media.storageKey,
      filename: media.filename,
      blurhash: media.blurhash,
      focalX: media.focalX,
      focalY: media.focalY,
      width: media.width,
    })
    .from(media)
    .where(and(inArray(media.id, ids), isNull(media.deletedAt)));

  const alts = await altFor(
    rows.map((r) => r.id),
    locale,
  );
  return new Map(rows.map((r) => [r.id, { ...r, alt: alts.get(r.id) ?? null }]));
}

// --- posts -----------------------------------------------------------------

async function toPostCards(
  rows: {
    id: string;
    type: "news" | "event";
    publishedAt: Date | null;
    eventStartAt: Date | null;
    coverMediaId: string | null;
  }[],
  locale: string,
): Promise<PostCardData[]> {
  if (rows.length === 0) return [];

  const i18n = await db
    .select({
      postId: postI18n.postId,
      locale: postI18n.locale,
      slug: postI18n.slug,
      title: postI18n.title,
      excerpt: postI18n.excerpt,
    })
    .from(postI18n)
    .where(
      and(
        inArray(
          postI18n.postId,
          rows.map((r) => r.id),
        ),
        inArray(postI18n.locale, localeSet(locale)),
      ),
    );

  const titles = resolveTranslations(i18n, (r) => r.postId, locale);
  const covers = await mediaByIds(
    rows.map((r) => r.coverMediaId).filter((v): v is string => Boolean(v)),
    locale,
  );

  const out: PostCardData[] = [];
  for (const row of rows) {
    const t = titles.get(row.id);
    if (!t) continue;
    out.push({
      id: row.id,
      slug: t.row.slug,
      title: t.row.title,
      excerpt: t.row.excerpt,
      type: row.type,
      publishedAt: row.publishedAt,
      eventStartAt: row.eventStartAt,
      cover: row.coverMediaId ? (covers.get(row.coverMediaId) ?? null) : null,
    });
  }
  return out;
}

export async function latestPosts(
  locale: string,
  limit = 3,
  type?: "news" | "event",
): Promise<PostCardData[]> {
  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      publishedAt: posts.publishedAt,
      eventStartAt: posts.eventStartAt,
      coverMediaId: posts.coverMediaId,
    })
    .from(posts)
    .where(type ? and(postIsLive, eq(posts.type, type)) : postIsLive)
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return toPostCards(rows, locale);
}

