"use client";
import { useState } from "react";
import { ProductImage } from "@/components/media/product-image";
import type { MediaItem } from "@/lib/vocational/types";
export function ProductGallery({ items, name }: { items: MediaItem[]; name: string }) {
  const [index, setIndex] = useState(0),
    active = items[index];
  if (!active)
    return (
      <div className="v-gallery-empty">
        <ProductImage alt={name} sizes="(max-width: 900px) 90vw, 50vw" />
      </div>
    );
  return (
    <div className="v-gallery">
      <div className="v-gallery-main">
        <ProductImage
          src={`/media/${active.storage_key}/master.webp`}
          alt={active.alt || name}
          sizes="(max-width: 900px) 100vw, 55vw"
          preload
        />
        <span className="v-gallery-counter" aria-live="polite">
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
              <ProductImage
                src={`/media/${m.storage_key}/master.webp`}
                sizes="72px"
                alt={m.alt || name}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
