import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { listCategories } from "@/lib/vocational/data";
import { Catalog } from "@/components/vocational/Catalog";
import type { PublicSearchParams } from "@/components/vocational/catalog-query";
import { publicMetadata } from "@/lib/seo/metadata";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params,
    c = (await listCategories()).find((c) => c.slug === decodeURIComponent(slug));
  if (!c) return {};
  return publicMetadata({
    locale,
    paths: `/products/category/${c.slug}`,
    title: c.seo_title || c.name_th,
    description: c.seo_description || c.short_description_th || c.description_th,
    image: c.image_url || undefined,
  });
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PublicSearchParams>;
}) {
  const { slug } = await params,
    c = (await listCategories()).find((c) => c.slug === decodeURIComponent(slug));
  if (!c) notFound();
  return (
    <main id="content" className="v-page">
      <header className={`v-category-hero v-bento-${c.icon}`}>
        <div>
          <Link href="/products" className="v-back">
            ← ผลิตภัณฑ์ทั้งหมด
          </Link>
          <p className="v-eyebrow">THE ART OF CRAFT</p>
          <h1>{c.name_th}</h1>
          {c.name_en && <p lang="en">{c.name_en}</p>}
          <p>{c.description_th || c.short_description_th}</p>
        </div>
        {c.image_url && (
          <div className="v-category-cover">
            <Image src={c.image_url} fill sizes="(max-width: 760px) 100vw, 45vw" alt={c.name_th} />
          </div>
        )}
      </header>
      <Catalog query={await searchParams} category={c.slug} base={`/products/category/${c.slug}`} />
      <aside className="v-category-story">
        <p className="v-eyebrow">BEHIND EVERY PIECE</p>
        <h2>เรียนรู้ผ่านการลงมือทำ</h2>
        <p>
          การฝึกความละเอียด ความรับผิดชอบ และการทำงานอย่างเป็นขั้นตอน
          คือส่วนหนึ่งของทักษะที่ถ่ายทอดลงในทุกผลงาน
        </p>
        <Link className="v-text-link" href="/vocational">
          รู้จักกระบวนการฝึกวิชาชีพ ↗
        </Link>
      </aside>
    </main>
  );
}
