"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { AdminIcon, type AdminIconName } from "./AdminIcon";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminIconName;
  group?: "system";
  badge?: number;
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  if (href.startsWith("/admin/settings/")) return pathname.startsWith("/admin/settings/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigation({
  items,
  onNavigate,
}: {
  items: AdminNavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="cms-nav" aria-label="เมนูผู้ดูแล">
      {[undefined, "system" as const].map((group) => (
        <div className="cms-nav-group" key={group ?? "content"}>
          <p>{group ? "การดูแลระบบ" : "จัดการเว็บไซต์"}</p>
          {items
            .filter((item) => item.group === group)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
              >
                <AdminIcon name={item.icon} />
                <span>{item.label}</span>
                {item.badge ? <b className="cms-nav-badge">{item.badge}</b> : null}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
}

export function AdminTopbar({
  items,
  name,
  role,
  signout,
}: {
  items: AdminNavItem[];
  name: string;
  role: string;
  signout: ReactNode;
}) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const current = [...items].reverse().find((item) => isActive(pathname, item.href));
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("")
    .toUpperCase();
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <header className="cms-topbar">
      <div className="cms-topbar-location">
        <details
          className="cms-mobile-menu"
          ref={menu}
          onKeyDown={(event) => {
            if (event.key === "Escape" && menu.current?.open) {
              menu.current.open = false;
              menu.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label="เปิดเมนูผู้ดูแล">
            <AdminIcon name="menu" />
          </summary>
          <div className="cms-mobile-menu-panel">
            <AdminNavigation
              items={items}
              onNavigate={() => {
                if (menu.current) menu.current.open = false;
              }}
            />
            <div className="cms-mobile-account">
              <strong>{name}</strong>
              <span>{role}</span>
              {signout}
            </div>
          </div>
        </details>
        <div className="cms-breadcrumb">
          <span>พื้นที่ผู้ดูแล</span>
          <span aria-hidden="true">/</span>
          <strong>{current?.label ?? "จัดการเว็บไซต์"}</strong>
        </div>
      </div>
      <form action="/admin/products" className="cms-top-search" role="search">
        <AdminIcon name="search" />
        <input type="search" name="q" placeholder="ค้นหาสินค้า…" aria-label="ค้นหาสินค้า" />
      </form>
      <div className="cms-topbar-actions">
        <Link href="/" target="_blank" rel="noopener noreferrer" className="cms-view-site">
          ดูเว็บไซต์ <AdminIcon name="external" />
        </Link>
        <span
          className="cms-avatar"
          role="img"
          title={`${name} · ${role}`}
          aria-label={`${name} · ${role}`}
        >
          {initials}
        </span>
      </div>
    </header>
  );
}

export function AdminSettingsTabs({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="หมวดการตั้งค่า" className="cms-settings-tabs">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
