import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { listProducts, gallery } from "@/lib/vocational/data";
import { ProductGallery } from "@/components/vocational/ProductGallery";
import { ProductCard } from "@/components/vocational/ProductCard";
import { priceLabel, STOCK_STATUSES } from "@/lib/vocational/types";
import { goLinePath } from "@/lib/line";
import { publicMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { assertEnv } from "@/lib/env";
import { decodeSlugParam } from "@/lib/slug";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params,
    p = (await listProducts({ slug: decodeSlugParam(slug), limit: 1 })).items[0];
  if (!p) return {};
  return publicMetadata({
    locale,
    paths: `/products/${p.slug}`,
    title: p.seo_title || p.name_th,
    description: p.seo_description || p.short_description_th || p.description_th,
    image: p.image_url || undefined,
  });
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params,
    p = (await listProducts({ slug: decodeSlugParam(slug), limit: 1 })).items[0];
  if (!p) notFound();
  const [images, related] = await Promise.all([
    gallery(p.id),
    listProducts({ category: p.category_id, limit: 4 }),
  ]);
  const base = assertEnv().NEXT_PUBLIC_SITE_URL;
  const structured = productJsonLd({
    base,
    locale,
    name: p.name_th,
    description: p.short_description_th || p.description_th,
    sku: p.sku || undefined,
    categoryName: p.category_name,
    images: images.map((i) => `/media/${i.storage_key}/master.webp`),
    path: `/products/${p.slug}`,
    price: p.sale_price ?? p.price ?? undefined,
    priceDisplay: p.price_mode === "exact" || p.price_mode === "from" ? p.price_mode : "contact",
  });
  return (
    <main id="content" className="v-page">
      <nav className="v-breadcrumb" aria-label="เส้นทาง">
        <Link href="/">หน้าแรก</Link>
        <span aria-hidden="true">/</span>
        <Link href="/products">ผลิตภัณฑ์</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/products/category/${p.category_slug}`}>{p.category_name}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{p.name_th}</span>
      </nav>
      <div className="v-product-detail">
        <ProductGallery items={images} name={p.name_th} />
        <div className="v-product-detail-info">
          <p className="v-eyebrow">{p.category_name}</p>
          <h1>{p.name_th}</h1>
          {p.name_en && <p lang="en">{p.name_en}</p>}
          <p className="v-detail-summary">{p.short_description_th}</p>
          <div className="v-detail-price">
            {priceLabel(p)}
            {(p.price_mode === "exact" || p.price_mode === "from") &&
              p.sale_price !== null &&
              p.price !== null && <del>{Number(p.price).toLocaleString("th-TH")} บาท</del>}
          </div>
          <span className="v-stock">{STOCK_STATUSES[p.stock_status]}</span>
          <dl className="v-product-specs">
            {[
              ["รหัสสินค้า", p.sku],
              ["วัสดุ", p.materials],
              ["ขนาด", p.dimensions],
              ["น้ำหนัก", p.weight ? `${p.weight} กิโลกรัม` : null],
              ["ระยะเวลาผลิต", p.lead_time],
              ["การผลิต", p.made_to_order ? "ผลิตตามคำสั่งซื้อ" : null],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          <a
            className="v-button v-button-dark"
            href={goLinePath(p.slug)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {p.price_mode === "showcase" ? "สอบถามเกี่ยวกับผลงาน" : "สอบถามสินค้า / ติดต่อสั่งซื้อ"}{" "}
            <span>↗</span>
          </a>
          <p className="v-inquiry-note">สอบถามรายละเอียดกับเจ้าหน้าที่ผ่าน LINE</p>
          <Link
            href={`/contact?product=${encodeURIComponent(p.slug)}#contact-form`}
            className="v-text-link"
          >
            สอบถามผ่านแบบฟอร์มติดต่อ ↗
          </Link>
          <div className="v-detail-copy">
            <h2>รายละเอียดผลงาน</h2>
            <p>{p.description_th || p.short_description_th}</p>
          </div>
        </div>
      </div>
      <section className="v-product-story">
        <p className="v-eyebrow">THE SKILL BEHIND THE PRODUCT</p>
        <h2>
          มากกว่าชิ้นงาน
          <br />
          <span>คือทักษะที่ได้ลงมือฝึกฝน</span>
        </h2>
        <p>
          ผลงานจากการฝึกวิชาชีพ สะท้อนการเรียนรู้เรื่องวัสดุ การใช้เครื่องมือ ความละเอียด
          และความรับผิดชอบในกระบวนการทำงาน
        </p>
        <Link href="/vocational" className="v-text-link">
          รู้จักงานฝึกวิชาชีพ ↗
        </Link>
      </section>
      {related.items.some((r) => r.id !== p.id) && (
        <section className="v-section">
          <div className="v-section-heading">
            <h2>ผลงานที่เกี่ยวข้อง</h2>
          </div>
          <div className="v-product-grid">
            {related.items
              .filter((r) => r.id !== p.id)
              .slice(0, 3)
              .map((r) => (
                <ProductCard key={r.id} product={r} />
              ))}
          </div>
        </section>
      )}
      <JsonLd
        data={[
          structured,
          breadcrumbJsonLd(base, locale, [
            { name: "หน้าแรก", path: "/" },
            { name: "ผลิตภัณฑ์", path: "/products" },
            { name: p.category_name, path: `/products/category/${p.category_slug}` },
            { name: p.name_th, path: `/products/${p.slug}` },
          ]),
        ]}
      />
    </main>
  );
}
