import "server-only";
import { sql } from "@/db/client";
import { documentText } from "./validation";
import type { Category, Product, News, MediaItem } from "./types";

export async function listCategories(admin = false): Promise<Category[]> {
  return sql<Category[]>`select c.id, t.name name_th, coalesce(e.name,'') name_en, t.slug,
 coalesce(t.short_description,'') short_description_th,coalesce(e.short_description,'') short_description_en,
 coalesce(t.description,'') description_th,coalesce(e.description,'') description_en,
 c.hero_media_id cover_image,c.thumbnail_media_id thumbnail_image,c.icon_media_id,c.icon,c.sort_order display_order,
 c.status,c.is_enabled,c.is_featured,c.deleted_at,c.updated_at,coalesce(t.seo_title,'') seo_title,coalesce(t.seo_description,'') seo_description,
 case when m.id is not null then '/media/'||m.storage_key||'/master.webp' else null end image_url,
 case when tm.id is not null then '/media/'||tm.storage_key||'/master.webp' else null end thumbnail_url,
 case when im.id is not null then '/media/'||im.storage_key||'/master.webp' else null end icon_url,
 (select count(*)::int from products p where p.category_id=c.id and p.deleted_at is null ${admin ? sql`` : sql`and p.status in ('published','out_of_stock') and p.is_published=true and p.published_at <= now()`}) product_count
 from categories c join category_i18n t on t.category_id=c.id and t.locale='th'
 left join category_i18n e on e.category_id=c.id and e.locale='en'
 left join media m on m.id=c.hero_media_id and m.deleted_at is null
 left join media tm on tm.id=c.thumbnail_media_id and tm.deleted_at is null
 left join media im on im.id=c.icon_media_id and im.deleted_at is null
 where c.deleted_at is null ${admin ? sql`` : sql`and c.status='published' and c.is_published=true and c.is_enabled=true`}
 order by c.sort_order,c.created_at limit 300`;
}
export type ProductQuery = {
  q?: string;
  category?: string;
  status?: string;
  stock?: string;
  featured?: string;
  new?: string;
  sort?: string;
  page?: string;
  limit?: number;
  admin?: boolean;
  id?: string;
  slug?: string;
};
export async function listProducts(o: ProductQuery = {}) {
  // Only trusted server callers may opt into unpublished content. HTTP query
  // strings (including repeated parameters) cannot enable administrative reads.
  o = {
    ...Object.fromEntries(
      Object.entries(o).filter(
        ([key, value]) => key !== "admin" && key !== "limit" && typeof value === "string",
      ),
    ),
    admin: o.admin === true,
    limit: typeof o.limit === "number" && Number.isFinite(o.limit) ? o.limit : 12,
  };
  const page = Math.min(100000, Math.max(1, Number.parseInt(o.page ?? "1") || 1)),
    limit = Math.min(48, Math.max(1, o.limit ?? 12));
  const term = `%${(o.q ?? "").slice(0, 160).replace(/[\\%_]/g, "\\$&")}%`;
  const where = sql`where ${o.admin ? sql`true` : sql`p.status in ('published','out_of_stock') and p.is_published=true and p.published_at<=now() and c.status='published' and c.is_enabled=true and c.is_published=true and c.deleted_at is null`}
 ${o.admin && o.status === "all" ? sql`` : o.status === "archived" && o.admin ? sql`and p.deleted_at is not null` : sql`and p.deleted_at is null`}
 ${o.q ? sql`and (t.name ilike ${term} or e.name ilike ${term} or t.short_desc ilike ${term} or t.body::text ilike ${term} or e.body::text ilike ${term} or p.sku ilike ${term} or ct.name ilike ${term})` : sql``}
 ${o.category ? sql`and (c.id=${o.category} or ct.slug=${o.category})` : sql``}
 ${o.status === "live" && o.admin ? sql`and p.status in ('published','out_of_stock')` : o.status && !["archived", "all"].includes(o.status) && o.admin ? sql`and p.status=${o.status}` : sql``}
 ${o.stock ? sql`and p.stock_status=${o.stock}` : sql``}
 ${o.featured === "1" ? sql`and p.is_featured=true` : sql``}
 ${o.new === "1" ? sql`and p.is_new=true` : sql``}
 ${o.id ? sql`and p.id=${o.id}` : sql``}${o.slug ? sql`and t.slug=${o.slug}` : sql``}`;
  const joins = sql`from products p join product_i18n t on t.product_id=p.id and t.locale='th'
 left join product_i18n e on e.product_id=p.id and e.locale='en'
 join categories c on c.id=p.category_id join category_i18n ct on ct.category_id=c.id and ct.locale='th'`;
  const order =
    o.sort === "name"
      ? sql`t.name asc,p.id`
      : o.sort === "price_asc"
        ? sql`case when p.price_mode in ('exact','from') then coalesce(p.sale_price,p.price) end asc nulls last,p.id`
        : o.sort === "price_desc"
          ? sql`case when p.price_mode in ('exact','from') then coalesce(p.sale_price,p.price) end desc nulls last,p.id`
          : o.sort === "newest"
            ? sql`p.created_at desc,p.id`
            : o.sort === "updated"
              ? sql`p.updated_at desc,p.id`
              : sql`p.is_featured desc,p.sort_order,p.created_at desc,p.id`;
  const [rows, count] = await Promise.all([
    sql<
      (Product & { body: unknown; body_en: unknown })[]
    >`select p.id,p.sku,p.category_id,ct.name category_name,ct.slug category_slug,t.name name_th,coalesce(e.name,'') name_en,t.slug,
 coalesce(t.short_desc,'') short_description_th,coalesce(e.short_desc,'') short_description_en,t.body,e.body body_en,
 p.price,p.sale_price,p.price_mode,p.materials,p.dimensions,p.weight,p.quantity,p.stock_status,p.made_to_order,p.lead_time,p.status,p.sort_order display_order,p.is_featured,p.is_new,p.created_at,p.updated_at,p.deleted_at,
 coalesce(t.seo_title,'') seo_title,coalesce(t.seo_description,'') seo_description,
 (select '/media/'||m.storage_key||'/master.webp' from product_media pm join media m on m.id=pm.media_id and m.deleted_at is null where pm.product_id=p.id order by pm.is_primary desc,pm.sort_order limit 1) image_url
 ${joins} ${where} order by ${order} limit ${limit} offset ${(page - 1) * limit}`,
    sql<{ total: number }[]>`select count(*)::int total ${joins} ${where}`,
  ]);
  return {
    items: rows.map((r) => ({
      ...r,
      description_th: documentText(r.body),
      description_en: documentText(r.body_en),
    })),
    total: count[0]?.total ?? 0,
    page,
    limit,
  };
}
export async function gallery(
  id: string,
  kind: "product" | "news" = "product",
): Promise<MediaItem[]> {
  return kind === "product"
    ? sql<
        MediaItem[]
      >`select m.id,m.storage_key,m.filename,m.width,m.height,i.alt from product_media pm join media m on m.id=pm.media_id and m.deleted_at is null left join media_i18n i on i.media_id=m.id and i.locale='th' where pm.product_id=${id} order by pm.sort_order`
    : sql<
        MediaItem[]
      >`select m.id,m.storage_key,m.filename,m.width,m.height,i.alt from post_media pm join media m on m.id=pm.media_id and m.deleted_at is null left join media_i18n i on i.media_id=m.id and i.locale='th' where pm.post_id=${id} order by pm.sort_order`;
}
export async function listNews(
  o: {
    admin?: boolean;
    archived?: boolean;
    slug?: string;
    id?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const limit = Math.min(48, Math.max(1, Math.floor(o.limit ?? 9))),
    page = Math.min(100000, Math.max(1, Math.floor(Number(o.page) || 1)));
  const where = sql`where ${o.archived && o.admin ? sql`p.deleted_at is not null` : sql`p.deleted_at is null`} ${o.admin ? sql`` : sql`and p.is_published=true and p.published_at <= now()`} ${o.slug ? sql`and t.slug=${o.slug}` : sql``} ${o.id ? sql`and p.id=${o.id}` : sql``}`;
  const joins = sql`from posts p join post_i18n t on t.post_id=p.id and t.locale='th' left join media m on m.id=p.cover_media_id and m.deleted_at is null`;
  const [rows, count] = await Promise.all([
    sql<
      (News & { body: unknown })[]
    >`select p.id,p.type,t.title,t.slug,coalesce(t.excerpt,'') excerpt,t.body,p.cover_media_id cover_image,p.is_published,p.published_at,p.deleted_at,coalesce(t.seo_title,'') seo_title,coalesce(t.seo_description,'') seo_description,case when m.id is not null then '/media/'||m.storage_key||'/master.webp' else null end image_url ${joins} ${where} order by p.published_at desc nulls last,p.created_at desc limit ${limit} offset ${(page - 1) * limit}`,
    sql<{ total: number }[]>`select count(*)::int total ${joins} ${where}`,
  ]);
  return {
    items: rows.map((r) => ({ ...r, description: documentText(r.body) })),
    total: count[0]?.total ?? 0,
    page,
    limit,
  };
}
export async function listMedia(q = "", page = 1) {
  const term = `%${q.slice(0, 100).replace(/[\\%_]/g, "\\$&")}%`;
  return sql<
    MediaItem[]
  >`select m.id,m.storage_key,m.filename,m.width,m.height,i.alt from media m left join media_i18n i on i.media_id=m.id and i.locale='th' where m.deleted_at is null and (m.filename ilike ${term} or i.alt ilike ${term}) order by m.created_at desc limit 40 offset ${(Math.max(1, page) - 1) * 40}`;
}
