"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { sql } from "@/db/client";
import { requireAdmin, requireOwner } from "@/lib/auth/session";
import {
  categoryInput,
  productInput,
  newsInput,
  idInput,
  plainDocument,
  readFields,
} from "./validation";
import type { ActionState } from "./types";
import { z } from "zod";

type Tx = import("postgres").TransactionSql;
function refresh() {
  revalidatePath("/", "layout");
  revalidateTag("catalog");
  revalidateTag("public");
}
async function audit(
  tx: Tx,
  userId: string,
  entity: string,
  entityId: string | null,
  action: string,
  diff: Record<string, unknown>,
) {
  // Drizzle owns this shared client and expects pre-serialized JSON and dates.
  await tx`insert into audit_log(id,user_id,entity,entity_id,action,diff) values(${randomUUID()},${userId},${entity},${entityId},${action},${JSON.stringify(diff)})`;
}
function failure(error: unknown): ActionState {
  if (error instanceof z.ZodError)
    return {
      ok: false,
      message: "กรุณาตรวจสอบข้อมูลที่ระบุ",
      errors: Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message])),
    };
  const e = error as { code?: string; constraint_name?: string; message?: string };
  if (e.code === "23505") {
    const field = e.constraint_name?.includes("sku") ? "sku" : "slug";
    return {
      ok: false,
      message: field === "sku" ? "รหัสสินค้านี้ถูกใช้แล้ว" : "ลิงก์นี้ถูกใช้แล้ว",
      errors: { [field]: "ข้อมูลนี้ถูกใช้แล้ว กรุณาเปลี่ยนใหม่" },
    };
  }
  if (e.code === "23503")
    return { ok: false, message: "ข้อมูลนี้ยังถูกใช้งาน หรือรายการที่เลือกไม่มีอยู่แล้ว" };
  if (e.code === "23514")
    return { ok: false, message: "ข้อมูลไม่ผ่านเงื่อนไขฐานข้อมูล กรุณาตรวจสอบราคาและสถานะ" };
  if (error instanceof ContentError) return { ok: false, message: error.message };
  console.error("Catalog mutation failed", e.code ?? "unexpected");
  return { ok: false, message: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
}
class ContentError extends Error {}
async function assertMedia(tx: Tx, ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((i): i is string => Boolean(i)))];
  if (!unique.length) return;
  const rows =
    await tx`select id from media where id in ${tx(unique)} and deleted_at is null for share`;
  if (rows.length !== unique.length)
    throw new ContentError("รูปภาพที่เลือกไม่มีอยู่แล้ว กรุณาเลือกใหม่");
}
async function assertCategory(tx: Tx, id: string) {
  const rows = await tx`select id from categories where id=${id} and deleted_at is null for share`;
  if (!rows.length) throw new ContentError("ไม่พบหมวดหมู่ที่เลือก กรุณาเลือกใหม่");
}
export async function saveCategory(
  id: string | null,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  try {
    if (id) idInput.parse(id);
    const v = categoryInput.parse(readFields(form));
    const key = id ?? randomUUID();
    await sql.begin(async (tx) => {
      await assertMedia(tx, [v.cover_image, v.thumbnail_image, v.icon_media_id]);
      const patch = {
        hero_media_id: v.cover_image,
        thumbnail_media_id: v.thumbnail_image,
        icon_media_id: v.icon_media_id,
        icon: v.icon,
        sort_order: v.display_order,
        status: v.status,
        is_enabled: v.is_enabled,
        is_featured: v.is_featured,
        is_published: v.status === "published" && v.is_enabled,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
      let before: unknown = null;
      if (id) {
        const rows =
          await tx`select * from categories where id=${id} and deleted_at is null for update`;
        if (!rows.length) throw new ContentError("ไม่พบหมวดหมู่");
        before = rows[0];
        await tx`update categories set ${tx(patch)} where id=${id}`;
      } else await tx`insert into categories ${tx({ id: key, ...patch, created_by: user.id })}`;
      for (const locale of ["th", "en"] as const) {
        const name = locale === "th" ? v.name_th : v.name_en;
        const content = {
          name,
          slug: v.slug,
          short_description: locale === "th" ? v.short_description_th : v.short_description_en,
          description: locale === "th" ? v.description_th : v.description_en,
          seo_title: v.seo_title,
          seo_description: v.seo_description,
          updated_at: new Date().toISOString(),
        };
        await tx`insert into category_i18n ${tx({ category_id: key, locale, ...content })} on conflict(category_id,locale) do update set ${tx(content)}`;
      }
      await audit(tx, user.id, "categories", key, id ? "update" : "create", { before, after: v });
    });
    refresh();
    return { ok: true, message: "บันทึกหมวดหมู่เรียบร้อยแล้ว", id: key };
  } catch (e) {
    return failure(e);
  }
}
export async function saveProduct(
  id: string | null,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  try {
    if (id) idInput.parse(id);
    const v = productInput.parse(readFields(form));
    const key = id ?? randomUUID();
    await sql.begin(async (tx) => {
      await assertCategory(tx, v.category_id);
      await assertMedia(tx, v.media_ids);
      const patch = {
        category_id: v.category_id,
        sku: v.sku || null,
        price: v.price,
        sale_price: v.sale_price,
        price_mode: v.price_mode,
        price_display:
          v.price_mode === "showcase"
            ? "hidden"
            : v.price_mode === "made_to_order"
              ? "contact"
              : v.price_mode,
        stock_status: v.status === "out_of_stock" ? "out_of_stock" : v.stock_status,
        quantity: v.quantity,
        made_to_order: v.made_to_order || v.price_mode === "made_to_order",
        lead_time: v.lead_time,
        materials: v.materials,
        dimensions: v.dimensions,
        weight: v.weight,
        status: v.status,
        sort_order: v.display_order,
        is_featured: v.is_featured,
        is_new: v.is_new,
        is_published: ["published", "out_of_stock"].includes(v.status),
        published_at: ["published", "out_of_stock"].includes(v.status)
          ? new Date().toISOString()
          : null,
        deleted_at: v.status === "archived" ? new Date().toISOString() : null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
      let before: unknown = null;
      if (id) {
        const rows = await tx`select * from products where id=${id} for update`;
        if (!rows.length) throw new ContentError("ไม่พบสินค้า");
        before = rows[0];
        await tx`update products set ${tx(patch)} where id=${id}`;
      } else await tx`insert into products ${tx({ id: key, ...patch, created_by: user.id })}`;
      for (const locale of ["th", "en"] as const) {
        const content = {
          name: locale === "th" ? v.name_th : v.name_en,
          slug: v.slug,
          short_desc: locale === "th" ? v.short_description_th : v.short_description_en,
          body: JSON.stringify(
            plainDocument(locale === "th" ? v.description_th : v.description_en),
          ),
          seo_title: v.seo_title,
          seo_description: v.seo_description,
          updated_at: new Date().toISOString(),
        };
        await tx`insert into product_i18n ${tx({ product_id: key, locale, ...content })} on conflict(product_id,locale) do update set ${tx(content)}`;
      }
      await tx`delete from product_media where product_id=${key}`;
      for (const [i, mediaId] of v.media_ids.entries())
        await tx`insert into product_media(product_id,media_id,sort_order,is_primary) values(${key},${mediaId},${i},${i === 0})`;
      await audit(tx, user.id, "products", key, id ? "update" : "create", { before, after: v });
    });
    refresh();
    return { ok: true, message: "บันทึกสินค้าเรียบร้อยแล้ว", id: key };
  } catch (e) {
    return failure(e);
  }
}
export async function saveNews(
  id: string | null,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  try {
    if (id) idInput.parse(id);
    const v = newsInput.parse(readFields(form));
    const key = id ?? randomUUID();
    await sql.begin(async (tx) => {
      await assertMedia(tx, [v.cover_image, ...v.media_ids]);
      const patch = {
        type: v.type,
        cover_media_id: v.cover_image,
        is_published: v.is_published,
        published_at: v.published_at
          ? new Date(v.published_at).toISOString()
          : v.is_published
            ? new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      };
      let before: unknown = null;
      if (id) {
        const rows = await tx`select * from posts where id=${id} and deleted_at is null for update`;
        if (!rows.length) throw new ContentError("ไม่พบข่าว");
        before = rows[0];
        await tx`update posts set ${tx(patch)} where id=${id}`;
      } else await tx`insert into posts ${tx({ id: key, ...patch, author_id: user.id })}`;
      const content = {
        title: v.title,
        slug: v.slug,
        excerpt: v.excerpt,
        body: JSON.stringify(plainDocument(v.description)),
        seo_title: v.seo_title,
        seo_description: v.seo_description,
        updated_at: new Date().toISOString(),
      };
      await tx`insert into post_i18n ${tx({ post_id: key, locale: "th", ...content })} on conflict(post_id,locale) do update set ${tx(content)}`;
      await tx`delete from post_media where post_id=${key}`;
      for (const [i, mediaId] of v.media_ids.entries())
        await tx`insert into post_media(post_id,media_id,sort_order) values(${key},${mediaId},${i})`;
      await audit(tx, user.id, "posts", key, id ? "update" : "create", { before, after: v });
    });
    refresh();
    return { ok: true, message: "บันทึกข่าวเรียบร้อยแล้ว", id: key };
  } catch (e) {
    return failure(e);
  }
}
export async function productCommand(
  ids: string[],
  command: "publish" | "hide" | "archive" | "restore" | "duplicate" | "delete" | "move",
  extra = "",
): Promise<ActionState> {
  const user = command === "delete" ? await requireOwner() : await requireAdmin();
  try {
    z.array(idInput)
      .min(1)
      .max(100)
      .refine((a) => new Set(a).size === a.length)
      .parse(ids);
    z.enum(["publish", "hide", "archive", "restore", "duplicate", "delete", "move"]).parse(command);
    let newId: string | undefined;
    await sql.begin(async (tx) => {
      if (command === "move") {
        idInput.parse(extra);
        await assertCategory(tx, extra);
      }
      const rows = await tx`select * from products where id in ${tx(ids)} for update`;
      if (rows.length !== ids.length)
        throw new ContentError("ไม่พบสินค้าบางรายการ กรุณารีเฟรชหน้า");
      for (const row of rows) {
        if (command === "duplicate") {
          if (ids.length !== 1) throw new ContentError("ทำสำเนาครั้งละหนึ่งรายการ");
          newId = randomUUID();
          const copy = {
            ...row,
            id: newId,
            sku: null,
            status: "draft",
            is_published: false,
            published_at: null,
            deleted_at: null,
            is_featured: false,
            is_seed: false,
            created_by: user.id,
            updated_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await tx`insert into products ${tx(copy)}`;
          const translations = await tx`select * from product_i18n where product_id=${row.id}`;
          for (const t of translations)
            await tx`insert into product_i18n ${tx({ ...t, product_id: newId, name: t.name ? `${t.name} (สำเนา)` : "", slug: `${String(t.slug).slice(0, 210)}-${newId}`, body: JSON.stringify(t.body), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })}`;
          await tx`insert into product_media(product_id,media_id,sort_order,is_primary) select ${newId},media_id,sort_order,is_primary from product_media where product_id=${row.id}`;
        } else if (command === "delete") {
          if (!row.deleted_at || extra !== "ลบถาวร")
            throw new ContentError("เก็บสินค้าถาวรก่อน และพิมพ์ ลบถาวร เพื่อยืนยัน");
          await tx`delete from products where id=${row.id}`;
        } else {
          if (row.deleted_at && !["restore", "move"].includes(command))
            throw new ContentError("กรุณากู้คืนสินค้าก่อนเปลี่ยนสถานะ");
          if (["publish", "restore"].includes(command)) await assertCategory(tx, row.category_id);
          const patch =
            command === "move"
              ? { category_id: extra }
              : command === "publish"
                ? {
                    status: row.stock_status === "out_of_stock" ? "out_of_stock" : "published",
                    is_published: true,
                    published_at: new Date().toISOString(),
                  }
                : command === "hide"
                  ? { status: "hidden", is_published: false }
                  : command === "archive"
                    ? {
                        status: "archived",
                        is_published: false,
                        deleted_at: new Date().toISOString(),
                      }
                    : { status: "draft", is_published: false, deleted_at: null };
          await tx`update products set ${tx({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() })} where id=${row.id}`;
        }
        await audit(tx, user.id, "products", row.id, command, {
          before: row,
          command,
          destination: extra || null,
          duplicateId: newId ?? null,
        });
      }
    });
    refresh();
    return { ok: true, message: "ดำเนินการเรียบร้อยแล้ว", id: newId };
  } catch (e) {
    return failure(e);
  }
}
export async function categoryCommand(
  id: string,
  command: "delete" | "up" | "down" | "hide" | "publish",
  destination = "",
): Promise<ActionState> {
  const user = await requireAdmin();
  try {
    idInput.parse(id);
    z.enum(["delete", "up", "down", "hide", "publish"]).parse(command);
    await sql.begin(async (tx) => {
      // Serialize reorder/delete; product creation locks its category too.
      const rows =
        await tx`select * from categories where deleted_at is null order by sort_order,created_at for update`;
      const row = rows.find((r) => r.id === id);
      if (!row) throw new ContentError("ไม่พบหมวดหมู่");
      if (command === "delete") {
        const children =
          await tx`select id from categories where parent_id=${id} and deleted_at is null limit 1`;
        if (children.length) throw new ContentError("กรุณาย้ายหมวดหมู่ย่อยก่อน");
        const [count] = await tx`select count(*)::int n from products where category_id=${id}`;
        if ((count?.n ?? 0) > 0) {
          if (!destination || destination === id || !rows.some((r) => r.id === destination))
            throw new ContentError("หมวดหมู่นี้มีสินค้าอยู่ กรุณาเลือกหมวดหมู่ปลายทางก่อนลบ");
          await tx`update products set category_id=${destination},updated_by=${user.id},updated_at=now() where category_id=${id}`;
        }
        await tx`update categories set deleted_at=now(),is_published=false,status='hidden',updated_by=${user.id},updated_at=now() where id=${id}`;
      } else if (command === "up" || command === "down") {
        const index = rows.findIndex((r) => r.id === id),
          next = index + (command === "up" ? -1 : 1);
        const current = rows[index],
          target = rows[next];
        if (current && target) {
          rows[index] = target;
          rows[next] = current;
        }
        for (const [i, item] of rows.entries())
          await tx`update categories set sort_order=${i},updated_by=${user.id},updated_at=now() where id=${item.id}`;
      } else
        await tx`update categories set status=${command === "publish" ? "published" : "hidden"},is_published=${command === "publish" && row.is_enabled},updated_by=${user.id},updated_at=now() where id=${id}`;
      await audit(tx, user.id, "categories", id, command, {
        before: row,
        destination: destination || null,
      });
    });
    refresh();
    return { ok: true, message: "ดำเนินการเรียบร้อยแล้ว" };
  } catch (e) {
    return failure(e);
  }
}
export async function newsCommand(
  id: string,
  command: "archive" | "restore" | "publish" | "hide",
): Promise<ActionState> {
  const user = await requireAdmin();
  try {
    idInput.parse(id);
    z.enum(["archive", "restore", "publish", "hide"]).parse(command);
    await sql.begin(async (tx) => {
      const [row] = await tx`select * from posts where id=${id} for update`;
      if (!row) throw new ContentError("ไม่พบข่าว");
      if (row.deleted_at && command !== "restore") throw new ContentError("กรุณากู้คืนข่าวก่อน");
      const patch =
        command === "archive"
          ? { deleted_at: new Date().toISOString(), is_published: false }
          : command === "restore"
            ? { deleted_at: null, is_published: false }
            : command === "publish"
              ? { is_published: true, published_at: new Date().toISOString() }
              : { is_published: false };
      await tx`update posts set ${tx({ ...patch, updated_at: new Date().toISOString() })} where id=${id}`;
      await audit(tx, user.id, "posts", id, command, { before: row, after: patch });
    });
    refresh();
    return { ok: true, message: "ดำเนินการเรียบร้อยแล้ว" };
  } catch (e) {
    return failure(e);
  }
}
