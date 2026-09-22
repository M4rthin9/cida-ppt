import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listCategories } from "@/lib/vocational/data";
import { ContentEditor } from "@/components/admin/ContentEditor";
export const metadata = { title: "เพิ่มหมวดหมู่" };
export default async function Page() {
  await requireAdmin();
  const categories = await listCategories(true);
  return (
    <>
      <Link className="cms-back" href="/admin/categories">
        ← กลับรายการ
      </Link>
      <h1>เพิ่มหมวดหมู่</h1>
      <ContentEditor
        kind="category"
        categories={categories.map((c) => ({ id: c.id, name_th: c.name_th }))}
      />
    </>
  );
}
