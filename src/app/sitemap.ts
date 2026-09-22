import type { MetadataRoute } from "next";
import { sql } from "@/db/client";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const rows = await sql<{ path: string; updated_at: Date }[]>`
 select '/products/'||t.slug path,p.updated_at from products p join product_i18n t on t.product_id=p.id and t.locale='th' join categories c on c.id=p.category_id where p.deleted_at is null and p.status in ('published','out_of_stock') and p.is_published=true and p.published_at<=now() and c.deleted_at is null and c.is_enabled=true and c.status='published'
 union all select '/products/category/'||t.slug,c.updated_at from categories c join category_i18n t on t.category_id=c.id and t.locale='th' where c.status='published' and c.is_published=true and c.is_enabled=true and c.deleted_at is null
 union all select '/news/'||t.slug,p.updated_at from posts p join post_i18n t on t.post_id=p.id and t.locale='th' where p.is_published=true and p.published_at<=now() and p.deleted_at is null`;
  return [
    ...["/", "/products", "/vocational", "/story", "/news", "/contact"].map((path) => ({
      url: base + path,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...rows.map((r) => ({
      url: base + r.path.split("/").map(encodeURIComponent).join("/"),
      lastModified: r.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
