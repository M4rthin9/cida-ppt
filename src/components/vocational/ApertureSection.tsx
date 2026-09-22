"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { SiteIcon } from "@/components/site/icons";
import { startScrollSequence } from "@/lib/vocational/scroll-player";
import { remap, trackStage } from "@/lib/vocational/scroll-stage";
import type { SequenceManifest } from "@/lib/vocational/sequence";
import type { Category } from "@/lib/vocational/types";

/**
 * The second movement. The stage arrives closed on the seam the hero faded
 * into, then opens from the centre line as the reader scrolls — the clip is
 * revealed through a widening aperture rather than sliding in — and the copy
 * settles on the right once there is room for it.
 *
 * Three published numbers:
 *
 *  - `--v-open`  — the aperture, 0 closed to 1 full bleed.
 *  - `--v-focus` — trails the opening; resolves the blur carried over from the
 *                  hero's last frame so the two sections meet softly.
 *  - `--v-copy`  — the right-hand column's presence, held back until the
 *                  aperture is wide and released again before the section
 *                  feathers out into the page below.
 *
 * The rail is seeded category data passed down from the page. Nothing here
 * invents a product, an event or a photograph, and with no imported clip the
 * aperture opens onto the typographic panel instead of stock imagery.
 */
export function ApertureSection({
  sequence,
  categories = [],
}: {
  sequence?: SequenceManifest;
  categories?: Category[];
}) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const rail = categories.slice(0, 4);

  useEffect(() => {
    const host = section.current;
    const pinned = stage.current;
    if (!host || !pinned) return;
    const player =
      sequence && canvas.current ? startScrollSequence(canvas.current, sequence) : null;
    const tracker = trackStage(host, pinned, (progress, reduced) => {
      pinned.style.setProperty("--v-progress", progress.toFixed(4));
      // Reduced motion rests fully open: the aperture is the only thing
      // standing between the reader and this section's content.
      pinned.style.setProperty("--v-open", reduced ? "1" : remap(progress, 0, 0.42).toFixed(4));
      pinned.style.setProperty("--v-focus", reduced ? "1" : remap(progress, 0.08, 0.5).toFixed(4));
      // The column has an envelope, not a fade-in: it arrives once the
      // aperture is wide and leaves again before the closing feather reaches
      // it, so the two never overlap on a narrow screen where the copy sits in
      // the band the feather sweeps through.
      const enter = remap(progress, 0.3, 0.55);
      const leave = remap(progress, 0.9, 1);
      pinned.style.setProperty("--v-copy-in", reduced ? "1" : enter.toFixed(4));
      pinned.style.setProperty("--v-copy", reduced ? "1" : (enter * (1 - leave)).toFixed(4));
      // The scene resolves into the paper the rest of the page is set on, so
      // the stage's bottom edge and the section below it are the same colour
      // by the time the stage unpins.
      pinned.style.setProperty("--v-close", reduced ? "0" : remap(progress, 0.8, 1).toFixed(4));
      // Reduced motion parks the sequence on one frame and downloads no more.
      player?.setPreload(!reduced);
      player?.setProgress(progress);
    });
    return () => {
      tracker.stop();
      player?.stop();
    };
  }, [sequence]);

  return (
    <section
      ref={section}
      className="v-aperture"
      data-sequence={sequence ? "on" : "off"}
      aria-label="งานฝึกวิชาชีพ"
    >
      <div ref={stage} className="v-aperture-stage">
        <div className="v-aperture-shutter" aria-hidden="true">
          <div className="v-aperture-media">
            {sequence ? (
              <canvas ref={canvas} className="v-aperture-canvas" />
            ) : (
              <div className="v-aperture-panel">
                <span>ฝึกฝน</span>
                <span>ลงมือทำ</span>
                <span>ส่งต่อคุณค่า</span>
              </div>
            )}
            <span className="v-aperture-veil" />
          </div>
        </div>
        <span className="v-aperture-seam" aria-hidden="true" />
        <span className="v-aperture-close" aria-hidden="true" />

        <div className="v-aperture-copy">
          <p className="v-eyebrow">FROM PRACTICE TO POSSIBILITY</p>
          <h2>
            จากการฝึกฝน
            <span>สู่ผลงานที่มีคุณค่า</span>
          </h2>
          <p className="v-aperture-lede">
            ทุกชิ้นงานเริ่มจากการเรียนรู้ ฝึกฝนซ้ำแล้วซ้ำเล่า จนกลายเป็นทักษะติดตัว
            และกลายเป็นโอกาสในวันข้างหน้า
          </p>
          {rail.length > 0 && (
            <nav className="v-aperture-rail" aria-label="หมวดงานฝีมือ">
              <ul>
                {rail.map((category) => (
                  <li key={category.id}>
                    <Link href={`/products/category/${category.slug}`}>{category.name_th}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <Link className="v-pill v-pill-solid" href="/vocational">
            เรียนรู้เรื่องงานฝึกวิชาชีพ <SiteIcon name="arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
