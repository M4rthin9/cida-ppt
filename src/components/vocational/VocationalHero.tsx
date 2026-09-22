import Image from "next/image";
import { Link } from "@/i18n/navigation";

/** Static introduction while the cinematic hero is deferred. No frame assets are required. */
export function VocationalHero() {
  return (
    <section className="v-sequence" aria-label="จากการฝึกฝนสู่โอกาสใหม่">
      <div className="v-hero-stage">
        <div className="v-hero-image">
          <Image
            src="/images/craft-hero.webp"
            alt="ภาพประกอบแนวคิดงานดอกไม้และงานผ้า"
            fill
            sizes="(max-width: 760px) 100vw, 65vw"
            priority
          />
        </div>
        <div className="v-hero-shade" />
        <div className="v-hero-content">
          <p className="v-kicker">
            <span />
            ฝ่ายฝึกวิชาชีพผู้ต้องขัง
          </p>
          <h1>
            ฝึกอาชีพ
            <br />
            <span>สร้างโอกาสใหม่</span>
          </h1>
          <p className="v-hero-description">
            พื้นที่แห่งการเรียนรู้และพัฒนาทักษะวิชาชีพ
            <br className="v-desktop" /> ผ่านการลงมือทำจริง สู่ผลงานที่มีคุณค่า
            <br className="v-desktop" /> และโอกาสในวันข้างหน้า
          </p>
          <div className="v-actions">
            <Link className="v-button v-button-light" href="/products">
              ชมผลิตภัณฑ์ <span>↗</span>
            </Link>
            <Link className="v-text-link" href="/vocational">
              เรียนรู้เรื่องงานฝึกวิชาชีพ <span>↗</span>
            </Link>
          </div>
        </div>
        <div className="v-hero-bottom">
          <span>
            CRAFTED WITH PURPOSE.
            <br />
            SKILLS FOR A NEW BEGINNING.
          </span>
          <p>ความตั้งใจ สร้างคุณค่าในทุกชิ้นงาน</p>
          <small>ภาพประกอบแนวคิดงานฝีมือ</small>
        </div>
      </div>
    </section>
  );
}
