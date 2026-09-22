import { redirect } from "next/navigation";
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  redirect(`/products${typeof q === "string" && q ? `?q=${encodeURIComponent(q)}` : ""}`);
}
