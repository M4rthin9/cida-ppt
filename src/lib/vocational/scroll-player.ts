import { frameUrl, type SequenceManifest } from "./sequence";

/**
 * Scroll-scrubbed frame sequence.
 *
 * The player owns decoding, caching and painting; it does not listen to the
 * page. Whoever mounted it feeds progress in through `setProgress`, which is
 * what lets the hero and the reveal section run their own sequences of
 * different lengths from a single scroll listener each (see scroll-stage.ts).
 *
 * Frames arrive out of order and some may never arrive at all, so the canvas
 * always paints the nearest frame it actually holds rather than blanking while
 * it waits for the exact one.
 *
 * A reader who has asked for reduced motion gets a single frame and is charged
 * for a single frame: `setPreload(false)` parks the player on the opening image
 * and stops it fetching a sequence that will never play.
 */

/** Zero-based, continuous position. Round only when painting. */
export function frameAt(progress: number, count: number): number {
  return Math.max(0, Math.min(1, progress)) * Math.max(0, count - 1);
}

/** Evenly spaced anchors, so a long scrub has something to show before it fills in. */
export function landmarksFor(count: number): number[] {
  const anchors = [0, count - 1];
  for (let step = 1; step < 4; step++) anchors.push(Math.round((count - 1) * (step / 4)));
  return [...new Set(anchors)].filter((frame) => frame >= 0 && frame < count);
}

export type SequencePlayer = {
  setProgress: (progress: number) => void;
  /** False parks on the opening frame and downloads nothing else. */
  setPreload: (enabled: boolean) => void;
  stop: () => void;
};

