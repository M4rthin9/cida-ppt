"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { startScrollSequence } from "@/lib/vocational/scroll-player";
import "./scroll-sequence.css";

/** Only the background is animated; all hero content is supplied unchanged. */
export function ScrollSequence({ children, version }: { children: ReactNode; version: string }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (section.current && canvas.current)
      return startScrollSequence(section.current, canvas.current, version);
  }, [version]);

  return (
    <section ref={section} className="cida-scroll-sequence" aria-label="จากการฝึกฝนสู่โอกาสใหม่">
      <div className="cida-sequence-stage">
        <canvas ref={canvas} className="cida-sequence-canvas" aria-hidden="true" />
        {children}
      </div>
    </section>
  );
}
