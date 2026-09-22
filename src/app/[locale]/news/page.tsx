import { listNews } from "@/lib/vocational/data";
import { NewsCard } from "@/components/vocational/NewsCard";
import { Pager } from "@/components/vocational/Pager";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "ข่าวและกิจกรรมงานฝึกวิชาชีพ",
  description: "การฝึกอบรม ทักษะอาชีพ นิทรรศการ และการพัฒนาผลิตภัณฑ์",
  alternates: { canonical: "/news" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams,
    data = await listNews({ page: Math.min(100000, Number.parseInt(q.page ?? "1") || 1) });
  return (
    <main className="v-page" id="content">
      <header className="v-page-title">
        <p className="v-eyebrow">NEWS & ACTIVITIES</p>
        <h1>
          เรื่องราวการเรียนรู้
          <br />
          <span>และก้าวใหม่ของงานฝีมือ</span>
        </h1>
        <p>ข่าวสารการฝึกวิชาชีพ การพัฒนาผลิตภัณฑ์ และกิจกรรมสร้างทักษะ</p>
      </header>
      {data.items.length ? (
        <div className="v-news-grid">
          {data.items.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      ) : (
        <div className="v-catalog-empty">
          <h2>ยังไม่มีข่าวที่เผยแพร่</h2>
          <p>ติดตามข่าวและกิจกรรมงานฝึกวิชาชีพได้ที่หน้านี้</p>
        </div>
      )}
      <Pager {...data} base="/news" query={q} />
    </main>
  );
}
