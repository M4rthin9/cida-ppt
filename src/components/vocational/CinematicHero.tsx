"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { SiteIcon } from "@/components/site/icons";
import { startScrollSequence } from "@/lib/vocational/scroll-player";
import { band, remap, trackStage } from "@/lib/vocational/scroll-stage";
import type { SequenceManifest } from "@/lib/vocational/sequence";

/**
 * The opening, scored rather than stacked.
 *
 * One pinned viewport, 150 frames scrubbed under the reader's own hand, and the
 * copy spread ALONG that scrub instead of piled on top of it. Earlier the badge,
 * the headline, the lede, the button, a scroll cue and a full-width wordmark all
 * sat on frame one together and left together; six blocks competing for the same
 * frame is what made the opening read as noise.
 *
 * Now each act owns a stretch of the range and hands over before the next one
 * arrives, so the frame carries one thought at a time:
 *
 *   0.00 - 0.24  the title card: badge, headline, the one action
 *   0.24 - 0.74  the lede, as three timed captions on the lower third
 *   0.76 - 0.90  the wordmark alone, centre frame. This is the peak
 *   0.90 - 1.00  the hand-off into the section below
 *
 * Each act publishes one number for CSS to read, all of them 0-1:
 *
 *  - `--v-progress`  raw position through the pinned range
 *  - `--v-title`     the title card's presence
 *  - `--v-c1/2/3`    each caption's window (see `band`)
 *  - `--v-mark`      the wordmark resolving
 *  - `--v-exit`      the closing stretch that softens the last frame away
 *
 * Without an imported sequence, or for a reader who has asked for reduced
 * motion, there is no timeline to run: `data-static` lays the same composition
 * out as one readable screen with every line present, no canvas, no frame
 * requests, and no reserved scroll for a scrub that will never happen.
 */
export function CinematicHero({ sequence }: { sequence?: SequenceManifest }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = section.current;
    const pinned = stage.current;
    // Captured rather than read through the ref in the cleanup, which runs
    // after React may already have swapped the node out.
    const titleCard = card.current;
    if (!host || !pinned) return;
    const player =
      sequence && canvas.current ? startScrollSequence(canvas.current, sequence) : null;
    const set = (name: string, value: number) => pinned.style.setProperty(name, value.toFixed(4));
    const tracker = trackStage(host, pinned, (progress, reduced) => {
      // No sequence and no motion are the same situation for the copy: there is
      // no scrub to spread it along, so every line is simply present at once.
      const still = reduced || !sequence;
      pinned.dataset.static = still ? "on" : "off";
      set("--v-progress", progress);
      set("--v-title", still ? 1 : 1 - remap(progress, 0.12, 0.24));
      set("--v-c1", still ? 1 : band(progress, 0.24, 0.4));
      set("--v-c2", still ? 1 : band(progress, 0.42, 0.58));
      set("--v-c3", still ? 1 : band(progress, 0.6, 0.74));
      set("--v-mark", still ? 1 : remap(progress, 0.76, 0.88));
      set("--v-exit", still ? 0 : remap(progress, 0.9, 1));
      // A faded card still answers the keyboard and the pointer, so the one
      // action on the page would be reachable while invisible. Inert, not
      // pointer-events, because focus order matters as much as clicks here.
      titleCard?.toggleAttribute("inert", !still && progress > 0.26);
      // Reduced motion parks the sequence on one frame and downloads no more.
      player?.setPreload(!reduced);
      player?.setProgress(progress);
    });
    return () => {
      tracker.stop();
      player?.stop();
      titleCard?.removeAttribute("inert");
    };
  }, [sequence]);

  return (
    <section
      ref={section}
      className="v-cine"
      data-sequence={sequence ? "on" : "off"}
      aria-label="จากการฝึกฝนสู่โอกาสใหม่"
    >
      <div ref={stage} className="v-cine-stage" data-static={sequence ? "off" : "on"}>
        <div className="v-cine-media" aria-hidden="true">
          {sequence ? (
            <canvas ref={canvas} className="v-cine-canvas" />
          ) : (
            <Image
              className="v-cine-still"
              src="/images/craft-hero.webp"
              alt=""
              fill
              sizes="100vw"
              priority
            />
          )}
          <span className="v-cine-veil" />
          <span className="v-cine-vignette" />
        </div>

        {/* Readability, not decoration. The sequence runs from a dark wall to a
            bright sunlit workshop, so a fixed veil is either too heavy for the
            dark frames or too light for the bright ones. This is a soft pool of
            shade under the copy alone: no edge, no box, and the frame's own
            corners stay open. */}
        <span className="v-cine-scrim" aria-hidden="true" />

        {/* Act one. The badge, the headline and the one action, and nothing
            else: the lede left this card and became the captions below. */}
        <div ref={card} className="v-cine-inner">
          <p className="v-cine-badge">
            <span className="v-cine-badge-dot" aria-hidden="true" />
            ฝ่ายฝึกวิชาชีพผู้ต้องขัง
            <small>ทัณฑสถานบำบัดพิเศษกลาง</small>
          </p>
          <h1 className="v-cine-title">
            ฝึกอาชีพ
            <span>สร้างโอกาสใหม่</span>
          </h1>
          <Link className="v-pill v-pill-ghost v-cine-action" href="/products">
            ชมผลิตภัณฑ์ทั้งหมด <SiteIcon name="arrow" />
          </Link>
        </div>

        {/* The same lede, unchanged as a sentence: one paragraph, three
            clauses, read in order. With the scrub running they are three
            lower-third captions that hand over one at a time; standing still
            they are three lines of one paragraph. No copy is duplicated and
            none of it is decoration. */}
        <p className="v-cine-lede">
          <span>พื้นที่แห่งการเรียนรู้และพัฒนาทักษะวิชาชีพ</span>
          <span>ผ่านการลงมือทำจริง</span>
          <span>สู่ผลงานที่มีคุณค่าและโอกาสในวันข้างหน้า</span>
        </p>

        {/* The peak: the last act clears the frame of everything else and
            resolves on the name alone, centre, at the width of the shot. It
            repeats the name already in the bar and the badge, so it is
            decoration to a screen reader rather than a third reading. */}
        <p className="v-cine-wordmark" aria-hidden="true">
          ฝ่ายฝึกวิชาชีพผู้ต้องขัง
        </p>
      </div>

      {/* Feathered hand-off: this band scrolls up over the pinned stage at the
          end of the range, so the final frame dissolves into the section below
          rather than meeting it at a hard edge. */}
      <div className="v-cine-seam" aria-hidden="true" />
    </section>
  );
}
