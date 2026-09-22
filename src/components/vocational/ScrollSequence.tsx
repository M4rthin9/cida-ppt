"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
/** Explicit brief landmarks: 1, 38, 75, 113, 150. */
export function frameAt(progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    points = [0, 37, 74, 112, 149];
  const part = Math.min(3, Math.floor(p * 4));
  const a = points[part] ?? 0,
    b = points[part + 1] ?? 149;
  return a + (b - a) * (p * 4 - part);
}
export function ScrollSequence({ enabled = false }: { enabled?: boolean }) {
  const section = useRef<HTMLElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    [ready, setReady] = useState(false),
    [progress, setProgress] = useState(0);
  useEffect(() => {
    if (
      !enabled ||
      !section.current ||
      !canvas.current ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const el = section.current,
      cv = canvas.current,
      ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    let stopped = false,
      raf = 0,
      target = 0,
      current = 0,
      loading = 0,
      last = -1,
      painted = false;
    const cache = new Map<number, HTMLImageElement>(),
      pending = new Set<number>(),
      failed = new Set<number>(),
      queue: number[] = [];
    const cap = matchMedia("(max-width: 700px)").matches ? 14 : 26;
    function enqueue(n: number) {
      if (n < 0 || n > 149 || cache.has(n) || pending.has(n) || queue.includes(n) || failed.has(n))
        return;
      queue.push(n);
      pump();
    }
    function pump() {
      while (!stopped && loading < 3 && queue.length) {
        const n = queue.shift();
        if (n === undefined) break;
        pending.add(n);
        loading++;
        const img = new window.Image();
        img.decoding = "async";
        img.onload = async () => {
          try {
            await img.decode();
          } catch {}
          loading--;
          pending.delete(n);
          if (stopped) return;
          cache.set(n, img);
          for (const key of [...cache.keys()].sort(
            (a, b) => Math.abs(b - target) - Math.abs(a - target),
          )) {
            if (cache.size <= cap) break;
            if (key === last) continue;
            const old = cache.get(key);
            if (old) {
              old.onload = null;
              old.onerror = null;
              old.src = "";
            }
            cache.delete(key);
          }
          schedule();
          pump();
        };
        img.onerror = () => {
          loading--;
          pending.delete(n);
          failed.add(n);
          pump();
        };
        img.src = `/frames/frame-${String(n + 1).padStart(3, "0")}.png`;
      }
    }
    function draw() {
      raf = 0;
      if (stopped) return;
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.08) current = target;
      const wanted = Math.round(current);
      for (const d of [0, 1, -1, 2, -2, 3, -3, 5, -5]) enqueue(wanted + d);
      let best: number | undefined;
      for (const n of cache.keys())
        if (best === undefined || Math.abs(n - current) < Math.abs(best - current)) best = n;
      const img = best === undefined ? undefined : cache.get(best);
      if (img && img.complete && img.naturalWidth) {
        const rect = cv.getBoundingClientRect(),
          dpr = Math.min(devicePixelRatio || 1, 2),
          w = Math.round(rect.width * dpr),
          h = Math.round(rect.height * dpr);
        const changed = cv.width !== w || cv.height !== h;
        if (changed) {
          cv.width = w;
          cv.height = h;
        }
        if (best !== last || changed) {
          const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight),
            dw = img.naturalWidth * scale,
            dh = img.naturalHeight * scale;
          ctx?.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
          last = best ?? 0;
          if (!painted) {
            painted = true;
            setReady(true);
          }
        }
      }
      if (current !== target) schedule();
    }
    function schedule() {
      if (!raf && !stopped) raf = requestAnimationFrame(draw);
    }
    function scroll() {
      const r = el.getBoundingClientRect(),
        p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
      target = frameAt(p);
      setProgress(p);
      queue.sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
      enqueue(Math.round(target));
      schedule();
    }
    const resize = new ResizeObserver(() => {
      last = -1;
      scroll();
    });
    resize.observe(cv);
    enqueue(0);
    enqueue(37);
    enqueue(74);
    enqueue(112);
    enqueue(149);
    scroll();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      resize.disconnect();
      cache.forEach((img) => {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      });
      cache.clear();
    };
  }, [enabled]);
  return (
    <section
      ref={section}
      className={`v-sequence ${enabled ? "has-sequence" : ""}`}
      aria-label="จากการฝึกฝนสู่โอกาสใหม่"
    >
      <div className="v-hero-stage">
        <div className="v-hero-image">
          <Image
            src={enabled ? "/frames/frame-001.png" : "/images/craft-hero.webp"}
            alt={enabled ? "ภาพงานฝึกวิชาชีพ" : "ภาพประกอบแนวคิดงานดอกไม้และงานผ้า"}
            fill
            sizes="(max-width: 760px) 100vw, 65vw"
            priority
          />
          <canvas ref={canvas} aria-hidden="true" style={{ opacity: ready ? 1 : 0 }} />
        </div>
        <div className="v-hero-shade" />
        <div className="v-hero-content">
          <p className="v-kicker">
            <span />
            ฝ่ายฝึกวิชาชีพผู้ต้องขัง
          </p>
          <h1>
            ฝึกอาชีพ
            <br />
            <span>สร้างโอกาสใหม่</span>
          </h1>
          <p className="v-hero-description">
            พื้นที่แห่งการเรียนรู้และพัฒนาทักษะวิชาชีพ
            <br className="v-desktop" /> ผ่านการลงมือทำจริง สู่ผลงานที่มีคุณค่า
            <br className="v-desktop" /> และโอกาสในวันข้างหน้า
          </p>
          <div className="v-actions">
            <Link className="v-button v-button-light" href="/products">
              ชมผลิตภัณฑ์ <span>↗</span>
            </Link>
            <Link className="v-text-link" href="/vocational">
              เรียนรู้เรื่องงานฝึกวิชาชีพ <span>↗</span>
            </Link>
          </div>
        </div>
        <div className="v-hero-bottom">
          <span>
            CRAFTED WITH PURPOSE.
            <br />
            SKILLS FOR A NEW BEGINNING.
          </span>
          <p>{enabled ? "เลื่อนเพื่อสำรวจเรื่องราว ↓" : "ความตั้งใจ สร้างคุณค่าในทุกชิ้นงาน"}</p>
          {!enabled && <small>ภาพประกอบแนวคิดงานฝีมือ</small>}
        </div>
        {enabled && (
          <div className="v-scroll-progress" style={{ transform: `scaleX(${progress})` }} />
        )}
      </div>
    </section>
  );
}
