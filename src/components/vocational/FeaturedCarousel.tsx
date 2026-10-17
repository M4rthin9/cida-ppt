"use client";

import { Children, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./FeaturedCarousel.module.css";

export function FeaturedCarousel({
  children,
  title,
  eyebrow,
  cta,
  href,
  labels,
}: {
  children: ReactNode;
  title: string;
  eyebrow: string;
  cta: string;
  href: string;
  labels: string[];
}) {
  const cards = Children.toArray(children);
  const gesture = useRef<{ x: number; y: number; dragging: boolean } | null>(null);
  const lastDrag = useRef(0);
  const lastWheel = useRef(0);
  const id = useId();
  const [active, setActive] = useState(0);
  const move = (direction: number | "start" | "end") => {
    if (!cards.length) return;
    setActive((current) =>
      direction === "start"
        ? 0
        : direction === "end"
          ? cards.length - 1
          : (current + direction + cards.length) % cards.length,
    );
  };

  return (
    <section
      id="featured"
      className={styles.showcase}
      aria-roledescription="carousel"
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.inner}>
        <div className={styles.heading}>
          <div>
            {eyebrow && <p className="v-eyebrow">{eyebrow}</p>}
            <h2 id={`${id}-title`}>{title}</h2>
            <p className={styles.intro}>เลือกชมงานฝีมือที่คุณชอบ แล้วค้นพบรายละเอียดของแต่ละชิ้น</p>
          </div>
          <Link href={href} className={styles.collectionLink}>
            {cta}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div
          id={`${id}-track`}
          className={styles.track}
          data-active-index={active}
          tabIndex={0}
          role="group"
          aria-label="สินค้าแนะนำ ใช้ปุ่มลูกศรเพื่อเลื่อนชมสินค้า"
          onDragStart={(event) => event.preventDefault()}
          onWheel={(event) => {
            const delta = event.shiftKey ? event.deltaY : event.deltaX;
            if (
              Math.abs(delta) < 15 ||
              (!event.shiftKey && Math.abs(event.deltaY) > Math.abs(delta)) ||
              Date.now() - lastWheel.current < 450
            )
              return;
            lastWheel.current = Date.now();
            move(delta > 0 ? 1 : -1);
          }}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            gesture.current = { x: event.clientX, y: event.clientY, dragging: false };
          }}
          onPointerMove={(event) => {
            const start = gesture.current;
            if (!start) return;
            if (event.pointerType === "mouse" && event.buttons !== 1) {
              gesture.current = null;
              return;
            }
            const x = event.clientX - start.x;
            const y = event.clientY - start.y;
            if (Math.abs(y) > 12 && Math.abs(y) > Math.abs(x)) {
              gesture.current = null;
              return;
            }
            if (Math.abs(x) > 12 && Math.abs(x) > Math.abs(y)) {
              start.dragging = true;
              event.currentTarget.setPointerCapture(event.pointerId);
            }
          }}
          onPointerUp={(event) => {
            const start = gesture.current;
            gesture.current = null;
            if (!start?.dragging) return;
            lastDrag.current = Date.now();
            const distance = event.clientX - start.x;
            if (Math.abs(distance) >= 45) move(distance < 0 ? 1 : -1);
          }}
          onPointerCancel={() => {
            gesture.current = null;
          }}
          onClickCapture={(event) => {
            if (Date.now() - lastDrag.current < 350) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            const direction = { ArrowLeft: -1, ArrowRight: 1, Home: "start", End: "end" }[
              event.key
            ] as number | "start" | "end" | undefined;
            if (direction === undefined) return;
            event.preventDefault();
            move(direction);
          }}
        >
          {cards.map((card, index) => {
            let offset = (index - active + cards.length) % cards.length;
            if (offset > cards.length / 2) offset -= cards.length;
            const distance = Math.abs(offset);
            return (
              <div
                key={index}
                className={styles.slide}
                data-active={index === active}
                data-distance={distance}
                aria-hidden={distance > 2}
                style={
                  {
                    "--offset": offset,
                    "--depth": distance,
                    zIndex: cards.length - distance,
                  } as CSSProperties
                }
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${cards.length}`}
              >
                <span className={styles.cardNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div
                  className={styles.card}
                  inert={index !== active}
                  aria-hidden={index !== active}
                >
                  {card}
                </div>
                {distance > 0 && distance <= 2 && (
                  <button
                    type="button"
                    className={styles.selectCard}
                    tabIndex={-1}
                    aria-label={`เลือกดู ${labels[index]}`}
                    onClick={(event) => {
                      setActive(index);
                      if (event.detail === 0)
                        event.currentTarget
                          .closest<HTMLDivElement>("[data-active-index]")
                          ?.focus({ preventScroll: true });
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.footer}>
          <span className={styles.hint}>
            เลื่อนชมผลงาน <span aria-hidden="true">↔</span>
          </span>
          <div className={styles.progress} aria-hidden="true">
            <span style={{ width: `${((active + 1) / Math.max(cards.length, 1)) * 100}%` }} />
          </div>
          <span className={styles.counter} aria-live="polite" aria-atomic="true">
            <strong>{String(active + 1).padStart(2, "0")}</strong> /{" "}
            {String(cards.length).padStart(2, "0")}
            <span className={styles.srOnly}> {labels[active]}</span>
          </span>
          <div className={styles.controls}>
            <button
              type="button"
              aria-label="สินค้าก่อนหน้า"
              aria-controls={`${id}-track`}
              disabled={cards.length <= 1}
              onClick={() => move(-1)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="สินค้าถัดไป"
              aria-controls={`${id}-track`}
              disabled={cards.length <= 1}
              onClick={() => move(1)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
