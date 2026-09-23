/**
 * One scroll listener per pinned section.
 *
 * Both scroll-driven effects on the homepage — the frame sequence and the
 * aperture that opens the second section — read the same number: how far the
 * section has travelled through its own pinned range. Keeping that in one place
 * means a section without frames still animates, and a section with frames does
 * not register a second listener to compute a value it already has.
 */

/** 0 at the moment the stage pins, 1 when the section has finished scrolling past. */
export function scrollProgress(top: number, sectionHeight: number, stageHeight: number): number {
  return Math.max(0, Math.min(1, -top / Math.max(1, sectionHeight - stageHeight)));
}

/**
 * Rescale a slice of the range to a full 0-1, so a stage can drive several
 * effects that each own a different stretch of the same scroll — the copy
 * settling early, the frame blurring away at the very end.
 */
export function remap(progress: number, start: number, end: number): number {
  if (!(end > start)) return progress >= end ? 1 : 0;
  return Math.max(0, Math.min(1, (progress - start) / (end - start)));
}

/**
 * A caption's window: 0 before it, 1 while it holds, 0 again after, with
 * `feather` of the range spent on each edge. Several captions can share one
 * scrub this way and still never be on screen together, which is the whole
 * point: one frame carries one line.
 */
export function band(progress: number, start: number, end: number, feather = 0.035): number {
  return Math.min(remap(progress, start, start + feather), 1 - remap(progress, end - feather, end));
}

export type StageTracker = {
  /** Current raw progress, for a subscriber that attaches after the first read. */
  progress: () => number;
  stop: () => void;
};

export function trackStage(
  section: HTMLElement,
  stage: HTMLElement,
  onProgress: (progress: number, reduced: boolean) => void,
): StageTracker {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motion.matches;
  let current = 0;
  let stopped = false;
  let pendingMotion = false;

  function measure() {
    if (stopped) return;
    const rect = section.getBoundingClientRect();
    // Reduced motion pins the reader at the start of the range; each stage
    // decides for itself what its resting state is, because "no motion" means
    // the opening frame for the hero but a fully open aperture for a section
    // whose content would otherwise never be revealed.
    const next = reduced ? 0 : scrollProgress(rect.top, rect.height, stage.offsetHeight);
    if (next === current && !pendingMotion) return;
    pendingMotion = false;
    current = next;
    onProgress(current, reduced);
  }

  function changeMotion() {
    reduced = motion.matches;
    pendingMotion = true;
    measure();
  }

  const observer = new ResizeObserver(measure);
  observer.observe(section);
  observer.observe(stage);
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("pageshow", measure);
  motion.addEventListener("change", changeMotion);
  // Scroll restoration and deep links start at their real position, not at zero.
  pendingMotion = true;
  measure();

  return {
    progress: () => Math.max(0, current),
    stop() {
      stopped = true;
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      motion.removeEventListener("change", changeMotion);
    },
  };
}
