import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { SiteIcon } from "@/components/site/icons";
import type { Category } from "@/lib/vocational/types";

/**
 * Editorial homepage opening while the cinematic frame sequence stays deferred:
 * still a server component with no canvas, no frame manifest and no player JS.
 *
 * The depth comes from layered CSS (two soft blooms, a hairline grid, an arched
 * image frame and a typographic medallion) rather than from extra assets, and
 * every moving part is a plain CSS animation so the site-wide
 * `prefers-reduced-motion` reset in vocational.css switches all of it off.
 *
 * The category rail is real seeded data passed down from the page — nothing
 * here invents a product, an event or a photograph. The single image keeps its
 * caption marking it as a concept illustration.
 */
export function VocationalHero({ categories = [] }: { categories?: Category[] }) {
  const rail = categories.slice(0, 4);
  return (
    <section className="v-intro" aria-label="จากการฝึกฝนสู่โอกาสใหม่">
      <div className="v-intro-canvas" aria-hidden="true">
        <span className="v-intro-bloom v-intro-bloom-a" />
        <span className="v-intro-bloom v-intro-bloom-b" />
        <span className="v-intro-grid" />
      </div>
      <div className="v-intro-inner">
        <div className="v-intro-copy">
          <p className="v-intro-badge">
            <span className="v-intro-badge-dot" aria-hidden="true" />
            ฝ่ายฝึกวิชาชีพผู้ต้องขัง
            <small>ทัณฑสถานบำบัดพิเศษกลาง</small>
          </p>
          <p className="v-eyebrow">CRAFTED WITH PURPOSE</p>
          <h1>
            ฝึกอาชีพ
            <br />
            <span className="v-intro-accent">
              สร้างโอกาสใหม่
              <svg
                className="v-intro-underline"
                viewBox="0 0 320 18"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M3 12.5C58 5.5 132 2.5 200 4.5c48 1.4 86 4.6 117 9" />
              </svg>
            </span>
          </h1>
          <p className="v-intro-description">
            พื้นที่แห่งการเรียนรู้และพัฒนาทักษะวิชาชีพ ผ่านการลงมือทำจริง
            สู่ผลงานที่มีคุณค่าและโอกาสในวันข้างหน้า
          </p>
          <div className="v-actions">
            <Link className="v-button v-button-dark" href="/products">
              ชมผลิตภัณฑ์ <SiteIcon name="arrow" />
            </Link>
            <Link className="v-text-link" href="/vocational">
              เรียนรู้เรื่องงานฝึกวิชาชีพ <span aria-hidden="true">↗</span>
            </Link>
          </div>
          {rail.length > 0 && (
            <nav className="v-intro-rail" aria-label="หมวดงานฝีมือ">
              <span className="v-intro-rail-label" aria-hidden="true">
                หมวดงานฝีมือ
              </span>
              <ul>
                {rail.map((category) => (
                  <li key={category.id}>
                    <Link href={`/products/category/${category.slug}`}>{category.name_th}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="v-intro-signature">
            <span aria-hidden="true">01 —</span>
            <p>
              จากการฝึกฝน สู่ผลงานที่มีคุณค่า
              <small>ฝ่ายฝึกวิชาชีพผู้ต้องขัง ทัณฑสถานบำบัดพิเศษกลาง</small>
            </p>
          </div>
        </div>
        <div className="v-intro-visual">
          <figure className="v-intro-frame">
            <div className="v-intro-image">
              <Image
                src="/images/craft-hero.webp"
                alt="ภาพประกอบแนวคิดงานดอกไม้และงานผ้า"
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                priority
              />
            </div>
            <span className="v-intro-image-label" aria-hidden="true">
              SKILLS. CRAFT. OPPORTUNITY.
            </span>
            <figcaption>
              <span>ความตั้งใจในทุกรายละเอียด</span>
              <small>ภาพประกอบแนวคิดงานฝีมือ</small>
            </figcaption>
          </figure>
          <div className="v-intro-medallion" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <defs>
                <path id="v-intro-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1 -88 0" />
              </defs>
              <text>
                <textPath href="#v-intro-ring" startOffset="0">
                  ฝึกอาชีพ · สร้างทักษะ · สร้างโอกาสใหม่ · ฝึกอาชีพ · สร้างทักษะ · สร้างโอกาสใหม่ ·
                </textPath>
              </text>
            </svg>
            <span className="v-intro-medallion-core">
              <SiteIcon name="arrow" />
            </span>
          </div>
        </div>
      </div>
      <p className="v-intro-scroll" aria-hidden="true">
        <span className="v-intro-scroll-rule" />
        เลื่อนดูผลงาน
      </p>
    </section>
  );
}
