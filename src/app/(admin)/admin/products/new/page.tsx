import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listCategories } from "@/lib/vocational/data";
import { ContentEditor } from "@/components/admin/ContentEditor";
export const metadata = { title: "เพิ่มสินค้า" };
export default async function Page() {
  await requireAdmin();
  const categories = await listCategories(true);
  return (
    <>
      <Link className="cms-back" href="/admin/products">
        ← กลับรายการ
      </Link>
      <h1>เพิ่มสินค้า</h1>
      <ContentEditor
        kind="product"
        categories={categories.map((c) => ({ id: c.id, name_th: c.name_th }))}
      />
    </>
  );
}
