import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { listNews, gallery } from "@/lib/vocational/data";
import { ProductGallery } from "@/components/vocational/ProductGallery";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    n = (await listNews({ slug: slug })).items[0];
  return n
    ? {
        title: n.seo_title || n.title,
        description: n.seo_description || n.excerpt,
        alternates: { canonical: `/news/${n.slug}` },
        openGraph: {
          type: "article",
          title: n.title,
          description: n.excerpt,
          images: n.image_url ? [n.image_url] : undefined,
        },
      }
    : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    n = (await listNews({ slug: slug })).items[0];
  if (!n) notFound();
  const images = await gallery(n.id, "news");
  return (
    <main id="content" className="v-page v-article">
      <Link className="v-back" href="/news">
        ← ข่าวและกิจกรรม
      </Link>
      <p className="v-eyebrow">
        {n.type === "event" ? "กิจกรรมงานฝึกวิชาชีพ" : "ข่าวงานฝึกวิชาชีพ"}
        {n.published_at
          ? ` · ${new Date(n.published_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`
          : ""}
      </p>
      <h1>{n.title}</h1>
      <p className="v-article-excerpt">{n.excerpt}</p>
      {n.image_url && (
        <Image
          src={n.image_url}
          alt={n.title}
          width={1400}
          height={850}
          className="v-article-cover"
        />
      )}
      <div className="v-article-body">{n.description}</div>
      {images.length > 0 && <ProductGallery name={n.title} items={images} />}
    </main>
  );
}
