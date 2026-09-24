"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { SiteIcon } from "@/components/site/icons";
import { startScrollSequence } from "@/lib/vocational/scroll-player";
import { band, remap, trackStage } from "@/lib/vocational/scroll-stage";
import type { SequenceManifest } from "@/lib/vocational/sequence";
import type { SettingValue } from "@/lib/settings/registry";
import { splitLines } from "./Lines";

/**
 * The opening, scored rather than stacked.
 *
 * One pinned viewport, the phase-1 frames scrubbed under the reader's own hand, and the
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
 *   0.74 - 0.95  the wordmark alone, centre frame. This is the peak
 *   0.88 - 1.00  the last scrims clear, so the last frame arrives clean
 *
 * The frames run the whole range without stopping. The last one is also the
 * reveal's first, the reveal overlaps the end of this section by one screen,
 * and both sections spend the same scroll on each frame (see the heights in
 * vocational.css). When this stage would start to scroll away, the reveal's
 * stage is already pinned over it on the same image and carries on at the
 * same pace, so the two sequences play as one shot.
 *
 * Each act publishes one number for CSS to read, all of them 0-1:
 *
 *  - `--v-progress`  raw position through the pinned range
 *  - `--v-title`     the title card's presence
 *  - `--v-c1/2/3`    each caption's window (see `band`)
 *  - `--v-mark`      the wordmark resolving
 *  - `--v-exit`      the closing stretch that clears the scrims off the last frame
 *
 * Without an imported sequence, or for a reader who has asked for reduced
 * motion, there is no timeline to run: `data-static` lays the same composition
 * out as one readable screen with every line present, no canvas, no frame
 * requests, and no reserved scroll for a scrub that will never happen.
 */
export function CinematicHero({
  sequence,
  copy,
}: {
  sequence?: SequenceManifest;
  copy: SettingValue<"home">;
}) {
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
      set("--v-mark", still ? 1 : band(progress, 0.74, 0.95, 0.07));
      set("--v-exit", still ? 0 : remap(progress, 0.88, 1));
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

  // The scroll choreography times exactly three captions.
  const lede = splitLines(copy.heroLede).slice(0, 3);
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
            {copy.heroBadge}
            {copy.heroBadgeNote && <small>{copy.heroBadgeNote}</small>}
          </p>
          <h1 className="v-cine-title">
            {copy.heroTitle}
            {copy.heroTitleAccent && <span>{copy.heroTitleAccent}</span>}
          </h1>
          <Link className="v-pill v-pill-ghost v-cine-action" href="/products">
            {copy.heroCta} <SiteIcon name="arrow" />
          </Link>
        </div>

        {/* The same lede, unchanged as a sentence: one paragraph, three
            clauses, read in order. With the scrub running they are three
            lower-third captions that hand over one at a time; standing still
            they are three lines of one paragraph. No copy is duplicated and
            none of it is decoration. */}
        {lede.length > 0 && (
          <p className="v-cine-lede">
            {lede.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </p>
        )}

        {/* The peak: the last act clears the frame of everything else and
            resolves on the name alone, centre, at the width of the shot. It
            repeats the name already in the bar and the badge, so it is
            decoration to a screen reader rather than a third reading. */}
        {copy.heroWordmark && (
          <p className="v-cine-wordmark" aria-hidden="true">
            {copy.heroWordmark}
          </p>
        )}
      </div>

      {/* Feathered hand-off: this band scrolls up over the pinned stage at the
          end of the range, so the final frame dissolves into the section below
          rather than meeting it at a hard edge. */}
      <div className="v-cine-seam" aria-hidden="true" />
    </section>
  );
}
