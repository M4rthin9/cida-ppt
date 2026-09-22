"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { SiteIcon } from "@/components/site/icons";
import { startScrollSequence } from "@/lib/vocational/scroll-player";
import { remap, trackStage } from "@/lib/vocational/scroll-stage";
import type { SequenceManifest } from "@/lib/vocational/sequence";

/**
 * The opening: a full-viewport stage pinned while the page scrolls past it, with
 * the frame sequence scrubbed frame by frame so the motion reads as one
 * continuous shot rather than a set of steps.
 *
 * Two numbers are published onto the stage for CSS to read:
 *
 *  - `--v-progress` — how far through the pinned range the reader is.
 *  - `--v-exit`     — the same thing remapped to the closing stretch, which is
 *                     what softens the last frame into the section below
 *                     instead of cutting to it.
 *
 * Without an imported sequence the same composition renders over the existing
 * captioned concept illustration: no canvas, no player, no frame requests, and
 * the section keeps a single viewport of height so the page never jumps.
 */
export function CinematicHero({ sequence }: { sequence?: SequenceManifest }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = section.current;
    const pinned = stage.current;
    if (!host || !pinned) return;
    const player =
      sequence && canvas.current ? startScrollSequence(canvas.current, sequence) : null;
    const tracker = trackStage(host, pinned, (progress, reduced) => {
      pinned.style.setProperty("--v-progress", progress.toFixed(4));
      // The tail of the scroll blurs and lifts the frame away; see vocational.css.
      // Reduced motion rests on the opening frame, fully sharp.
      pinned.style.setProperty("--v-exit", reduced ? "0" : remap(progress, 0.84, 1).toFixed(4));
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
      className="v-cine"
      data-sequence={sequence ? "on" : "off"}
      aria-label="จากการฝึกฝนสู่โอกาสใหม่"
    >
      <div ref={stage} className="v-cine-stage">
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

        <div className="v-cine-inner">
          <p className="v-cine-badge">
            <span className="v-cine-badge-dot" aria-hidden="true" />
            ฝ่ายฝึกวิชาชีพผู้ต้องขัง
            <small>ทัณฑสถานบำบัดพิเศษกลาง</small>
          </p>
          <h1 className="v-cine-title">
            ฝึกอาชีพ
            <span>สร้างโอกาสใหม่</span>
          </h1>
          <p className="v-cine-lede">
            พื้นที่แห่งการเรียนรู้และพัฒนาทักษะวิชาชีพ ผ่านการลงมือทำจริง
            <br className="v-break-wide" />
            สู่ผลงานที่มีคุณค่าและโอกาสในวันข้างหน้า
          </p>
          <Link className="v-pill v-pill-ghost v-cine-action" href="/products">
            ชมผลิตภัณฑ์ทั้งหมด <SiteIcon name="arrow" />
          </Link>
        </div>

        <div className="v-cine-foot">
          <p className="v-cine-cue" aria-hidden="true">
            <span className="v-cine-cue-rule" />
            เลื่อนเพื่อสำรวจ
          </p>
          {/* The typographic anchor of the opening. It repeats the name already
              in the bar and the badge, so it is decoration to a screen reader
              and hidden from one rather than read out a third time. */}
          <p className="v-cine-wordmark" aria-hidden="true">
            ฝ่ายฝึกวิชาชีพผู้ต้องขัง
          </p>
        </div>
      </div>

      {/* Feathered hand-off: this band scrolls up over the pinned stage at the
          end of the range, so the final frame dissolves into the section below
          rather than meeting it at a hard edge. */}
      <div className="v-cine-seam" aria-hidden="true" />
    </section>
  );
}
