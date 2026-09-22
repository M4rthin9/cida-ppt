import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listNews } from "@/lib/vocational/data";
import { NewsTable } from "@/components/admin/CatalogTables";
import { Pager } from "@/components/vocational/Pager";
export const metadata = { title: "ข่าวและกิจกรรมงานฝึกวิชาชีพ" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const q = await searchParams,
    data = await listNews({
      admin: true,
      archived: q.archived === "1",
      page: Number(q.page) || 1,
      limit: 20,
    });
  return (
    <>
      <div className="cms-title">
        <div>
          <p className="cms-eyebrow">งานฝึกวิชาชีพและพัฒนาทักษะ</p>
          <h1>ข่าวและกิจกรรม</h1>
        </div>
        <Link href="/admin/news/new" className="cms-primary">
          + เพิ่มข่าว
        </Link>
      </div>
      <div className="cms-actions">
        <Link href="/admin/news">รายการที่ใช้งาน</Link>
        <Link href="/admin/news?archived=1">รายการที่เก็บถาวร</Link>
      </div>
      <NewsTable items={JSON.parse(JSON.stringify(data.items))} />
      <Pager {...data} base="/admin/news" query={q} />
    </>
  );
}
