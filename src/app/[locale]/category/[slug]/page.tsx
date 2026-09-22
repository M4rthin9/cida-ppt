import { permanentRedirect } from "next/navigation";
import { localePrefix } from "@/lib/slug";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  permanentRedirect(
    `${localePrefix(locale)}/products/category/${encodeURIComponent(decodeURIComponent(slug))}`,
  );
}
