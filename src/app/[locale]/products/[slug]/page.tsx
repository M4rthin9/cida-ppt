import { notFound } from "next/navigation";
import Link from "next/link";
import { listProducts, gallery } from "@/lib/vocational/data";
import { ProductGallery } from "@/components/vocational/ProductGallery";
import { ProductCard } from "@/components/vocational/ProductCard";
import { priceLabel, STOCK_STATUSES } from "@/lib/vocational/types";
import { goLinePath } from "@/lib/line";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    p = (await listProducts({ slug: slug, limit: 1 })).items[0];
  if (!p) return {};
  return {
    title: p.seo_title || p.name_th,
    description: p.seo_description || p.short_description_th,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: p.name_th,
      description: p.short_description_th,
      url: `/products/${p.slug}`,
      images: p.image_url ? [p.image_url] : undefined,
    },
  };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    p = (await listProducts({ slug: slug, limit: 1 })).items[0];
  if (!p) notFound();
  const [images, related] = await Promise.all([
    gallery(p.id),
    listProducts({ category: p.category_id, limit: 4 }),
  ]);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const structured = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name_th,
    description: p.short_description_th || p.description_th,
    sku: p.sku || undefined,
    category: p.category_name,
    image: images.map((i) => `${base}/media/${i.storage_key}/master.webp`),
    url: `${base}/products/${p.slug}`,
    ...(p.price_mode === "exact" && p.price !== null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "THB",
            price: p.sale_price ?? p.price,
            availability:
              p.stock_status === "out_of_stock"
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: `${base}/products/${p.slug}`,
          },
        }
      : {}),
  };
  return (
    <main id="content" className="v-page">
      <nav className="v-breadcrumb" aria-label="เส้นทาง">
        <Link href="/products">ผลิตภัณฑ์</Link>
        <span>/</span>
        <Link href={`/products/category/${p.category_slug}`}>{p.category_name}</Link>
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
            {p.sale_price && p.price && <del>{Number(p.price).toLocaleString("th-TH")} บาท</del>}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\u003c") }}
      />
    </main>
  );
}
