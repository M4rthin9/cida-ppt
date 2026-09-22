import { listNews } from "@/lib/vocational/data";
import { NewsCard } from "@/components/vocational/NewsCard";
import { Pager } from "@/components/vocational/Pager";
import { catalogQuery, type PublicSearchParams } from "@/components/vocational/catalog-query";
import { publicMetadata } from "@/lib/seo/metadata";
import { Link, redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return publicMetadata({
    locale,
    paths: "/news",
    title: "ข่าวและกิจกรรมงานฝึกวิชาชีพ",
    description: "การฝึกอบรม ทักษะอาชีพ นิทรรศการ และการพัฒนาผลิตภัณฑ์",
  });
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>;
}) {
  const { page } = catalogQuery(await searchParams),
    data = await listNews({ page: Number(page ?? 1) });
  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  if (data.page > pages)
    redirect({ href: pages > 1 ? `/news?page=${pages}` : "/news", locale: await getLocale() });
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
          <Link href="/vocational" className="v-text-link">
            รู้จักงานฝึกวิชาชีพ ↗
          </Link>
        </div>
      )}
      <Pager {...data} base="/news" />
    </main>
  );
}
