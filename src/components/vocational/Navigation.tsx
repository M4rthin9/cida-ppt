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
        // The category menu has no control of its own: it is open because
        // something inside it has hover or focus, so it closes by giving up
        // focus rather than by being told to.
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && focused.closest(".v-megamenu")) {
          focused.blur();
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
        {/* Products carries the category list. There is no disclosure control:
            pointing at the item opens it, tabbing into it does the same, and
            the item itself stays a plain link to the products page. The list
            is a plain group of links rather than a labelled generic, because
            ARIA ignores a name on an element with no role. */}
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
