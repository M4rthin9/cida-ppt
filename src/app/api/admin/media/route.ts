import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { getAdminUser } from "@/lib/auth/session";
import { processUpload, MediaRejected } from "@/lib/media/pipeline";
import { keyDirectory } from "@/lib/media/storage";
import { listMedia } from "@/lib/vocational/data";
import { sql } from "@/db/client";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  return origin === new URL(process.env.AUTH_URL ?? req.url).origin;
}
export async function GET(req: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const q = req.nextUrl.searchParams;
  return NextResponse.json(
    {
      items: await listMedia(
        q.get("q") ?? "",
        Math.min(10000, Number.parseInt(q.get("page") ?? "1") || 1),
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 403 });
  const size = Number(req.headers.get("content-length"));
  if (!Number.isFinite(size) || size <= 0 || size > 11 * 1024 * 1024)
    return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป ขนาดสูงสุด 10 MB" }, { status: 413 });
  let storageKey: string | undefined;
  try {
    const form = await req.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") ?? "")
      .trim()
      .slice(0, 1000);
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new MediaRejected("รองรับ JPEG, PNG และ WebP เท่านั้น", "unsupported");
    const result = await processUpload(Buffer.from(await file.arrayBuffer()), file.name);
    storageKey = result.storageKey;
    const id = randomUUID();
    await sql.begin(async (tx) => {
      await tx`insert into media(id,filename,storage_key,mime,width,height,bytes,blurhash,focal_x,focal_y,original_kept,uploaded_by) values(${id},${result.filename},${result.storageKey},${result.mime},${result.width},${result.height},${result.bytes},${result.blurhash},50,50,true,${user.id})`;
      await tx`insert into media_i18n(media_id,locale,alt) values(${id},'th',${alt})`;
      await tx`insert into audit_log(id,user_id,entity,entity_id,action,diff) values(${randomUUID()},${user.id},'media',${id},'upload',${JSON.stringify({ filename: result.filename })})`;
    });
    return NextResponse.json(
      {
        item: {
          id,
          filename: result.filename,
          storage_key: result.storageKey,
          width: result.width,
          height: result.height,
          alt,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    if (storageKey) await rm(keyDirectory(storageKey), { recursive: true, force: true });
    return NextResponse.json(
      { error: e instanceof MediaRejected ? e.message : "อัปโหลดไม่สำเร็จ กรุณาลองใหม่" },
      { status: 400 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบรูปภาพ" }, { status: 400 });
  try {
    await sql.begin(async (tx) => {
      const rows = await tx`select id from media where id=${id} for update`;
      if (!rows.length) throw new Error("ไม่พบรูปภาพ");
      const [usage] = await tx`select (
        (select count(*) from product_media where media_id=${id}) +
        (select count(*) from post_media where media_id=${id}) +
        (select count(*) from categories where hero_media_id=${id} or icon_media_id=${id} or thumbnail_media_id=${id} or og_media_id=${id}) +
        (select count(*) from posts where cover_media_id=${id}) +
        (select count(*) from products where og_media_id=${id})
      )::int total`;
      if (usage?.total) throw new Error("รูปภาพนี้ถูกใช้งานอยู่ กรุณานำออกจากรายการก่อน");
      await tx`update media set deleted_at=now() where id=${id}`;
      await tx`insert into audit_log(id,user_id,entity,entity_id,action,diff) values(${randomUUID()},${user.id},'media',${id},'delete',${JSON.stringify({ deleted: true })})`;
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ลบไม่สำเร็จ" },
      { status: 409 },
    );
  }
}
