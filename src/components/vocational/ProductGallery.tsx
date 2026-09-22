"use client";
import { useState } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/vocational/types";
export function ProductGallery({ items, name }: { items: MediaItem[]; name: string }) {
  const [index, setIndex] = useState(0),
    active = items[index];
  if (!active) return <div className="v-gallery-empty">ยังไม่มีภาพสินค้า</div>;
  return (
    <div className="v-gallery">
      <div className="v-gallery-main">
        <Image
          src={`/media/${active.storage_key}/master.webp`}
          alt={active.alt || name}
          fill
          sizes="(max-width: 900px) 100vw, 55vw"
          priority
        />
        <span>
          {index + 1} / {items.length}
        </span>
      </div>
      {items.length > 1 && (
        <div className="v-gallery-thumbs" role="group" aria-label="เลือกรูปภาพ">
          {items.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setIndex(i)}
              aria-label={`ดูภาพที่ ${i + 1}`}
              aria-pressed={index === i}
            >
              <Image
                src={`/media/${m.storage_key}/master.webp`}
                width={90}
                height={90}
                alt={m.alt || name}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
