import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Category } from "@/lib/vocational/types";
import type { SettingValue } from "@/lib/settings/registry";
import { Lines } from "./Lines";
export function CategoryBento({
  categories,
  copy,
}: {
  categories: Category[];
  copy: SettingValue<"home">;
}) {
  return (
    <div className="v-bento">
      {categories.map((c, i) => (
        <Link
          key={c.id}
          href={`/products/category/${c.slug}`}
          className={`v-bento-card v-bento-${c.icon} ${c.thumbnail_url || c.image_url ? "with-image" : ""}`}
        >
          {(c.thumbnail_url || c.image_url) && (
            <Image
              src={c.thumbnail_url || c.image_url || ""}
              alt={c.name_th}
              fill
              sizes="(max-width: 760px) 100vw, 65vw"
            />
          )}
          <div className="v-bento-top">
            <span>COLLECTION {String(i + 1).padStart(2, "0")}</span>
            {c.icon_url ? (
              <span className="v-bento-icon">
                <Image src={c.icon_url} alt="" width={40} height={40} />
              </span>
            ) : (
              <span>↗</span>
            )}
          </div>
          <span className="v-bento-number" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="v-bento-copy">
            <h3>{c.name_th}</h3>
            <p>{c.short_description_th || c.description_th}</p>
            <small>{c.product_count} ผลงาน</small>
          </div>
        </Link>
      ))}
      <Link href="/story" className="v-bento-note">
        <span>{copy.storyNoteEyebrow}</span>
        <h3>
          <Lines text={copy.storyNoteTitle} />
        </h3>
        <span>{copy.storyNoteCta} ↗</span>
      </Link>
      <Link href="/products?featured=1" className="v-bento-note v-bento-featured">
        <span>{copy.featuredNoteEyebrow}</span>
        <h3>
          <Lines text={copy.featuredNoteTitle} />
        </h3>
        <span>{copy.featuredNoteCta} ↗</span>
      </Link>
    </div>
  );
}
