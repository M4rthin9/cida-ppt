import { listCategories } from "@/lib/vocational/data";
import { Navigation } from "@/components/vocational/Navigation";
import { getCachedSetting } from "@/lib/settings/cached";
export async function SiteHeader() {
  const [categories, general] = await Promise.all([
    listCategories(),
    getCachedSetting("general", "th"),
  ]);
  return (
    <Navigation
      name={general.siteName}
      organisation={general.organisation}
      categories={categories.map((c) => ({ name_th: c.name_th, slug: c.slug }))}
    />
  );
}
