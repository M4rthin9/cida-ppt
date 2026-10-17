import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Category } from "@/lib/vocational/types";
import type { SettingValue } from "@/lib/settings/registry";
import { Lines } from "./Lines";
import { CraftMark } from "./CraftMark";

export function CategoryBento({
  categories,
  copy,
}: {
  categories: Category[];
  copy: SettingValue<"home">;
}) {
  return (
    <>
      <div className="v-collection-gallery">
        {categories.map((category, index) => {
          const picture = category.thumbnail_url || category.image_url;
          return (
            <Link
              key={category.id}
              href={`/products/category/${category.slug}`}
              className={`v-collection-card v-bento-${category.icon}${picture ? " has-background" : ""}`}
              aria-labelledby={`collection-${category.id}`}
            >
              <div className={`v-collection-visual ${picture ? "with-image" : ""}`}>
                {picture ? (
                  <Image
                    src={picture}
                    alt=""
                    fill
                    quality={90}
                    sizes={
                      // Landscape files on tall cards need enough pixels for
                      // their covered height, as well as the visible width.
                      index % 4 === 0
                        ? "(max-width: 700px) max(100vw, 720px), (max-width: 1050px) max(50vw, 720px), 1500px"
                        : index % 4 === 1
                          ? "(max-width: 700px) 100vw, (max-width: 1440px) 50vw, 720px"
                          : "(max-width: 700px) max(100vw, 600px), (max-width: 1050px) max(50vw, 600px), 600px"
                    }
                  />
                ) : (
                  <div className="v-collection-emblem" aria-hidden="true">
                    <span className="v-collection-orbit" />
                    <CraftMark kind={category.icon} />
                  </div>
                )}
              </div>
              <div className="v-collection-meta" aria-hidden="true">
                <span className="v-collection-number">{String(index + 1).padStart(2, "0")}</span>
                <span lang="en">CRAFT COLLECTION</span>
                {category.icon_url && (
                  <Image src={category.icon_url} alt="" width={32} height={32} />
                )}
              </div>
              <div className="v-collection-copy">
                <div className="v-collection-caption" aria-hidden="true">
                  <span lang="en">{category.name_en || "CRAFTED WITH PURPOSE"}</span>
                </div>
                <div className="v-collection-title-row">
                  <h3 id={`collection-${category.id}`}>{category.name_th}</h3>
                  {category.product_count > 0 && (
                    <span className="v-collection-count">{category.product_count} ผลงาน</span>
                  )}
                </div>
                <p>{category.short_description_th || category.description_th}</p>
                <span className="v-collection-action">
                  สำรวจหมวดงาน{" "}
                  <span className="v-collection-round-arrow" aria-hidden="true">
                    ↗
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="v-collection-notes">
        <Link href="/story">
          <span className="v-collection-note-index" aria-hidden="true">
            01 /
          </span>
          <div>
            <span className="v-eyebrow">{copy.storyNoteEyebrow}</span>
            <h3>
              <Lines text={copy.storyNoteTitle} />
            </h3>
          </div>
          <span className="v-collection-note-action">
            {copy.storyNoteCta} <span aria-hidden="true">↗</span>
          </span>
        </Link>
        <Link href="/products?featured=1">
          <span className="v-collection-note-index" aria-hidden="true">
            02 /
          </span>
          <div>
            <span className="v-eyebrow">{copy.featuredNoteEyebrow}</span>
            <h3>
              <Lines text={copy.featuredNoteTitle} />
            </h3>
          </div>
          <span className="v-collection-note-action">
            {copy.featuredNoteCta} <span aria-hidden="true">↗</span>
          </span>
        </Link>
      </div>
    </>
  );
}
