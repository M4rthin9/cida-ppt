/** Restrained, progressive scroll reveals. No pointer tracking or perpetual animation loop. */
const REVEALS = [
  ".v-section-heading",
  ".v-collection-card",
  ".v-collection-notes > a",
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

export function startVisualEffects(root: HTMLElement): () => void {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let cleanup = () => {};

  function configure() {
    cleanup();
    if (motion.matches || typeof IntersectionObserver === "undefined") return;
    const elements = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          observer.unobserve(element);
          element.dataset.vReveal = "visible";
          const animation = element.animate(
            [
              { opacity: 0, transform: "translateY(12px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 500, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" },
          );
          animations.set(element, animation);
          animation.onfinish = () => animations.delete(element);
        }
      },
      { rootMargin: "0px 0px -3% 0px", threshold: 0 },
    );

    function prepare() {
      frame = 0;
      for (const element of root.querySelectorAll<HTMLElement>(REVEALS)) {
        if (elements.has(element)) continue;
        elements.add(element);
        if (element.getBoundingClientRect().top < innerHeight * 0.97) {
          element.dataset.vReveal = "visible";
        } else {
          element.dataset.vReveal = "pending";
          observer.observe(element);
        }
      }
    }
    function focus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-v-reveal]");
      if (!element) return;
      observer.unobserve(element);
      animations.get(element)?.cancel();
      element.dataset.vReveal = "visible";
    }
    prepare();
    const mutations = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(prepare);
    });
    mutations.observe(root, { childList: true, subtree: true });
    root.addEventListener("focusin", focus);
    cleanup = () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      root.removeEventListener("focusin", focus);
      for (const animation of animations.values()) animation.cancel();
      for (const element of elements) delete element.dataset.vReveal;
    };
  }
  configure();
  motion.addEventListener("change", configure);
  return () => {
    cleanup();
    motion.removeEventListener("change", configure);
  };
}
