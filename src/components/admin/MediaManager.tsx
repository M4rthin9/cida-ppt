"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/vocational/types";
export function MediaManager({
  value,
  onChange,
  initial = [],
  multiple = true,
  label = "รูปภาพ",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  initial?: MediaItem[];
  multiple?: boolean;
  label?: string;
}) {
  const [known, setKnown] = useState<MediaItem[]>(initial),
    [items, setItems] = useState<MediaItem[]>([]),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [progress, setProgress] = useState<number | null>(null),
    [processing, setProcessing] = useState(false),
    [loading, setLoading] = useState(false),
    [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    file = useRef<HTMLInputElement>(null),
    replace = useRef<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/admin/media?q=${encodeURIComponent(q)}&page=${page}`, {
        signal: controller.signal,
      })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setItems(d.items);
          setKnown((k) => [
            ...k,
            ...(d.items as MediaItem[]).filter((i) => !k.some((a) => a.id === i.id)),
          ]);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [open, q, page]);
  function choose(id: string) {
    onChange(
      multiple
        ? value.includes(id)
          ? value.filter((v) => v !== id)
          : [...value, id].slice(0, 20)
        : [id],
    );
    if (!multiple) dialog.current?.close();
  }
  async function upload(files: FileList | File[]) {
    setError("");
    let selected = [...value];
    for (const f of Array.from(files).slice(0, replace.current ? 1 : multiple ? 20 : 1)) {
      if (
        f.size > 10 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(f.type)
      ) {
        setError("รองรับ JPEG, PNG, WebP ขนาดไม่เกิน 10 MB");
        continue;
      }
      setProgress(0);
      setProcessing(false);
      try {
        const item = await new Promise<MediaItem>((resolve, reject) => {
          const xhr = new XMLHttpRequest(),
            data = new FormData();
          data.append("file", f);
          data.append("alt", f.name.replace(/\.[^.]+$/, ""));
          xhr.open("POST", "/api/admin/media");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
              if (e.loaded === e.total) setProcessing(true);
            }
          };
          xhr.onload = () => {
            try {
              const d = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) resolve(d.item);
              else reject(new Error(d.error ?? "อัปโหลดไม่สำเร็จ"));
            } catch {
              reject(new Error("อัปโหลดไม่สำเร็จ"));
            }
          };
          xhr.onerror = () => reject(new Error("การเชื่อมต่อขัดข้อง"));
          xhr.send(data);
        });
        setKnown((k) => [item, ...k]);
        setItems((k) => [item, ...k]);
        selected = replace.current
          ? selected.map((i) => (i === replace.current ? item.id : i))
          : multiple
            ? [...selected, item.id].slice(0, 20)
            : [item.id];
        replace.current = null;
        onChange(selected);
      } catch (e) {
        setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
      }
    }
    setProgress(null);
    setProcessing(false);
    if (file.current) file.current.value = "";
  }
  function move(index: number, step: number) {
    const next = [...value],
      target = index + step;
    if (target < 0 || target >= next.length) return;
    const current = next[index],
      other = next[target];
    if (!current || !other) return;
    next[index] = other;
    next[target] = current;
    onChange(next);
  }
  return (
    <fieldset className="cms-media">
      <legend>{label}</legend>
      <div
        className="cms-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          replace.current = null;
          if (progress === null) void upload(e.dataTransfer.files);
        }}
      >
        <p>ลากภาพมาวาง หรือเลือกไฟล์จากเครื่อง</p>
        <small>JPEG, PNG, WebP · ไม่เกิน 10 MB ต่อภาพ · เก็บภาพต้นฉบับทุกไฟล์</small>
        <div className="cms-actions">
          <button
            type="button"
            disabled={progress !== null}
            onClick={() => {
              replace.current = null;
              file.current?.click();
            }}
          >
            อัปโหลดภาพ
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              dialog.current?.showModal();
            }}
          >
            เลือกจากคลังภาพ
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple && !replace.current}
          className="sr-only"
          aria-label="ไฟล์รูปภาพ"
          onChange={(e) => e.target.files && void upload(e.target.files)}
        />
        {progress !== null && (
          <div role="status">
            <progress max={100} value={progress} />
            <span>{processing ? "กำลังเตรียมภาพ…" : `อัปโหลด ${progress}%`}</span>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="cms-error">
          {error}
        </p>
      )}
      <div className="cms-media-list">
        {value.map((id, i) => {
          const m = known.find((item) => item.id === id);
          return (
            <div className="cms-media-item" key={id}>
              {m ? (
                <Image
                  src={`/media/${m.storage_key}/master.webp`}
                  width={180}
                  height={135}
                  alt={m.alt ?? m.filename}
                  unoptimized
                />
              ) : (
                <span>ภาพที่ {i + 1}</span>
              )}
              <small>{i === 0 && multiple ? "ภาพปก" : `ภาพที่ ${i + 1}`}</small>
              <div className="cms-actions">
                <button
                  type="button"
                  disabled={i === 0}
                  aria-label={`เลื่อนภาพ ${i + 1} ขึ้น`}
                  onClick={() => move(i, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={i === value.length - 1}
                  aria-label={`เลื่อนภาพ ${i + 1} ลง`}
                  onClick={() => move(i, 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  disabled={progress !== null}
                  onClick={() => {
                    replace.current = id;
                    file.current?.click();
                  }}
                >
                  แทนที่
                </button>
                <button type="button" onClick={() => onChange(value.filter((v) => v !== id))}>
                  นำออก
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <dialog
        ref={dialog}
        className="cms-dialog"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="cms-dialog-inner">
          <div className="cms-title">
            <h2>คลังภาพ</h2>
            <button type="button" onClick={() => dialog.current?.close()}>
              ปิด
            </button>
          </div>
          <label>
            ค้นหาภาพ
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {loading ? (
            <p role="status">กำลังโหลด…</p>
          ) : (
            <div className="cms-picker-grid">
              {items.map((m) => (
                <div key={m.id}>
                  <button
                    type="button"
                    className={value.includes(m.id) ? "selected" : ""}
                    aria-pressed={value.includes(m.id)}
                    onClick={() => choose(m.id)}
                  >
                    <Image
                      src={`/media/${m.storage_key}/master.webp`}
                      width={200}
                      height={150}
                      alt={m.alt ?? m.filename}
                      unoptimized
                    />
                    <span>{m.filename}</span>
                  </button>
                  <button
                    type="button"
                    className="cms-danger-link"
                    onClick={async () => {
                      if (!confirm("ลบภาพออกจากคลัง? ภาพที่กำลังใช้งานจะลบไม่ได้")) return;
                      const r = await fetch(`/api/admin/media?id=${m.id}`, { method: "DELETE" }),
                        d = await r.json();
                      if (r.ok) setItems(items.filter((i) => i.id !== m.id));
                      else setError(d.error);
                    }}
                  >
                    ลบจากคลัง
                  </button>
                </div>
              ))}
            </div>
          )}
          {!loading && !items.length && <p>ยังไม่มีรูปภาพที่ตรงกับการค้นหา</p>}
          <div className="cms-actions">
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
              ก่อนหน้า
            </button>
            <span>หน้า {page}</span>
            <button type="button" disabled={items.length < 40} onClick={() => setPage(page + 1)}>
              ถัดไป
            </button>
            <button type="button" onClick={() => dialog.current?.close()}>
              เลือกเรียบร้อย
            </button>
          </div>
        </div>
      </dialog>
    </fieldset>
  );
}
