/** Progressive decoration: content and native scrolling work without this module. */
const REVEALS = [
  ".v-section-heading",
  ".v-bento > a",
  ".v-story > div:first-child",
  ".v-story li",
  ".v-product-card",
  ".v-news-card",
  ".v-featured-empty",
  ".v-closing > *",
  ".v-page-title",
  ".v-story-hero > *",
  ".v-story-intro > *",
  ".v-category-hero > *",
  ".v-product-detail-info > *",
  ".v-contact-layout > *",
  ".v-footer-main > div",
].join(",");
const SURFACES = [
  ".v-cine-stage",
  ".v-bento-card",
  ".v-bento-note",
  ".v-product-image",
  ".v-news-image",
  ".v-closing",
  ".v-button",
  ".v-pill",
].join(",");
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function startVisualEffects(root: HTMLElement): () => void {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  let stop = () => {};

  function configure() {
    stop();
    if (motion.matches) return;
    const elements = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();
    const groups = new Map<Element, number>();
    let active: HTMLElement | null = null;
    let point: { x: number; y: number } | null = null;
    let frame = 0;
    let refreshFrame = 0;

    function reveal(element: HTMLElement, immediate = false) {
      observer?.unobserve(element);
      element.dataset.vReveal = "visible";
      if (immediate) {
        animations.get(element)?.cancel();
        animations.delete(element);
        return;
      }
      const parent = element.parentElement;
      const index = parent ? (groups.get(parent) ?? 0) : 0;
      if (parent) groups.set(parent, index + 1);
      const animation = element.animate(
        [
          { opacity: 0, transform: "translateY(26px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 1000, delay: Math.min(index % 4, 3) * 85, easing: EASE, fill: "backwards" },
      );
      animations.set(element, animation);
      animation.onfinish = () => animations.delete(element);
    }

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              groups.clear();
              for (const entry of entries) {
                if (entry.isIntersecting) reveal(entry.target as HTMLElement);
              }
            },
            { rootMargin: "0px 0px -5% 0px", threshold: 0 },
          );

    function prepare() {
      refreshFrame = 0;
      if (!observer) return;
      for (const element of root.querySelectorAll<HTMLElement>(REVEALS)) {
        if (elements.has(element)) continue;
        elements.add(element);
        // Never hide a heading already being read, including restored scroll positions.
        if (element.getBoundingClientRect().top < window.innerHeight * 0.95) {
          element.dataset.vReveal = "visible";
        } else {
          element.dataset.vReveal = "pending";
          observer.observe(element);
        }
      }
    }

    function resetSurface() {
      if (!active) return;
      delete active.dataset.vHover;
      active.style.removeProperty("--v-tilt-x");
      active.style.removeProperty("--v-tilt-y");
      active.style.removeProperty("--v-magnet-x");
      active.style.removeProperty("--v-magnet-y");
      active = null;
    }

    function paintPointer() {
      frame = 0;
      if (!active || !point) return;
      const rect = active.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (point.x - rect.left) / Math.max(1, rect.width)));
      const y = Math.max(0, Math.min(1, (point.y - rect.top) / Math.max(1, rect.height)));
      active.style.setProperty("--v-light-x", `${(x * 100).toFixed(2)}%`);
      active.style.setProperty("--v-light-y", `${(y * 100).toFixed(2)}%`);
      active.style.setProperty("--v-tilt-x", `${((0.5 - y) * 2.4).toFixed(2)}deg`);
      active.style.setProperty("--v-tilt-y", `${((x - 0.5) * 2.4).toFixed(2)}deg`);
      active.style.setProperty("--v-magnet-x", `${((x - 0.5) * 7).toFixed(2)}px`);
      active.style.setProperty("--v-magnet-y", `${((y - 0.5) * 5).toFixed(2)}px`);
      active.dataset.vHover = "on";
    }

    function move(event: PointerEvent) {
      if (!pointer.matches || event.pointerType !== "mouse") return;
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>(SURFACES) : null;
      const next = target && root.contains(target) ? target : null;
      if (next !== active) {
        resetSurface();
        active = next;
      }
      if (!active) return;
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paintPointer);
    }

    function focus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-v-reveal]");
      if (element) reveal(element, true);
      // A keyboard user can reach the hero action during its entrance delay.
      const action = event.target.closest<HTMLElement>(".v-cine-action");
      if (action) {
        animations.get(action)?.cancel();
        animations.delete(action);
      }
    }

    prepare();
    // Account for streamed sections and catalog updates that keep the same pathname.
    const mutations = new MutationObserver(() => {
      if (!refreshFrame) refreshFrame = requestAnimationFrame(prepare);
    });
    mutations.observe(root, { childList: true, subtree: true });
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", resetSurface);
    root.addEventListener("focusin", focus);
    window.addEventListener("blur", resetSurface);
    window.addEventListener("scroll", resetSurface, { passive: true });
    pointer.addEventListener("change", resetSurface);

    // Separate entrance from the hero's existing scroll transform and opacity.
    for (const [index, element] of [
      ...root.querySelectorAll<HTMLElement>(".v-cine-badge, .v-cine-title, .v-cine-action"),
    ].entries()) {
      if (element.getBoundingClientRect().bottom <= 0) continue;
      const animation = element.animate(
        [
          { opacity: 0, translate: "0 18px" },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: 1200, delay: index * 140, easing: EASE, fill: "backwards" },
      );
      animations.set(element, animation);
      animation.onfinish = () => animations.delete(element);
    }

    stop = () => {
      observer?.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(refreshFrame);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", resetSurface);
      root.removeEventListener("focusin", focus);
      window.removeEventListener("blur", resetSurface);
      window.removeEventListener("scroll", resetSurface);
      pointer.removeEventListener("change", resetSurface);
      resetSurface();
      for (const animation of animations.values()) animation.cancel();
      for (const element of elements) delete element.dataset.vReveal;
      for (const element of root.querySelectorAll<HTMLElement>(SURFACES)) {
        element.style.removeProperty("--v-light-x");
        element.style.removeProperty("--v-light-y");
      }
    };
  }

  configure();
  motion.addEventListener("change", configure);
  return () => {
    stop();
    motion.removeEventListener("change", configure);
  };
}
