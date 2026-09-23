"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { SiteIcon } from "@/components/site/icons";
import { startScrollSequence } from "@/lib/vocational/scroll-player";
import { band, remap, trackStage } from "@/lib/vocational/scroll-stage";
import type { SequenceManifest } from "@/lib/vocational/sequence";
import type { Category } from "@/lib/vocational/types";

/**
 * The second movement, and the page's argument.
 *
 * The hero says what this is. This section says how it happens, and it says it
 * as a sequence rather than a screenful: the stage arrives closed on the seam
 * the hero faded into, parts from the centre line, and reveals three stages of
 * the craft that light one at a time as the reader scrolls. The eyebrow calls
 * that journey FROM PRACTICE TO POSSIBILITY; the panel is that journey, made
 * literal, and the column on the right resolves it.
 *
 * Earlier the whole section finished in its first half: the aperture was fully
 * open and all five blocks of the column had landed by 45%, leaving the
 * remaining 55% of its scroll with nothing left to do. Every number below is
 * spread so that something is always resolving.
 *
 *  - `--v-open`       the aperture, 0 closed to 1 full bleed
 *  - `--v-focus`      trails the opening; resolves the blur carried over from
 *                     the hero's last frame so the two sections meet softly
 *  - `--v-w1/2/3`     the three stages of the craft, lit in turn
 *  - `--v-copy-1/2/3` the column, arriving in three beats rather than as a
 *                     block: the statement, then the reasoning, then the way in
 *  - `--v-copy`       the column's departure, held back until the very end
 *  - `--v-close`      the feather that resolves the stage into the paper the
 *                     rest of the page is set on
 *
 * It is also the same shot as the first movement, not a new one. `still` is
 * the hero's final frame, so the aperture parts on the place the hero just
 * arrived at and brings it into focus: the blur the hero exits on is the blur
 * this section resolves. The three words then name the stages of the craft
 * over the room where they actually happen, which is what ties the two
 * movements together rather than leaving them two sections that share a
 * background colour.
 *
 * The rail is seeded category data passed down from the page. Nothing here
 * invents a product, an event or a photograph: the only image it can show is
 * one the hero already imported, and with no frames at all it falls back to
 * type on its own ground.
 */
export function ApertureSection({
  sequence,
  still,
  categories = [],
}: {
  sequence?: SequenceManifest;
  /** The hero's last frame, so this movement opens where that one ended. */
  still?: string;
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
    const set = (name: string, value: number) => pinned.style.setProperty(name, value.toFixed(4));
    const tracker = trackStage(host, pinned, (progress, reduced) => {
      set("--v-progress", progress);
      // Reduced motion rests fully open: the aperture is the only thing
      // standing between the reader and this section's content.
      set("--v-open", reduced ? 1 : remap(progress, 0, 0.3));
      set("--v-focus", reduced ? 1 : remap(progress, 0.06, 0.38));
      // The light travels down the three stages of the craft. A word that has
      // had its turn steps back rather than leaving, so the whole argument
      // stays on screen and only the emphasis moves.
      set("--v-w1", reduced ? 1 : band(progress, 0.12, 0.46, 0.07));
      set("--v-w2", reduced ? 1 : band(progress, 0.42, 0.7, 0.07));
      set("--v-w3", reduced ? 1 : band(progress, 0.66, 0.95, 0.07));
      // The column answers the panel in three beats, interleaved with it, so
      // neither side of the frame is ever the only thing happening.
      const leave = remap(progress, 0.9, 1);
      set("--v-copy", reduced ? 1 : 1 - leave);
      set("--v-copy-in", reduced ? 1 : remap(progress, 0.34, 0.48));
      set("--v-copy-1", reduced ? 1 : remap(progress, 0.34, 0.48));
      set("--v-copy-2", reduced ? 1 : remap(progress, 0.46, 0.6));
      set("--v-copy-3", reduced ? 1 : remap(progress, 0.58, 0.72));
      // The scene resolves into the paper the rest of the page is set on, so
      // the stage's bottom edge and the section below it are the same colour
      // by the time the stage unpins.
      set("--v-close", reduced ? 0 : remap(progress, 0.86, 1));
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
          {/* With a clip imported the aperture reveals footage, dimmed and
              veiled so the column keeps its contrast. Without one it reveals
              the three stages of the craft, and those are type: they carry
              their own ground and stay out of the footage's dials, or the lit
              word tops out at half the brightness it asks for. */}
          {sequence ? (
            <div className="v-aperture-media">
              <canvas ref={canvas} className="v-aperture-canvas" />
              <span className="v-aperture-veil" />
            </div>
          ) : (
            still && (
              <div className="v-aperture-media">
                <Image className="v-aperture-still" src={still} alt="" fill sizes="100vw" />
                <span className="v-aperture-veil" />
              </div>
            )
          )}
          {!sequence && (
            <p className="v-aperture-panel" data-ground={still ? "still" : "type"}>
              <span>ฝึกฝน</span>
              <span>ลงมือทำ</span>
              <span>ส่งต่อคุณค่า</span>
            </p>
          )}
        </div>
        <span className="v-aperture-seam" aria-hidden="true" />
        <span className="v-aperture-close" aria-hidden="true" />

        <div className="v-aperture-copy">
          <p className="v-eyebrow" data-k="1">
            FROM PRACTICE TO POSSIBILITY
          </p>
          <h2 data-k="1">
            จากการฝึกฝน
            <span>สู่ผลงานที่มีคุณค่า</span>
          </h2>
          <p className="v-aperture-lede" data-k="2">
            ทุกชิ้นงานเริ่มจากการเรียนรู้ ฝึกฝนซ้ำแล้วซ้ำเล่า จนกลายเป็นทักษะติดตัว
            และกลายเป็นโอกาสในวันข้างหน้า
          </p>
          {rail.length > 0 && (
            <nav className="v-aperture-rail" aria-label="หมวดงานฝีมือ" data-k="3">
              <ul>
                {rail.map((category) => (
                  <li key={category.id}>
                    <Link href={`/products/category/${category.slug}`}>{category.name_th}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <Link className="v-pill v-pill-solid" href="/vocational" data-k="3">
            เรียนรู้เรื่องงานฝึกวิชาชีพ <SiteIcon name="arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
