import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import { listNews, gallery } from "@/lib/vocational/data";
import { ProductGallery } from "@/components/vocational/ProductGallery";
import { publicMetadata } from "@/lib/seo/metadata";
import { JsonLd, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { assertEnv } from "@/lib/env";
import { getCachedSetting } from "@/lib/settings/cached";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params,
    n = (await listNews({ slug: slug })).items[0];
  return n
    ? publicMetadata({
        locale,
        paths: `/news/${n.slug}`,
        title: n.seo_title || n.title,
        description: n.seo_description || n.excerpt,
        type: "article",
        image: n.image_url || undefined,
        publishedTime: n.published_at ? new Date(n.published_at) : undefined,
      })
    : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params,
    n = (await listNews({ slug: slug })).items[0];
  if (!n) notFound();
  const [images, general] = await Promise.all([
    gallery(n.id, "news"),
    getCachedSetting("general", locale),
  ]);
  const base = assertEnv().NEXT_PUBLIC_SITE_URL;
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
      <JsonLd
        data={[
          articleJsonLd({
            base,
            locale,
            headline: n.title,
            description: n.excerpt,
            path: `/news/${n.slug}`,
            image: n.image_url || undefined,
            publishedAt: n.published_at ? new Date(n.published_at) : undefined,
            siteName: general.siteName,
          }),
          breadcrumbJsonLd(base, locale, [
            { name: "หน้าแรก", path: "/" },
            { name: "ข่าวและกิจกรรม", path: "/news" },
            { name: n.title, path: `/news/${n.slug}` },
          ]),
        ]}
      />
    </main>
  );
}
