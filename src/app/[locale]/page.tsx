import { Link } from "@/i18n/navigation";
import { listCategories, listProducts, listNews } from "@/lib/vocational/data";
import { CraftJourney } from "@/components/vocational/CraftJourney";
import { CategoryBento } from "@/components/vocational/CategoryBento";
import { StorySection } from "@/components/vocational/StorySection";
import { ProductCard } from "@/components/vocational/ProductCard";
import { FeaturedCarousel } from "@/components/vocational/FeaturedCarousel";
import { NewsCard } from "@/components/vocational/NewsCard";
import { readSequence } from "@/lib/vocational/sequence-assets";
import { publicMetadata } from "@/lib/seo/metadata";
import { getCachedSetting } from "@/lib/settings/cached";
import { Lines } from "@/components/vocational/Lines";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return publicMetadata({
    locale,
    paths: "/",
    title: "ฝึกอาชีพ สร้างโอกาสใหม่ | ฝ่ายฝึกวิชาชีพผู้ต้องขัง",
    description:
      "ฝึกอาชีพ สร้างทักษะ สร้างคุณค่า สร้างโอกาสใหม่ ผ่านผลงานฝีมือจากฝ่ายฝึกวิชาชีพผู้ต้องขัง ทัณฑสถานบำบัดพิเศษกลาง",
  });
}
export default async function Home() {
  /**
   * Both sequences are resolved on the server, before any HTML is sent: a set
   * that is missing or half-imported simply renders the static composition,
   * rather than reserving several viewports of scroll for a canvas that then
   * never paints.
   */
  const [categories, featured, news, heroSequence, revealSequence, copy] = await Promise.all([
    listCategories(),
    listProducts({ featured: "1", limit: 12 }),
    listNews({ limit: 3 }),
    readSequence("hero"),
    readSequence("reveal"),
    getCachedSetting("home"),
  ]);
  const catalogue = featured.items.length < 12 ? await listProducts({ limit: 12 }) : featured;
  const selectedProducts = {
    items: [
      ...featured.items,
      ...catalogue.items.filter((p) => !featured.items.some((f) => f.id === p.id)),
    ].slice(0, 12),
  };
  return (
    <main id="content">
      <CraftJourney
        hero={heroSequence}
        reveal={revealSequence}
        categories={categories}
        copy={copy}
      />
      {selectedProducts.items.length > 0 && (
        <FeaturedCarousel
          title={copy.featuredTitle}
          eyebrow={copy.featuredEyebrow}
          cta={copy.featuredCta}
          href="/products"
          labels={selectedProducts.items.map((product) => product.name_th)}
        >
          {selectedProducts.items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              imageSizes="(max-width: 760px) 74vw, 360px"
            />
          ))}
        </FeaturedCarousel>
      )}
      <nav className="v-collection-index" aria-label="สำรวจหมวดงานฝีมือ">
        <span className="v-index-label">
          สำรวจงานฝีมือ <span aria-hidden="true">→</span>
        </span>
        {categories.map((category, i) => (
          <Link key={category.id} href={`/products/category/${category.slug}`}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {category.name_th}
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
      <section className="v-section v-collections" id="collections">
        <div className="v-section-heading">
          <div>
            {copy.collectionsEyebrow && <p className="v-eyebrow">{copy.collectionsEyebrow}</p>}
            <h2>
              {copy.collectionsTitle}
              {copy.collectionsTitleAccent && (
                <>
                  <br />
                  <span>{copy.collectionsTitleAccent}</span>
                </>
              )}
            </h2>
          </div>
          <div>
            {copy.collectionsIntro && (
              <p>
                <Lines text={copy.collectionsIntro} />
              </p>
            )}
            <Link className="v-text-link" href="/products">
              {copy.collectionsCta} ↗
            </Link>
          </div>
        </div>
        <CategoryBento categories={categories} copy={copy} />
      </section>
      <StorySection copy={copy} />
      {selectedProducts.items.length === 0 && (
        <section className="v-section" id="featured">
          <div className="v-featured-empty">
            <p>
              ติดตามผลงานจาก {categories.length} หมวดหมู่
              <br />
              <span>{categories.map((c) => c.name_th).join(" · ")}</span>
            </p>
            <Link href="/products">{copy.featuredEmptyCta} ↗</Link>
          </div>
        </section>
      )}
      {news.items.length > 0 && (
        <section className="v-section v-news-section">
          <div className="v-section-heading">
            <div>
              {copy.newsEyebrow && <p className="v-eyebrow">{copy.newsEyebrow}</p>}
              <h2>
                <Lines text={copy.newsTitle} />
              </h2>
            </div>
            <Link className="v-text-link" href="/news">
              {copy.newsCta} ↗
            </Link>
          </div>
          <div className="v-news-grid">
            {news.items.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        </section>
      )}
      <section className="v-closing">
        {copy.closingEyebrow && <p className="v-eyebrow">{copy.closingEyebrow}</p>}
        <h2>
          <Lines text={copy.closingTitle} />
        </h2>
        <Link className="v-button v-button-light" href="/contact">
          {copy.closingCta} <span>↗</span>
        </Link>
      </section>
    </main>
  );
}
