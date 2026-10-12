import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { SettingValue } from "@/lib/settings/registry";
import { Lines } from "./Lines";

export function CraftHero({ copy }: { copy: SettingValue<"home"> }) {
  return (
    <section className="v-craft-hero" aria-labelledby="craft-title">
      <div className="v-craft-hero-copy">
        <p className="v-eyebrow" lang="en">
          CRAFTED WITH PURPOSE
        </p>
        <h1 id="craft-title">
          {copy.heroTitle}
          {copy.heroTitleAccent && <span>{copy.heroTitleAccent}</span>}
        </h1>
        <p className="v-craft-hero-lede">
          <Lines text={copy.heroLede} />
        </p>
        <div className="v-actions">
          <Link className="v-button v-button-dark" href="/products">
            {copy.heroCta}
            <span aria-hidden="true">↗</span>
          </Link>
          <Link className="v-text-link" href="/story">
            เรื่องราวของเรา <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="v-hero-signature">
          <span aria-hidden="true">✳</span>
          <p>
            ฝึกอาชีพ สร้างทักษะ
            <br />
            <strong>สร้างคุณค่า สร้างโอกาสใหม่</strong>
          </p>
          <small lang="en">
            THE VALUE
            <br />
            OF MAKING.
          </small>
        </div>
      </div>
      <figure className="v-craft-hero-visual">
        <div className="v-craft-hero-image">
          <Image
            src="/images/craft-hero.webp"
            alt="ภาพประกอบแนวคิดงานฝีมือ ดอกไม้ประดิษฐ์และงานปักบนผ้า"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
            priority
          />
          <span className="v-hero-image-label" lang="en">
            MATERIAL. SKILL. POSSIBILITY.
          </span>
        </div>
        <figcaption>
          <span>ภาพประกอบแนวคิดงานฝีมือ</span>
          <span lang="en">A STUDY IN CRAFT · 01</span>
        </figcaption>
      </figure>
    </section>
  );
}
