import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { listProducts, listCategories, gallery } from "@/lib/vocational/data";
import { ContentEditor } from "@/components/admin/ContentEditor";
export const metadata = { title: "แก้ไขสินค้า" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let row = (await listProducts({ admin: true, id })).items[0];
  if (!row) row = (await listProducts({ admin: true, id, status: "archived" })).items[0];
  if (!row) notFound();
  const [categories, media] = await Promise.all([listCategories(true), gallery(id)]);
  return (
    <>
      <Link className="cms-back" href="/admin/products">
        ← กลับรายการสินค้า
      </Link>
      <h1>แก้ไขสินค้า</h1>
      <ContentEditor
        kind="product"
        id={id}
        defaults={JSON.parse(JSON.stringify({ ...row, media_ids: media.map((m) => m.id) }))}
        categories={categories.map((c) => ({ id: c.id, name_th: c.name_th }))}
        media={media}
      />
    </>
  );
}
