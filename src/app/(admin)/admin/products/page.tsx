import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listProducts, listCategories } from "@/lib/vocational/data";
import { PRODUCT_STATUSES, STOCK_STATUSES } from "@/lib/vocational/types";
import { ProductTable } from "@/components/admin/CatalogTables";
import { Pager } from "@/components/vocational/Pager";
export const metadata = { title: "จัดการสินค้า" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireAdmin(),
    q = await searchParams;
  const [data, categories] = await Promise.all([
    listProducts({ ...q, admin: true, limit: 20 }),
    listCategories(true),
  ]);
  return (
    <>
      <div className="cms-title">
        <div>
          <p className="cms-eyebrow">แคตตาล็อกผลิตภัณฑ์</p>
          <h1>
            จัดการสินค้า <span>{data.total}</span>
          </h1>
        </div>
        <Link className="cms-primary" href="/admin/products/new">
          + เพิ่มสินค้า
        </Link>
      </div>
      <form className="cms-filters">
        <label>
          ค้นหา
          <input name="q" defaultValue={q.q} placeholder="ชื่อสินค้า รหัส หรือคำอธิบาย" />
        </label>
        <label>
          หมวดหมู่
          <select name="category" defaultValue={q.category}>
            <option value="">ทั้งหมด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_th}
              </option>
            ))}
          </select>
        </label>
        <label>
          สถานะ
          <select name="status" defaultValue={q.status}>
            <option value="">รายการที่ใช้งาน</option>
            <option value="all">ทั้งหมด รวมที่เก็บถาวร</option>
            <option value="live">เผยแพร่ทั้งหมด</option>
            {Object.entries(PRODUCT_STATUSES).map(([v, t]) => (
              <option value={v} key={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          สต็อก
          <select name="stock" defaultValue={q.stock}>
            <option value="">ทั้งหมด</option>
            {Object.entries(STOCK_STATUSES).map(([v, t]) => (
              <option value={v} key={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          เรียงตาม
          <select name="sort" defaultValue={q.sort ?? "featured"}>
            <option value="featured">แนะนำ / ลำดับ</option>
            <option value="updated">แก้ไขล่าสุด</option>
            <option value="newest">สร้างล่าสุด</option>
            <option value="name">ชื่อสินค้า</option>
          </select>
        </label>
        <label className="cms-check">
          <input type="checkbox" name="featured" value="1" defaultChecked={q.featured === "1"} />
          เฉพาะแนะนำ
        </label>
        <button type="submit">ค้นหา</button>
        <Link href="/admin/products">ล้างตัวกรอง</Link>
      </form>
      <ProductTable
        items={JSON.parse(JSON.stringify(data.items))}
        categories={JSON.parse(JSON.stringify(categories))}
        owner={user.role === "owner"}
      />
      <Pager {...data} base="/admin/products" query={q} />
    </>
  );
}
