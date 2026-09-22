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
  ["/contact", "ติดต่อ"],
];
export function Navigation({ categories }: { categories: { name_th: string; slug: string }[] }) {
  const [open, setOpen] = useState(false),
    path = usePathname();
  const productMenu = useRef<HTMLDetailsElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // The bar floats over the opening frame, where it needs to stay light; once
  // the reader is past it the glass gains weight so the links keep their
  // contrast over whatever scrolls underneath.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  function closeMenus() {
    setOpen(false);
    if (productMenu.current) productMenu.current.open = false;
  }
  function active(href: string) {
    return path === href || (href !== "/" && path.startsWith(`${href}/`));
  }
  return (
    <header
      className="v-header"
      data-scrolled={scrolled}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        if (productMenu.current?.open) {
          productMenu.current.open = false;
          productMenu.current.querySelector("summary")?.focus();
        } else if (open) {
          setOpen(false);
          menuToggle.current?.focus();
        }
      }}
    >
      <Link
        href="/"
        className="v-brand"
        aria-label="ฝ่ายฝึกวิชาชีพผู้ต้องขัง หน้าแรก"
        onClick={closeMenus}
      >
        <Image src="/brand/cida-logo.png" width={52} height={52} alt="ตราทัณฑสถานบำบัดพิเศษกลาง" />
        <span>
          <strong>ฝ่ายฝึกวิชาชีพผู้ต้องขัง</strong>
          <small>ทัณฑสถานบำบัดพิเศษกลาง</small>
        </span>
      </Link>
      <button
        ref={menuToggle}
        type="button"
        className="v-menu-toggle"
        aria-expanded={open}
        aria-controls="public-navigation"
        onClick={() => {
          if (open) closeMenus();
          else setOpen(true);
        }}
      >
        {open ? "ปิดเมนู" : "เมนู"} <SiteIcon name={open ? "close" : "menu"} />
      </button>
      <nav id="public-navigation" aria-label="เมนูหลัก" className={open ? "open" : ""}>
        {links.map(([href, label]) =>
          href === "/products" ? (
            <div className="v-products-nav" key={href}>
              <Link
                href={href}
                onClick={closeMenus}
                aria-current={active(href) ? "page" : undefined}
              >
                {label}
              </Link>
              <details ref={productMenu}>
                <summary aria-label="หมวดหมู่ผลิตภัณฑ์">⌄</summary>
                <div className="v-megamenu">
                  <Link href="/products" onClick={closeMenus}>
                    สินค้าทั้งหมด
                  </Link>
                  {categories.map((c) => (
                    <Link href={`/products/category/${c.slug}`} key={c.slug} onClick={closeMenus}>
                      {c.name_th}
                    </Link>
                  ))}
                </div>
              </details>
            </div>
          ) : (
            <Link
              key={href}
              href={href ?? "/"}
              aria-current={active(href ?? "/") ? "page" : undefined}
              onClick={closeMenus}
            >
              {label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
