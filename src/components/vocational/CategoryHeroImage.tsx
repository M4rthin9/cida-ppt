import Image, { getImageProps } from "next/image";
import { stat } from "node:fs/promises";
import { resolveMediaPath } from "@/lib/media/storage";

export async function CategoryHeroImage({ src, alt }: { src: string; alt: string }) {
  const mobile = src.replace(/\/master\.webp$/, "/category-mobile-v2.webp");
  const mobilePath =
    mobile !== src && mobile.startsWith("/media/")
      ? resolveMediaPath(mobile.slice("/media/".length).split("/"))
      : null;
  const hasMobile = mobilePath && (await stat(mobilePath).catch(() => null))?.isFile();
  const common = { alt, fill: true, sizes: "100vw", quality: 90, loading: "eager" as const };
  if (!hasMobile) return <Image src={src} {...common} alt={alt} />;
  const { props } = getImageProps({ ...common, src });
  const { props: mobileProps } = getImageProps({ ...common, src: mobile });
  return (
    <picture>
      <source media="(max-width: 760px)" srcSet={mobileProps.srcSet} sizes={mobileProps.sizes} />
      <img {...props} alt={alt} />
    </picture>
  );
}
