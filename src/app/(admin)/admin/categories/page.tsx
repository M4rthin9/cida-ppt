import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listCategories } from "@/lib/vocational/data";
import { CategoryTable } from "@/components/admin/CatalogTables";
export const metadata = { title: "จัดการหมวดหมู่" };
export default async function Page() {
  await requireAdmin();
  const items = await listCategories(true);
  return (
    <>
      <div className="cms-title">
        <div>
          <p className="cms-eyebrow">โครงสร้างแคตตาล็อก</p>
          <h1>หมวดหมู่ผลิตภัณฑ์</h1>
        </div>
        <Link href="/admin/categories/new" className="cms-primary">
          + เพิ่มหมวดหมู่
        </Link>
      </div>
      <p className="cms-help">เปลี่ยนลำดับ เปิดเผยแพร่ หรือซ่อนหมวดหมู่ได้จากหน้านี้</p>
      <CategoryTable items={JSON.parse(JSON.stringify(items))} />
    </>
  );
}
