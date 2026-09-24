"use client";

import { useEffect, useRef } from "react";

/**
 * The collections grid, with the pointer published onto whichever cell holds
 * it — the same contract the two cinematic stages use, one level down: the
 * component writes numbers onto an element and the stylesheet is a pure
 * function of them, so there are no keyframes for the reduced-motion reset to
 * fight and nothing animates that CSS cannot rest.
 *
 *  - `--mx` / `--my`    the pointer inside the cell, 0 to 1, for the light
 *  - `--px` / `--py`    the same reading centred, -1 to 1, for the parallax
 *  - `--mpx` / `--mpy`  the same point in px, so the cue can ride it on a
 *                       compositor-only `translate` instead of left/top
 *  - `--hot`            1 while the cell holds the pointer, 0 as it leaves
 *  - `--lit`            as `--hot`, but only ever set from a real pointer, so
 *                       :focus-visible can borrow the choreography without
 *                       summoning a cue that has no pointer to ride
 *
 * One delegated listener on the container rather than one per card, coalesced
 * onto a frame, so a fast diagonal drag across four cells costs one write per
 * paint instead of one per event. The cards stay server-rendered; this only
 * wraps them.
 */
export function BentoGrid({ children }: { children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = host.current;
    if (!grid) return;
    // Coarse pointers have no hover state to track, and a reader who asked for
    // less motion is not asking for a light that follows their finger.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;

    type Reading = { cell: HTMLElement; x: number; y: number; px: number; py: number };
    let frame = 0;
    let pending: Reading | null = null;
    let active: HTMLElement | null = null;

    const write = () => {
      frame = 0;
      if (!pending) return;
      const { cell, x, y, px, py } = pending;
      cell.style.setProperty("--mx", x.toFixed(4));
      cell.style.setProperty("--my", y.toFixed(4));
      cell.style.setProperty("--px", (x * 2 - 1).toFixed(4));
      cell.style.setProperty("--py", (y * 2 - 1).toFixed(4));
      cell.style.setProperty("--mpx", `${px.toFixed(1)}px`);
      cell.style.setProperty("--mpy", `${py.toFixed(1)}px`);
      cell.style.setProperty("--hot", "1");
      cell.style.setProperty("--lit", "1");
    };

    const cool = (cell: HTMLElement) => {
      // The light fades where it was left rather than snapping to the middle,
      // so leaving a cell reads as the lamp going out, not as a jump cut.
      cell.style.setProperty("--hot", "0");
      cell.style.setProperty("--lit", "0");
      cell.style.setProperty("--px", "0");
      cell.style.setProperty("--py", "0");
    };

    const onMove = (event: PointerEvent) => {
      const cell =
        (event.target as HTMLElement | null)?.closest<HTMLElement>(
          ".v-bento-card, .v-bento-note",
        ) ?? null;
      if (cell !== active) {
        if (active) cool(active);
        active = cell;
      }
      if (!cell) return;
      const box = cell.getBoundingClientRect();
      const px = event.clientX - box.left;
      const py = event.clientY - box.top;
      pending = { cell, x: px / box.width, y: py / box.height, px, py };
      frame ||= requestAnimationFrame(write);
    };

    const onLeave = () => {
      if (active) cool(active);
      active = null;
      pending = null;
    };

    grid.addEventListener("pointermove", onMove);
    grid.addEventListener("pointerleave", onLeave);
    return () => {
      grid.removeEventListener("pointermove", onMove);
      grid.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      if (active) cool(active);
    };
  }, []);

  return (
    <div className="v-bento" ref={host}>
      {children}
    </div>
  );
}
