import { listCategories } from "@/lib/vocational/data";
import { Navigation } from "@/components/vocational/Navigation";
export async function SiteHeader() {
  const categories = await listCategories();
  return <Navigation categories={categories.map((c) => ({ name_th: c.name_th, slug: c.slug }))} />;
}
