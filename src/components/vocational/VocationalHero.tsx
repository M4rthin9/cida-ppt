import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { SiteIcon } from "@/components/site/icons";

/** Static introduction while the cinematic hero is deferred. No frame assets are required. */
export function VocationalHero() {
  return (
    <section className="v-intro" aria-label="จากการฝึกฝนสู่โอกาสใหม่">
      <div className="v-intro-copy">
        <p className="v-eyebrow">CRAFTED WITH PURPOSE</p>
        <h1>
          ฝึกอาชีพ
          <br />
          <span>สร้างโอกาสใหม่</span>
        </h1>
        <p className="v-intro-description">
          ทุกทักษะเริ่มต้นจากการลงมือทำ
          <br />
          ทุกผลงานสะท้อนความตั้งใจ และทุกโอกาส
          <br className="v-desktop" />
          คือจุดเริ่มต้นของวันข้างหน้า
        </p>
        <div className="v-actions">
          <Link className="v-button v-button-dark" href="/products">
            สำรวจผลิตภัณฑ์ <SiteIcon name="arrow" />
          </Link>
          <Link className="v-text-link" href="/vocational">
            รู้จักงานฝึกวิชาชีพ <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="v-intro-signature">
          <span aria-hidden="true">01 —</span>
          <p>
            จากการฝึกฝน สู่ผลงานที่มีคุณค่า
            <small>ฝ่ายฝึกวิชาชีพผู้ต้องขัง ทัณฑสถานบำบัดพิเศษกลาง</small>
          </p>
        </div>
      </div>
      <figure className="v-intro-visual">
        <div className="v-intro-image">
          <Image
            src="/images/craft-hero.webp"
            alt="ภาพประกอบแนวคิดงานดอกไม้และงานผ้า"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
            priority
          />
        </div>
        <figcaption>
          <span>ความตั้งใจในทุกรายละเอียด</span>
          <small>ภาพประกอบแนวคิดงานฝีมือ</small>
        </figcaption>
        <span className="v-intro-image-label" aria-hidden="true">
          SKILLS. CRAFT. OPPORTUNITY.
        </span>
      </figure>
    </section>
  );
}
