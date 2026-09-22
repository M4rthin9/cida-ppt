import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { listNews, gallery } from "@/lib/vocational/data";
import { sql } from "@/db/client";
import type { MediaItem } from "@/lib/vocational/types";
import { ContentEditor } from "@/components/admin/ContentEditor";
export const metadata = { title: "แก้ไขข่าว" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params,
    row = (await listNews({ admin: true, id })).items[0];
  if (!row) notFound();
  const media = await gallery(id, "news");
  if (row.cover_image && !media.some((m) => m.id === row.cover_image)) {
    const covers = await sql<
      MediaItem[]
    >`select id,storage_key,filename,width,height,null as alt from media where id=${row.cover_image}`;
    media.push(...covers);
  }
  const defaults = {
    ...row,
    published_at: row.published_at ? new Date(row.published_at).toISOString() : "",
    media_ids: (await gallery(id, "news")).map((m) => m.id),
  };
  return (
    <>
      <Link className="cms-back" href="/admin/news">
        ← กลับรายการข่าว
      </Link>
      <h1>แก้ไขข่าวและกิจกรรม</h1>
      <ContentEditor
        kind="news"
        id={id}
        defaults={JSON.parse(JSON.stringify(defaults))}
        media={media}
      />
    </>
  );
}
