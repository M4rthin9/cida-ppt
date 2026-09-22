"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { categoryCommand, productCommand, newsCommand } from "@/lib/vocational/actions";
import {
  PRODUCT_STATUSES,
  CATEGORY_STATUSES,
  STOCK_STATUSES,
  priceLabel,
  type Category,
  type Product,
  type News,
  type ActionState,
} from "@/lib/vocational/types";
function Notice({ state }: { state: ActionState }) {
  return state.message ? (
    <p role={state.ok ? "status" : "alert"} className={state.ok ? "cms-success" : "cms-error"}>
      {state.message}
    </p>
  ) : null;
}
export function ProductTable({
  items,
  categories,
  owner,
}: {
  items: Product[];
  categories: Category[];
  owner: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]),
    [state, setState] = useState<ActionState>({}),
    [pending, start] = useTransition(),
    router = useRouter();
  const [bulk, setBulk] = useState<"publish" | "hide" | "archive" | "restore" | "move">("publish"),
    [destination, setDestination] = useState("");
  function run(ids: string[], command: Parameters<typeof productCommand>[1], extra = "") {
    if (
      ["archive", "delete"].includes(command) &&
      !confirm(
        command === "delete"
          ? "ลบถาวรไม่สามารถกู้คืนได้ ยืนยันดำเนินการ?"
          : "เก็บสินค้าที่เลือกถาวร? คุณสามารถกู้คืนได้ภายหลัง",
      )
    )
      return;
    if (command === "delete") {
      extra = prompt("พิมพ์ ลบถาวร เพื่อยืนยัน") ?? "";
      if (extra !== "ลบถาวร") return;
    }
    start(async () => {
      const r = await productCommand(ids, command, extra);
      setState(r);
      if (r.ok) {
        setSelected([]);
        if (r.id && command === "duplicate") router.push(`/admin/products/${r.id}`);
        else router.refresh();
      }
    });
  }
  return (
    <>
      <Notice state={state} />
      <div className="cms-bulk">
        <span>เลือก {selected.length} รายการ</span>
        <select
          aria-label="คำสั่งหลายรายการ"
          value={bulk}
          onChange={(e) => setBulk(e.target.value as typeof bulk)}
        >
          <option value="publish">เผยแพร่</option>
          <option value="hide">ซ่อน</option>
          <option value="archive">เก็บถาวร</option>
          <option value="restore">กู้คืนเป็นฉบับร่าง</option>
          <option value="move">ย้ายหมวดหมู่</option>
        </select>
        {bulk === "move" && (
          <select
            aria-label="หมวดหมู่ปลายทาง"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">เลือกหมวดหมู่ปลายทาง</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_th}
              </option>
            ))}
          </select>
        )}
        <button
          disabled={!selected.length || pending}
          onClick={() => run(selected, bulk, destination)}
        >
          ดำเนินการ
        </button>
      </div>
      <div className="cms-table-wrap">
        <table className="cms-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="เลือกทั้งหมดในหน้านี้"
                  checked={items.length > 0 && selected.length === items.length}
                  onChange={(e) => setSelected(e.target.checked ? items.map((p) => p.id) : [])}
                />
              </th>
              <th>สินค้า / รหัส</th>
              <th>หมวดหมู่</th>
              <th>ราคา</th>
              <th>สถานะ / สต็อก</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`เลือก ${p.name_th}`}
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? [...selected, p.id] : selected.filter((i) => i !== p.id),
                      )
                    }
                  />
                </td>
                <td>
                  <Link className="cms-name" href={`/admin/products/${p.id}`}>
                    {p.name_th}
                  </Link>
                  <small>
                    {p.sku || "—"}
                    {p.is_featured ? " · แนะนำ" : ""}
                    {p.is_new ? " · ใหม่" : ""}
                  </small>
                </td>
                <td>{p.category_name}</td>
                <td>{priceLabel(p)}</td>
                <td>
                  <span className={`cms-status ${p.status}`}>{PRODUCT_STATUSES[p.status]}</span>
                  <small>{STOCK_STATUSES[p.stock_status]}</small>
                </td>
                <td>
                  <div className="cms-row-actions">
                    <Link href={`/admin/products/${p.id}`}>แก้ไข</Link>
                    {!p.deleted_at && (
                      <Link href={`/products/${p.slug}`} target="_blank">
                        ดูหน้าเว็บ
                      </Link>
                    )}
                    <button disabled={pending} onClick={() => run([p.id], "duplicate")}>
                      ทำสำเนา
                    </button>
                    {p.deleted_at ? (
                      <>
                        <button disabled={pending} onClick={() => run([p.id], "restore")}>
                          กู้คืน
                        </button>
                        {owner && (
                          <button
                            className="cms-danger-link"
                            disabled={pending}
                            onClick={() => run([p.id], "delete")}
                          >
                            ลบถาวร
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          disabled={pending}
                          onClick={() =>
                            run(
                              [p.id],
                              ["published", "out_of_stock"].includes(p.status) ? "hide" : "publish",
                            )
                          }
                        >
                          {["published", "out_of_stock"].includes(p.status) ? "ซ่อน" : "เผยแพร่"}
                        </button>
                        <button disabled={pending} onClick={() => run([p.id], "archive")}>
                          เก็บถาวร
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!items.length && (
        <div className="cms-empty">
          ไม่พบสินค้าในรายการนี้ <Link href="/admin/products/new">เพิ่มสินค้าใหม่</Link>
        </div>
      )}
    </>
  );
}
export function CategoryTable({ items }: { items: Category[] }) {
  const [state, setState] = useState<ActionState>({}),
    [pending, start] = useTransition(),
    [deleting, setDeleting] = useState<string | null>(null),
    [destination, setDestination] = useState(""),
    router = useRouter();
  function run(id: string, command: Parameters<typeof categoryCommand>[1]) {
    if (
      command === "delete" &&
      !confirm("ยืนยันลบหมวดหมู่นี้? สินค้าจะถูกย้ายไปหมวดหมู่ปลายทางที่เลือก")
    )
      return;
    start(async () => {
      const r = await categoryCommand(id, command, destination);
      setState(r);
      if (r.ok) {
        setDeleting(null);
        router.refresh();
      }
    });
  }
  return (
    <>
      <Notice state={state} />
      <div className="cms-category-list">
        {items.map((c, i) => (
          <section className="cms-panel" key={c.id}>
            <div className="cms-title">
              <div>
                <small>หมวดหมู่ {String(i + 1).padStart(2, "0")}</small>
                <h2>
                  <Link href={`/admin/categories/${c.id}`}>{c.name_th}</Link>
                </h2>
                <span className={`cms-status ${c.status}`}>
                  {CATEGORY_STATUSES[c.status]}
                  {!c.is_enabled ? " · ปิดใช้งาน" : ""}
                </span>
                <small>{c.product_count} สินค้า</small>
              </div>
              <div className="cms-row-actions">
                <button
                  aria-label={`เลื่อน ${c.name_th} ขึ้น`}
                  disabled={pending || i === 0}
                  onClick={() => run(c.id, "up")}
                >
                  ↑
                </button>
                <button
                  aria-label={`เลื่อน ${c.name_th} ลง`}
                  disabled={pending || i === items.length - 1}
                  onClick={() => run(c.id, "down")}
                >
                  ↓
                </button>
                <Link href={`/admin/categories/${c.id}`}>แก้ไข</Link>
                <button
                  disabled={pending}
                  onClick={() => run(c.id, c.status === "published" ? "hide" : "publish")}
                >
                  {c.status === "published" ? "ซ่อน" : "เผยแพร่"}
                </button>
                <button
                  onClick={() => {
                    setDeleting(deleting === c.id ? null : c.id);
                    setDestination("");
                  }}
                >
                  ลบ
                </button>
              </div>
            </div>
            {deleting === c.id && (
              <div className="cms-delete">
                <p>สินค้าทั้งหมด รวมรายการที่เก็บถาวร ต้องมีหมวดหมู่รองรับ</p>
                <label>
                  ย้ายสินค้าไปที่
                  <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                    <option value="">ไม่มีสินค้า / เลือกหมวดหมู่ปลายทาง</option>
                    {items
                      .filter((i) => i.id !== c.id)
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name_th}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  className="cms-danger-link"
                  disabled={pending}
                  onClick={() => run(c.id, "delete")}
                >
                  ยืนยันลบหมวดหมู่
                </button>
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
export function NewsTable({ items }: { items: News[] }) {
  const [state, setState] = useState<ActionState>({}),
    [pending, start] = useTransition(),
    router = useRouter();
  function run(id: string, command: Parameters<typeof newsCommand>[1]) {
    if (command === "archive" && !confirm("เก็บข่าวนี้ถาวร?")) return;
    start(async () => {
      const r = await newsCommand(id, command);
      setState(r);
      if (r.ok) router.refresh();
    });
  }
  return (
    <>
      <Notice state={state} />
      <div className="cms-table-wrap">
        <table className="cms-table">
          <thead>
            <tr>
              <th>หัวข้อ</th>
              <th>วันเผยแพร่</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id}>
                <td>
                  <Link href={`/admin/news/${n.id}`}>{n.title}</Link>
                </td>
                <td>
                  {n.published_at ? new Date(n.published_at).toLocaleDateString("th-TH") : "—"}
                </td>
                <td>
                  {n.deleted_at
                    ? "เก็บถาวร"
                    : n.is_published
                      ? n.published_at && new Date(n.published_at) > new Date()
                        ? "ตั้งเวลา"
                        : "เผยแพร่"
                      : "ฉบับร่าง"}
                </td>
                <td>
                  <div className="cms-row-actions">
                    {n.deleted_at ? (
                      <button disabled={pending} onClick={() => run(n.id, "restore")}>
                        กู้คืน
                      </button>
                    ) : (
                      <>
                        <Link href={`/admin/news/${n.id}`}>แก้ไข</Link>
                        <button
                          disabled={pending}
                          onClick={() => run(n.id, n.is_published ? "hide" : "publish")}
                        >
                          {n.is_published ? "ซ่อน" : "เผยแพร่"}
                        </button>
                        <button disabled={pending} onClick={() => run(n.id, "archive")}>
                          เก็บถาวร
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!items.length && <p className="cms-empty">ยังไม่มีข่าวในรายการนี้</p>}
    </>
  );
}
