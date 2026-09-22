import { permanentRedirect } from "next/navigation";
import { localePrefix } from "@/lib/slug";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`${localePrefix(locale)}/products`);
}
