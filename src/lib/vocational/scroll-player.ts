const FRAME_COUNT = 150;

/** Zero-based, continuous position. Round only when painting. */
export function frameAt(progress: number): number {
  return Math.max(0, Math.min(1, progress)) * (FRAME_COUNT - 1);
}

export function scrollProgress(top: number, sectionHeight: number, stageHeight: number): number {
  return Math.max(0, Math.min(1, -top / Math.max(1, sectionHeight - stageHeight)));
}

export function startScrollSequence(
  section: HTMLElement,
  canvas: HTMLCanvasElement,
  version: string,
): () => void {
  const context = canvas.getContext("2d");
  const parent = canvas.parentElement;
  if (!context || !parent) return () => {};
  const ctx = context;
  const stage = parent;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const cache = new Map<number, HTMLImageElement>();
  const pending = new Map<number, HTMLImageElement>();
  const fetched = new Set<number>();
  const failures = new Map<number, number>();
  const landmarks = [0, 149, 37, 74, 112];
  const allFrames = Array.from({ length: FRAME_COUNT }, (_, n) => n);
  const memoryBudget = (matchMedia("(max-width: 760px)").matches ? 40 : 80) * 1024 * 1024;
  let capacity = 24;
  let stopped = false;
  let reduced = motion.matches;
  let raf: number | null = null;
  let lastTime = 0;
  let target = 0;
  let current = 0;
  let lastPainted = -1;
  let lastWanted = -1;
  let width = 0;
  let height = 0;
  let dpr = 0;
  let dirty = true;

  function updateTarget() {
    const rect = section.getBoundingClientRect();
    target = reduced ? 0 : frameAt(scrollProgress(rect.top, rect.height, stage.offsetHeight));
    pump();
    schedule();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dirty = true;
    updateTarget();
  }

  function wantedFrames() {
    if (reduced) return [0];
    const wanted = Math.round(current);
    const destination = Math.round(target);
    return [
      wanted,
      destination,
      wanted + 1,
      wanted - 1,
      destination + 1,
      destination - 1,
      wanted + 2,
      wanted - 2,
    ].filter((n) => n >= 0 && n < FRAME_COUNT);
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
      if (!reduced || n === 0) {
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
    img.src = `/frames/frame-${String(n + 1).padStart(3, "0")}.png?v=${encodeURIComponent(version)}`;
  }

  function pump() {
    if (stopped) return;
    // Prioritize the current scroll position over background preloading.
    // All frames are fetched progressively, with a bounded decoded image cache.
    const demand = wantedFrames().slice(0, Math.max(2, capacity - 1));
    const background = reduced ? [] : [...landmarks, ...allFrames].filter((n) => !fetched.has(n));
    for (const n of new Set([...demand, ...background])) {
      if (pending.size >= (reduced ? 1 : 3)) break;
      if (cache.has(n) || pending.has(n) || (failures.get(n) ?? 0) >= 2) continue;
      load(n);
    }
  }

  function paint() {
    let best: number | undefined;
    for (const n of cache.keys()) {
      if (reduced && n !== 0) continue;
      if (best === undefined || Math.abs(n - current) < Math.abs(best - current)) best = n;
    }
    if (best === undefined || width <= 0 || height <= 0) return;
    if (!dirty && best === lastPainted && dpr === devicePixelRatio) return;
    const img = cache.get(best);
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
    lastPainted = best;
    dirty = false;
    canvas.dataset.frame = String(best + 1);
    canvas.dataset.ready = "true";
  }

  function tick(time: number) {
    raf = null;
    if (stopped) return;
    // Time normalizes easing for different refresh rates; only scrolling moves target.
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 1000 / 60;
    lastTime = time;
    current = reduced ? 0 : current + (target - current) * (1 - Math.exp(-elapsed / 85));
    if (Math.abs(target - current) < 0.01) current = target;
    const wanted = Math.round(current);
    if (wanted !== lastWanted) {
      lastWanted = wanted;
      pump();
    }
    paint();
    // Keep checking after settling, including when frames finish decoding later.
    if (!reduced && !document.hidden) schedule();
  }

  function schedule() {
    if (!stopped && raf === null && !document.hidden) raf = requestAnimationFrame(tick);
  }

  function changeMotion() {
    reduced = motion.matches;
    current = 0;
    lastTime = 0;
    lastWanted = -1;
    lastPainted = -1;
    // In-flight requests may finish; no further sequence preloads in reduce mode.
    if (reduced) {
      for (const n of cache.keys()) if (n !== 0) cache.delete(n);
      delete canvas.dataset.ready;
    }
    resize();
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
  observer.observe(section);
  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", resize);
  window.addEventListener("pageshow", resize);
  document.addEventListener("visibilitychange", visibility);
  motion.addEventListener("change", changeMotion);
  resize();
  // Scroll restoration and deep links start at their actual position.
  current = target;
  schedule();

  return () => {
    stopped = true;
    if (raf !== null) cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener("scroll", updateTarget);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pageshow", resize);
    document.removeEventListener("visibilitychange", visibility);
    motion.removeEventListener("change", changeMotion);
    for (const img of pending.values()) {
      img.onload = null;
      img.onerror = null;
      img.removeAttribute("src");
    }
    pending.clear();
    cache.clear();
    delete canvas.dataset.ready;
  };
}
