import Image from "next/image";
import { SiteIcon } from "@/components/site/icons";
import styles from "./product-image.module.css";

/** One photographic treatment for catalogue cards, featured work and galleries. */
export function ProductImage({
  src,
  alt,
  sizes,
  preload = false,
  emptyLabel = "ยังไม่มีภาพสินค้า",
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  preload?: boolean;
  emptyLabel?: string;
}) {
  return (
    <span className={styles.stage}>
      {src ? (
        <span className={styles.photograph}>
          <Image src={src} alt={alt} fill sizes={sizes} preload={preload} />
        </span>
      ) : (
        <span className={styles.empty}>
          <SiteIcon name="image" />
          <span>{emptyLabel}</span>
        </span>
      )}
    </span>
  );
}
