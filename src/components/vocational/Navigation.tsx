"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
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
  return (
    <header className="v-header">
      <Link href="/" className="v-brand" aria-label="ฝ่ายฝึกวิชาชีพผู้ต้องขัง หน้าแรก">
        <Image src="/brand/cida-logo.png" width={52} height={52} alt="ตราทัณฑสถานบำบัดพิเศษกลาง" />
        <span>
          <strong>ฝ่ายฝึกวิชาชีพผู้ต้องขัง</strong>
          <small>ทัณฑสถานบำบัดพิเศษกลาง</small>
        </span>
      </Link>
      <button
        className="v-menu-toggle"
        aria-expanded={open}
        aria-controls="public-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? "ปิดเมนู ✕" : "เมนู ☰"}
      </button>
      <nav id="public-navigation" aria-label="เมนูหลัก" className={open ? "open" : ""}>
        {links.map(([href, label]) =>
          href === "/products" ? (
            <div className="v-products-nav" key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={path.startsWith("/products") ? "page" : undefined}
              >
                {label}
              </Link>
              <details>
                <summary aria-label="หมวดหมู่ผลิตภัณฑ์">⌄</summary>
                <div className="v-megamenu">
                  <Link href="/products" onClick={() => setOpen(false)}>
                    สินค้าทั้งหมด
                  </Link>
                  {categories.map((c) => (
                    <Link
                      href={`/products/category/${c.slug}`}
                      key={c.slug}
                      onClick={() => setOpen(false)}
                    >
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
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
