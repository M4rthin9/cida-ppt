import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { sql } from "@/db/client";
import { listCategories, listProducts } from "@/lib/vocational/data";
import { PRODUCT_STATUSES } from "@/lib/vocational/types";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcon";
export default async function Page() {
  const user = await requireAdmin();
  const [[counts], categories, recent] = await Promise.all([
    sql`select count(*)::int total,count(*) filter(where status in ('published','out_of_stock') and deleted_at is null)::int published,count(*) filter(where status='draft' and deleted_at is null)::int drafts,count(*) filter(where deleted_at is not null)::int archived,count(*) filter(where is_featured and deleted_at is null)::int featured,count(*) filter(where stock_status='out_of_stock' and deleted_at is null)::int empty from products`,
    listCategories(true),
    listProducts({ admin: true, sort: "updated", limit: 6 }),
  ]);
  const cards: { label: string; value: number; href: string; icon: AdminIconName }[] = [
    {
      label: "สินค้าทั้งหมด",
      value: Number(counts?.total ?? 0),
      href: "?status=all",
      icon: "product",
    },
    {
      label: "เผยแพร่แล้ว",
      value: Number(counts?.published ?? 0),
      href: "?status=live",
      icon: "check",
    },
    { label: "ฉบับร่าง", value: Number(counts?.drafts ?? 0), href: "?status=draft", icon: "draft" },
    {
      label: "เก็บถาวร",
      value: Number(counts?.archived ?? 0),
      href: "?status=archived",
      icon: "archive",
    },
    {
      label: "สินค้าแนะนำ",
      value: Number(counts?.featured ?? 0),
      href: "?featured=1",
      icon: "star",
    },
    {
      label: "สินค้าหมด",
      value: Number(counts?.empty ?? 0),
      href: "?stock=out_of_stock",
      icon: "stock",
    },
  ];
  const categoryTotal = categories.reduce(
    (total, category) => total + Number(category.product_count),
    0,
  );
  return (
    <>
      <div className="cms-title">
        <div>
          <p className="cms-eyebrow">ระบบจัดการเว็บไซต์</p>
          <h1>ภาพรวมเว็บไซต์</h1>
          <p>ทุกผลงาน ทุกเรื่องราว จัดการได้ในพื้นที่เดียว</p>
        </div>
      </div>
      <section className="cms-welcome" aria-labelledby="dashboard-welcome">
        <div>
          <p className="cms-eyebrow">พื้นที่สำหรับผู้ดูแลเว็บไซต์</p>
          <h2 id="dashboard-welcome">สวัสดี {user.name}</h2>
          <p>
            จัดการผลงานและเรื่องราวงานฝึกวิชาชีพ เริ่มต้นจากการเพิ่มสินค้าใหม่
            หรือดูแลเนื้อหาที่มีอยู่
          </p>
        </div>
        <Link href="/admin/products/new" className="cms-primary">
          <AdminIcon name="plus" />
          เพิ่มสินค้าใหม่
        </Link>
      </section>
      <div className="cms-stats">
        {cards.map(({ label, value, href, icon }) => (
          <Link key={label} href={`/admin/products${href}`}>
            <div className="cms-stat-top">
              <span>{label}</span>
              <i className="cms-stat-icon">
                <AdminIcon name={icon} />
              </i>
            </div>
            <strong>{value.toLocaleString("th-TH")}</strong>
            <div className="cms-stat-foot">
              ดูรายการสินค้า
              <AdminIcon name="arrow" />
            </div>
          </Link>
        ))}
      </div>
      <div className="cms-dashboard-grid">
        <section className="cms-panel">
          <div className="cms-panel-header">
            <h2>สินค้าตามหมวดหมู่</h2>
            <Link href="/admin/categories">
              จัดการหมวดหมู่
              <AdminIcon name="external" />
            </Link>
          </div>
          <p className="cms-panel-description">จำนวนผลงานในแต่ละหมวดหมู่</p>
          {categories.map((c) => (
            <Link
              className="cms-category-summary"
              key={c.id}
              href={`/admin/products?category=${c.id}`}
            >
              <div>
                <span>
                  <AdminIcon name="category" />
                </span>
                <span>{c.name_th}</span>
                <strong>
                  {c.product_count}
                  <small>ชิ้น</small>
                </strong>
              </div>
              <span className="cms-category-bar" aria-hidden="true">
                <span
                  style={{
                    width: `${categoryTotal ? (Number(c.product_count) / categoryTotal) * 100 : 0}%`,
                  }}
                />
              </span>
            </Link>
          ))}
        </section>
        <section className="cms-panel">
          <div className="cms-panel-header">
            <h2>แก้ไขล่าสุด</h2>
            <Link href="/admin/products?sort=updated">
              ดูทั้งหมด
              <AdminIcon name="external" />
            </Link>
          </div>
          <p className="cms-panel-description">กลับมาดูแลผลงานที่คุณอัปเดตล่าสุด</p>
          {recent.items.length ? (
            recent.items.map((p) => (
              <Link className="cms-summary-row" key={p.id} href={`/admin/products/${p.id}`}>
                <span>
                  {p.name_th}
                  <small>{p.category_name}</small>
                </span>
                <span className={`cms-status ${p.status}`}>{PRODUCT_STATUSES[p.status]}</span>
              </Link>
            ))
          ) : (
            <div className="cms-recent-empty">
              <span className="cms-empty-symbol">
                <AdminIcon name="product" />
              </span>
              <h3>พร้อมสำหรับผลงานชิ้นแรก</h3>
              <p>
                เพิ่มสินค้า พร้อมรูปภาพจริงและรายละเอียดชิ้นงาน เพื่อเริ่มต้นจัดแสดงผลงานบนเว็บไซต์
              </p>
              <Link className="cms-primary" href="/admin/products/new">
                <AdminIcon name="plus" />
                เพิ่มสินค้า
              </Link>
            </div>
          )}
        </section>
      </div>
      <section className="cms-quick-actions" aria-labelledby="dashboard-quick-actions">
        <h2 id="dashboard-quick-actions">เริ่มต้นงานของคุณ</h2>
        <div className="cms-quick-grid">
          <Link href="/admin/news/new">
            <AdminIcon name="news" />
            <div>
              <strong>เขียนข่าวและกิจกรรม</strong>
              <small>บอกเล่าเรื่องราวงานฝึกวิชาชีพ</small>
            </div>
            <AdminIcon name="arrow" />
          </Link>
          <Link href="/admin/media">
            <AdminIcon name="media" />
            <div>
              <strong>จัดการคลังภาพ</strong>
              <small>อัปโหลดและเลือกภาพสำหรับเว็บไซต์</small>
            </div>
            <AdminIcon name="arrow" />
          </Link>
          <Link href="/admin/messages">
            <AdminIcon name="messages" />
            <div>
              <strong>เปิดกล่องข้อความ</strong>
              <small>ดูข้อความสอบถามจากผู้เข้าชม</small>
            </div>
            <AdminIcon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
