import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Category } from "@/lib/vocational/types";

/**
 * The collections grid. Each card is a cell on the section's 12-column grid,
 * opening on the same hairline as its neighbours: index and marker ride the
 * rule, the image plane fills what is left, and the copy sits on top of it.
 *
 * The background is the operator's own upload — ภาพพื้นหลังการ์ด first, the
 * banner as the fallback. With neither, the cell falls back to the category's
 * step of the grey ramp, which is why `.v-bento-media` always renders.
 */
export function CategoryBento({ categories }: { categories: Category[] }) {
  return (
    <div className="v-bento">
      {categories.map((c, i) => {
        const background = c.thumbnail_url || c.image_url;
        const index = String(i + 1).padStart(2, "0");
        return (
          <Link
            key={c.id}
            href={`/products/category/${c.slug}`}
            className={`v-bento-card v-bento-${c.icon} ${background ? "with-image" : ""}`}
          >
            <div className="v-bento-top">
              <span className="lat">COLLECTION {index}</span>
              {c.icon_url ? (
                <span className="v-bento-icon">
                  <Image src={c.icon_url} alt="" width={24} height={24} />
                </span>
              ) : (
                <span aria-hidden="true">↗</span>
              )}
            </div>
            <div className="v-bento-media">
              {background && (
                <Image
                  src={background}
                  alt={c.name_th}
                  fill
                  sizes="(max-width: 760px) 100vw, 60vw"
                />
              )}
            </div>
            <span className="v-bento-number lat" aria-hidden="true">
              {index}
            </span>
            <div className="v-bento-copy">
              <h3>{c.name_th}</h3>
              <p>{c.short_description_th || c.description_th}</p>
              <small>{c.product_count} ผลงาน</small>
            </div>
          </Link>
        );
      })}
      <Link href="/story" className="v-bento-note">
        <span className="lat">OUR STORY</span>
        <h3>
          เรื่องราว
          <br />
          งานฝึกวิชาชีพ
        </h3>
        <span>อ่านเรื่องราว ↗</span>
      </Link>
      <Link href="/products?featured=1" className="v-bento-note v-bento-featured">
        <span className="lat">SELECTED WORKS</span>
        <h3>
          ผลงานที่ตั้งใจ
          <br />
          ให้คุณได้รู้จัก
        </h3>
        <span>สินค้าแนะนำ ↗</span>
      </Link>
    </div>
  );
}
