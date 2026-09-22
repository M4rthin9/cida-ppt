import { redirect } from "next/navigation";
import { localePrefix } from "@/lib/slug";
import {
  catalogHref,
  catalogQuery,
  type PublicSearchParams,
} from "@/components/vocational/catalog-query";
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<PublicSearchParams>;
}) {
  const { locale } = await params;
  const { q } = catalogQuery(await searchParams);
  redirect(catalogHref(`${localePrefix(locale)}/products`, { q }));
}
