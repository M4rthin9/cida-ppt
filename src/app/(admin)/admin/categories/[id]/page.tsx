import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { listCategories } from "@/lib/vocational/data";
import { sql } from "@/db/client";
import type { MediaItem } from "@/lib/vocational/types";
import { ContentEditor } from "@/components/admin/ContentEditor";
export const metadata = { title: "แก้ไขหมวดหมู่" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params,
    row = (await listCategories(true)).find((c) => c.id === id);
  if (!row) notFound();
  const ids = [row.cover_image, row.thumbnail_image, row.icon_media_id].filter((v): v is string =>
    Boolean(v),
  );
  const media = ids.length
    ? await sql<
        MediaItem[]
      >`select id,storage_key,filename,width,height,null as alt from media where id in ${sql(ids)}`
    : [];
  return (
    <>
      <Link className="cms-back" href="/admin/categories">
        ← กลับรายการหมวดหมู่
      </Link>
      <h1>แก้ไขหมวดหมู่</h1>
      <ContentEditor
        kind="category"
        id={id}
        defaults={JSON.parse(JSON.stringify(row))}
        media={media}
      />
    </>
  );
}
