"use client";

import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SiteIcon } from "@/components/site/icons";

const links = [
  ["/", "หน้าแรก"],
  ["/products", "ผลิตภัณฑ์"],
  ["/vocational", "งานฝึกวิชาชีพ"],
  ["/story", "เรื่องราวของเรา"],
  ["/news", "ข่าวและกิจกรรม"],
] as const;

export function Navigation({
  categories,
  name,
  organisation,
}: {
  categories: { name_th: string; slug: string }[];
  name: string;
  organisation?: string;
}) {
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const path = usePathname();
  const header = useRef<HTMLElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const categoryToggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !header.current?.contains(event.target)) {
        setOpen(false);
        setCollectionsOpen(false);
      }
    }
    const desktop = matchMedia("(min-width: 1101px)");
    function resize() {
      setOpen(false);
      setCollectionsOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      desktop.removeEventListener("change", resize);
    };
  }, []);

  function closeMenus() {
    setOpen(false);
    setCollectionsOpen(false);
  }
  function active(href: string) {
    return path === href || (href !== "/" && path.startsWith(`${href}/`));
  }

  return (
    <header
      ref={header}
      className={`v-header${path === "/" ? " v-header-cinematic" : ""}`}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        if (collectionsOpen) {
          setCollectionsOpen(false);
          categoryToggle.current?.focus();
        } else if (open) {
          setOpen(false);
          menuToggle.current?.focus();
        }
      }}
    >
      <div className="v-utility">
        <span>{organisation} · กรมราชทัณฑ์</span>
        <span lang="en">VOCATIONAL TRAINING & REHABILITATION</span>
      </div>
      <div className="v-header-inner">
        <Link href="/" className="v-brand" aria-label={`${name} หน้าแรก`} onClick={closeMenus}>
          <Image
            src="/brand/cida-logo.png"
            width={52}
            height={52}
            alt="ตราทัณฑสถานบำบัดพิเศษกลาง"
          />
          <span>
            <strong>{name}</strong>
            <small>{organisation}</small>
          </span>
        </Link>
        <button
          ref={menuToggle}
          type="button"
          className="v-menu-toggle"
          aria-expanded={open}
          aria-controls="public-navigation"
          onClick={() => {
            setOpen(!open);
            setCollectionsOpen(false);
          }}
        >
          <span>{open ? "ปิดเมนู" : "เมนู"}</span>
          <SiteIcon name={open ? "close" : "menu"} />
        </button>
        <nav id="public-navigation" aria-label="เมนูหลัก" className={open ? "open" : ""}>
          {links.map(([href, label]) =>
            href === "/products" ? (
              <div
                className="v-products-nav"
                key={href}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                    setCollectionsOpen(false);
                }}
              >
                <button
                  ref={categoryToggle}
                  className="v-category-toggle"
                  type="button"
                  aria-current={active(href) ? "page" : undefined}
                  aria-controls="collection-navigation"
                  aria-expanded={collectionsOpen}
                  onClick={() => setCollectionsOpen(!collectionsOpen)}
                >
                  {label}
                </button>
                <div id="collection-navigation" className="v-megamenu" hidden={!collectionsOpen}>
                  <p>หมวดงานฝีมือ</p>
                  <Link href="/products" onClick={closeMenus}>
                    สินค้าทั้งหมด <span aria-hidden="true">↗</span>
                  </Link>
                  {categories.map((c, i) => (
                    <Link href={`/products/category/${c.slug}`} key={c.slug} onClick={closeMenus}>
                      <small>{String(i + 1).padStart(2, "0")}</small>
                      {c.name_th}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? "page" : undefined}
                onClick={closeMenus}
              >
                {label}
              </Link>
            ),
          )}
          <Link
            href="/products#catalog-search"
            className="v-nav-search"
            aria-label="ค้นหาผลงาน"
            onClick={closeMenus}
          >
            <SiteIcon name="search" />
          </Link>
          <Link
            href="/contact"
            className="v-nav-contact"
            aria-current={active("/contact") ? "page" : undefined}
            onClick={closeMenus}
          >
            ติดต่อสอบถาม <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
