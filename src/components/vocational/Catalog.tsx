import { Link, getPathname } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { listCategories, listProducts } from "@/lib/vocational/data";
import { ProductCard } from "./ProductCard";
import { Pager } from "./Pager";
import { catalogHref, catalogQuery, type PublicSearchParams } from "./catalog-query";
export async function Catalog({
  query: input,
  category,
  base = "/products",
}: {
  query: PublicSearchParams;
  category?: string;
  base?: string;
}) {
  const query = catalogQuery(input);
  if (category) delete query.category;
  const locale = (await getLocale()) as Locale;
  const [categories, data] = await Promise.all([
    listCategories(),
    listProducts({
      q: query.q,
      stock: query.stock,
      featured: query.featured,
      new: query.new,
      sort: query.sort,
      page: query.page,
      category: category ?? query.category,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  if (data.page > pages) {
    redirect(
      getPathname({
        locale,
        href: catalogHref(base, { ...query, page: pages > 1 ? String(pages) : undefined }),
      }),
    );
  }
  const hasFilters = Boolean(query.q || query.stock || query.featured || query.new);
  const categoryQuery = { ...query, category: undefined, page: undefined };
  return (
    <section className="v-catalog">
      <nav className="v-category-tabs" aria-label="หมวดหมู่ผลิตภัณฑ์">
        <Link
          href={catalogHref("/products", categoryQuery)}
          aria-current={!category && !query.category ? "page" : undefined}
        >
          ทั้งหมด
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={catalogHref(`/products/category/${c.slug}`, categoryQuery)}
            aria-current={
              category === c.slug || query.category === c.id || query.category === c.slug
                ? "page"
                : undefined
            }
          >
            {c.name_th}
          </Link>
        ))}
      </nav>
      <form
        key={catalogHref(base, query)}
        className="v-catalog-filters"
        action={getPathname({ locale, href: base })}
        role="search"
      >
        {query.category && <input type="hidden" name="category" value={query.category} />}
        <label className="v-search">
          <span>ค้นหาผลงาน</span>
          <input
            type="search"
            name="q"
            maxLength={160}
            defaultValue={query.q}
            placeholder="ชื่อสินค้า รายละเอียด หรือรหัสสินค้า"
          />
        </label>
        <label>
          <span>ความพร้อม</span>
          <select name="stock" defaultValue={query.stock}>
            <option value="">ทั้งหมด</option>
            <option value="available">พร้อมจำหน่าย</option>
            <option value="made_to_order">ผลิตตามสั่ง</option>
            <option value="out_of_stock">สินค้าหมด</option>
          </select>
        </label>
        <label>
          <span>เรียงตาม</span>
          <select name="sort" defaultValue={query.sort}>
            <option value="featured">สินค้าแนะนำ</option>
            <option value="newest">ใหม่ล่าสุด</option>
            <option value="name">ชื่อสินค้า</option>
            <option value="price_asc">ราคาน้อยไปมาก</option>
            <option value="price_desc">ราคามากไปน้อย</option>
          </select>
        </label>
        <button type="submit" className="v-button v-button-dark">
          ค้นหา
        </button>
        <div className="v-filter-checks">
          <label>
            <input
              type="checkbox"
              name="featured"
              value="1"
              defaultChecked={query.featured === "1"}
            />
            สินค้าแนะนำ
          </label>
          <label>
            <input type="checkbox" name="new" value="1" defaultChecked={query.new === "1"} />
            สินค้าใหม่
          </label>
          {Object.values(query).some(Boolean) && <Link href={base}>ล้างตัวกรอง</Link>}
        </div>
      </form>
      <div className="v-results-count" role="status">
        {data.total} ผลงาน{query.q && ` สำหรับ “${query.q}”`}
      </div>
      {data.items.length ? (
        <div className="v-product-grid">
          {data.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="v-catalog-empty">
          <span>CRAFTED WITH PURPOSE</span>
          <h2>{hasFilters ? "ยังไม่พบผลงานที่ตรงกับตัวกรอง" : "ยังไม่มีผลงานที่เผยแพร่"}</h2>
          <p>
            {hasFilters
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง เพื่อสำรวจผลงานอื่น"
              : "ติดตามผลงานและข่าวสารจากฝ่ายฝึกวิชาชีพผู้ต้องขังได้ที่นี่"}
          </p>
          <Link href={hasFilters ? base : "/vocational"} className="v-text-link">
            {hasFilters ? "ล้างตัวกรองและดูผลงานทั้งหมด ↗" : "รู้จักงานฝึกวิชาชีพ ↗"}
          </Link>
        </div>
      )}
      <Pager {...data} base={base} query={query} />
    </section>
  );
}