export function startScrollSequence(
  canvas: HTMLCanvasElement,
  manifest: SequenceManifest,
  options: { onFrame?: (frame: number) => void } = {},
): SequencePlayer {
  const context = canvas.getContext("2d");
  if (!context) return { setProgress: () => {}, setPreload: () => {}, stop: () => {} };
  const ctx = context;
  const count = manifest.count;
  const cache = new Map<number, HTMLImageElement>();
  const pending = new Map<number, HTMLImageElement>();
  const fetched = new Set<number>();
  const failures = new Map<number, number>();
  const landmarks = landmarksFor(count);
  const allFrames = Array.from({ length: count }, (_, n) => n);
  const memoryBudget = (matchMedia("(max-width: 760px)").matches ? 40 : 80) * 1024 * 1024;
  let capacity = 24;
  // Assume the reader's stated preference until the stage says otherwise, so
  // the very first pump does not fetch a sequence that will never play.
  let preload = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stopped = false;
  let raf: number | null = null;
  let lastTime = 0;
  let target = 0;
  let current = 0;
  let lastPainted = -1;
  let lastKey = "";
  let lastWanted = -1;
  let width = 0;
  let height = 0;
  let dpr = 0;
  let dirty = true;

  /**
   * The pair on screen first (a blend needs both), then every frame on the way
   * to where the scroll is heading and a few past it, then a couple behind in
   * case the reader turns round. Fetching only around the current frame meant
   * a quick flick outran the cache and painted a stale frame until it caught up.
   */
  function wantedFrames() {
    if (!preload) return [0];
    const from = Math.floor(current);
    const to = Math.round(target);
    const step = to >= from ? 1 : -1;
    const frames = [from, from + 1];
    for (let n = from; n !== to + step * 5; n += step) frames.push(n);
    frames.push(from - step, from - step * 2);
    return [...new Set(frames)].filter((n) => n >= 0 && n < count);
  }

  function trimCache() {
    const priority = new Set(wantedFrames().slice(0, 2));
    priority.add(lastPainted);
    const distance = (n: number) => Math.min(Math.abs(n - current), Math.abs(n - target));
    for (const n of [...cache.keys()].sort((a, b) => distance(b) - distance(a))) {
      if (cache.size <= capacity) break;
      if (!priority.has(n)) cache.delete(n);
    }
  }

  function load(n: number) {
    const source = frameUrl(manifest, n);
    if (!source) return;
    const img = new Image();
    img.decoding = "async";
    pending.set(n, img);
    const failed = () => {
      if (stopped) return;
      pending.delete(n);
      // Retry once, then retain the closest valid frame without blanking the canvas.
      failures.set(n, (failures.get(n) ?? 0) + 1);
      pump();
    };
    img.onerror = failed;
    img.onload = async () => {
      try {
        await img.decode();
      } catch {
        failed();
        return;
      }
      if (stopped) return;
      pending.delete(n);
      if (!img.naturalWidth || !img.naturalHeight) {
        failed();
        return;
      }
      fetched.add(n);
      if (preload || n === 0) {
        capacity = Math.max(
          4,
          Math.min(24, Math.floor(memoryBudget / (img.naturalWidth * img.naturalHeight * 4))),
        );
        cache.set(n, img);
        trimCache();
        dirty = true;
        schedule();
      }
      pump();
    };
    img.src = source;
  }

  function pump() {
    if (stopped) return;
    // Prioritize the current scroll position over background preloading.
    // All frames are fetched progressively, with a bounded decoded image cache.
    const demand = wantedFrames().slice(0, Math.max(2, capacity - 1));
    const background = preload ? [...landmarks, ...allFrames].filter((n) => !fetched.has(n)) : [];
    for (const n of new Set([...demand, ...background])) {
      if (pending.size >= (preload ? 3 : 1)) break;
      if (cache.has(n) || pending.has(n) || (failures.get(n) ?? 0) >= 2) continue;
      load(n);
    }
  }

  function paint() {
    if (width <= 0 || height <= 0) return;
    // Between two frames, show both: the next one laid over this one at the
    // fraction of the way the scroll has travelled. The motion then moves
    // continuously instead of stepping a whole frame at a time.
    const lo = Math.floor(current);
    const hi = Math.min(count - 1, lo + 1);
    let base: number | undefined;
    let over = -1;
    let mix = 0;
    if (preload && hi > lo && cache.has(lo) && cache.has(hi)) {
      base = lo;
      over = hi;
      mix = Math.round((current - lo) * 32) / 32;
    } else {
      for (const n of cache.keys()) {
        if (!preload && n !== 0) continue;
        if (base === undefined || Math.abs(n - current) < Math.abs(base - current)) base = n;
      }
    }
    if (base === undefined) return;
    const key = `${base}:${over}:${mix}`;
    if (!dirty && key === lastKey && dpr === devicePixelRatio) return;
    const img = cache.get(base);
    const top = over >= 0 && mix > 0 ? cache.get(over) : undefined;
    if (!img) return;
    dpr = devicePixelRatio || 1;
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));
    // Resize and paint together; changing the backing buffer clears its contents.
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    if (top) {
      ctx.globalAlpha = mix;
      ctx.drawImage(top, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    }
    // The frame the reader mostly sees, for the cache and for anyone watching.
    const shown = top && mix >= 0.5 ? over : base;
    lastPainted = shown;
    lastKey = key;
    dirty = false;
    canvas.dataset.frame = String(shown + 1);
    canvas.dataset.ready = "true";
    options.onFrame?.(shown + 1);
  }

  function tick(time: number) {
    raf = null;
    if (stopped) return;
    // Time normalizes easing for different refresh rates; only scrolling moves target.
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 1000 / 60;
    lastTime = time;
    current = preload ? current + (target - current) * (1 - Math.exp(-elapsed / 85)) : 0;
    if (Math.abs(target - current) < 0.01) current = target;
    const wanted = Math.round(current);
    if (wanted !== lastWanted) {
      lastWanted = wanted;
      pump();
    }
    paint();
    // Keep checking after settling, including when frames finish decoding later.
    if (!document.hidden) schedule();
  }

  function schedule() {
    if (!stopped && raf === null && !document.hidden) raf = requestAnimationFrame(tick);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dirty = true;
    pump();
    schedule();
  }

  function visibility() {
    if (document.hidden) {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    } else {
      lastTime = 0;
      resize();
    }
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  document.addEventListener("visibilitychange", visibility);
  resize();

  return {
    setProgress(progress: number) {
      // A whole frame to rest on, so a paused scroll shows one crisp image;
      // the easing in `tick` blends through the frames on the way to it.
      target = preload ? Math.round(frameAt(progress, count)) : 0;
      pump();
      schedule();
    },
    setPreload(enabled: boolean) {
      if (enabled === preload) return;
      preload = enabled;
      // Leaving reduced motion restarts from the opening frame rather than
      // jumping to wherever the reader happens to be standing.
      lastTime = 0;
      lastWanted = -1;
      lastPainted = -1;
      lastKey = "";
      if (!enabled) {
        target = 0;
        current = 0;
        for (const n of cache.keys()) if (n !== 0) cache.delete(n);
        delete canvas.dataset.ready;
      }
      dirty = true;
      pump();
      schedule();
    },
    stop() {
      stopped = true;
      if (raf !== null) cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      for (const img of pending.values()) {
        img.onload = null;
        img.onerror = null;
        img.removeAttribute("src");
      }
      pending.clear();
      cache.clear();
      delete canvas.dataset.ready;
    },
  };
}
