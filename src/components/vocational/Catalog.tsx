import Link from "next/link";
import { listCategories, listProducts } from "@/lib/vocational/data";
import { ProductCard } from "./ProductCard";
import { Pager } from "./Pager";
export async function Catalog({
  query,
  category,
  base = "/products",
}: {
  query: Record<string, string | undefined>;
  category?: string;
  base?: string;
}) {
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
  return (
    <section className="v-catalog">
      <div className="v-category-tabs">
        <Link href="/products" aria-current={!category && !query.category ? "page" : undefined}>
          ทั้งหมด
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products/category/${c.slug}`}
            aria-current={category === c.slug || query.category === c.id ? "page" : undefined}
          >
            {c.name_th}
          </Link>
        ))}
      </div>
      <form className="v-catalog-filters" action={base}>
        <label className="v-search">
          <span>ค้นหาผลงาน</span>
          <input name="q" defaultValue={query.q} placeholder="ชื่อสินค้า วัสดุ หรือรหัสสินค้า" />
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
      <div className="v-results-count">{data.total} ผลงาน</div>
      {data.items.length ? (
        <div className="v-product-grid">
          {data.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="v-catalog-empty">
          <span>CRAFTED WITH PURPOSE</span>
          <h2>{query.q ? "ยังไม่พบผลงานที่ค้นหา" : "ยังไม่มีผลงานที่เผยแพร่"}</h2>
          <p>
            {query.q
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง เพื่อสำรวจผลงานอื่น"
              : "ติดตามผลงานและข่าวสารจากฝ่ายฝึกวิชาชีพผู้ต้องขังได้ที่นี่"}
          </p>
          <Link href="/vocational" className="v-text-link">
            รู้จักงานฝึกวิชาชีพ ↗
          </Link>
        </div>
      )}
      <Pager {...data} base={base} query={query} />
    </section>
  );
}
