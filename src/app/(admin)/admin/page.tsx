import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { sql } from "@/db/client";
import { listCategories, listProducts } from "@/lib/vocational/data";
import { PRODUCT_STATUSES } from "@/lib/vocational/types";
export default async function Page() {
  const user = await requireAdmin();
  const [[counts], categories, recent] = await Promise.all([
    sql`select count(*)::int total,count(*) filter(where status in ('published','out_of_stock') and deleted_at is null)::int published,count(*) filter(where status='draft' and deleted_at is null)::int drafts,count(*) filter(where deleted_at is not null)::int archived,count(*) filter(where is_featured and deleted_at is null)::int featured,count(*) filter(where stock_status='out_of_stock' and deleted_at is null)::int empty from products`,
    listCategories(true),
    listProducts({ admin: true, sort: "updated", limit: 6 }),
  ]);
  const cards = [
    ["สินค้าทั้งหมด", counts?.total, "?status=all"],
    ["เผยแพร่แล้ว", counts?.published, "?status=live"],
    ["ฉบับร่าง", counts?.drafts, "?status=draft"],
    ["เก็บถาวร", counts?.archived, "?status=archived"],
    ["สินค้าแนะนำ", counts?.featured, "?featured=1"],
    ["สินค้าหมด", counts?.empty, "?stock=out_of_stock"],
  ];
  return (
    <>
      <p className="cms-eyebrow">ฝ่ายฝึกวิชาชีพผู้ต้องขัง</p>
      <div className="cms-title">
        <div>
          <h1>ภาพรวมเว็บไซต์</h1>
          <p>สวัสดี {user.name} จัดการผลงานและเรื่องราวงานฝึกวิชาชีพได้ที่นี่</p>
        </div>
        <Link href="/admin/products/new" className="cms-primary">
          + เพิ่มสินค้า
        </Link>
      </div>
      <div className="cms-stats">
        {cards.map(([label, value, href]) => (
          <Link key={String(label)} href={`/admin/products${href}`}>
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
          </Link>
        ))}
      </div>
      <div className="cms-dashboard-grid">
        <section className="cms-panel">
          <h2>สินค้าตามหมวดหมู่</h2>
          {categories.map((c) => (
            <Link className="cms-summary-row" key={c.id} href={`/admin/products?category=${c.id}`}>
              <span>{c.name_th}</span>
              <strong>{c.product_count}</strong>
            </Link>
          ))}
        </section>
        <section className="cms-panel">
          <h2>แก้ไขล่าสุด</h2>
          {recent.items.length ? (
            recent.items.map((p) => (
              <Link className="cms-summary-row" key={p.id} href={`/admin/products/${p.id}`}>
                <span>
                  {p.name_th}
                  <small>{p.category_name}</small>
                </span>
                <span className="cms-status">{PRODUCT_STATUSES[p.status]}</span>
              </Link>
            ))
          ) : (
            <div className="cms-empty">เริ่มต้นเพิ่มสินค้า พร้อมรูปภาพจริงและรายละเอียดชิ้นงาน</div>
          )}
        </section>
      </div>
    </>
  );
}
