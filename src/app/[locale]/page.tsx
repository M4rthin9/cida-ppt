import { Link } from "@/i18n/navigation";
import { listCategories, listProducts, listNews } from "@/lib/vocational/data";
import { VocationalHero } from "@/components/vocational/VocationalHero";
import { CategoryBento } from "@/components/vocational/CategoryBento";
import { StorySection } from "@/components/vocational/StorySection";
import { ProductCard } from "@/components/vocational/ProductCard";
import { NewsCard } from "@/components/vocational/NewsCard";
import { publicMetadata } from "@/lib/seo/metadata";
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
  const [categories, featured, news] = await Promise.all([
    listCategories(),
    listProducts({ featured: "1", limit: 4 }),
    listNews({ limit: 3 }),
  ]);
  const words = [...categories.map((c) => c.name_th), "งานฝึกวิชาชีพ", "CRAFTED WITH PURPOSE"];
  return (
    <main id="content">
      <VocationalHero categories={categories} />
      <div className="v-marquees">
        {/* ARIA forbids naming a generic element, so an aria-label here was
            silently ignored and the marquee reached assistive tech as nothing
            at all. The visual rows stay aria-hidden (they repeat each word
            twice for the loop) and this carries the content instead. */}
        <p className="sr-only">{words.join(" · ")}</p>
        {[false, true].map((reverse, index) => (
          <div key={index} className={`v-marquee ${reverse ? "reverse" : ""}`} aria-hidden="true">
            <div>
              {[0, 1].map((copy) => (
                <span key={copy}>
                  {(reverse ? [...words].reverse() : words).map((word, i) => (
                    <span key={i}>
                      {word}
                      <b>✳</b>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <section className="v-section v-collections">
        <div className="v-section-heading">
          <div>
            <p className="v-eyebrow">CRAFT COLLECTIONS</p>
            <h2>
              ทักษะที่หลากหลาย
              <br />
              <span>ความตั้งใจเดียวกัน</span>
            </h2>
          </div>
          <div>
            <p>
              ค้นพบงานฝีมือจากการเรียนรู้และฝึกฝน
              <br />
              ที่ส่งต่อคุณค่า ผ่านรายละเอียดของทุกชิ้นงาน
            </p>
            <Link className="v-text-link" href="/products">
              สำรวจผลิตภัณฑ์ทั้งหมด ↗
            </Link>
          </div>
        </div>
        <CategoryBento categories={categories} />
      </section>
      <StorySection />
      <section className="v-section" id="featured">
        <div className="v-section-heading">
          <div>
            <p className="v-eyebrow">SELECTED WORKS</p>
            <h2>ผลงานที่อยากให้รู้จัก</h2>
          </div>
          <Link href="/products?featured=1" className="v-text-link">
            ชมผลงานแนะนำ ↗
          </Link>
        </div>
        {featured.items.length ? (
          <div className="v-product-grid v-featured-grid">
            {featured.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="v-featured-empty">
            <p>
              ติดตามผลงานจาก {categories.length} หมวดหมู่
              <br />
              <span>{categories.map((c) => c.name_th).join(" · ")}</span>
            </p>
            <Link href="/products">สำรวจหมวดหมู่ ↗</Link>
          </div>
        )}
      </section>
      {news.items.length > 0 && (
        <section className="v-section v-news-section">
          <div className="v-section-heading">
            <div>
              <p className="v-eyebrow">NEWS & ACTIVITIES</p>
              <h2>
                ความเคลื่อนไหว
                <br />
                แห่งการเรียนรู้
              </h2>
            </div>
            <Link className="v-text-link" href="/news">
              ข่าวและกิจกรรมทั้งหมด ↗
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
        <p className="v-eyebrow">EVERY CRAFT. A NEW POSSIBILITY.</p>
        <h2>
          ทุกผลงานมีความหมาย
          <br />
          ทุกทักษะคือโอกาสใหม่
        </h2>
        <Link className="v-button v-button-light" href="/contact">
          สอบถามผลิตภัณฑ์ <span>↗</span>
        </Link>
      </section>
    </main>
  );
}
