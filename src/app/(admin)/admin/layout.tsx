import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getAdminUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth";
import { LOGIN_PATH } from "@/lib/auth/config";
import { Button } from "@/components/ui/field";
import { unreadMessageCount } from "@/lib/admin/messages";

export const metadata: Metadata = {
  title: { default: "ระบบจัดการเว็บไซต์", template: "%s — ระบบจัดการเว็บไซต์" },
  robots: { index: false, follow: false },
};

/** Every admin label is Thai (CLAUDE.md). Sections not yet built are not listed. */
type NavItem = { href: string; label: string; ownerOnly?: boolean; badge?: number };

const NAV: readonly NavItem[] = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/categories", label: "หมวดหมู่" },
  { href: "/admin/products", label: "สินค้า" },
  { href: "/admin/news", label: "ข่าวและกิจกรรม" },
  { href: "/admin/media", label: "คลังภาพ" },
  { href: "/admin/messages", label: "กล่องข้อความ" },
  { href: "/admin/users", label: "ผู้ดูแลระบบ", ownerOnly: true },
  { href: "/admin/settings/general", label: "ตั้งค่า", ownerOnly: true },
  { href: "/admin/audit", label: "ประวัติการแก้ไข" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page nests under /admin but must render without a session.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const user = await getAdminUser();

  if (!user) {
    return <>{children}</>;
  }

  const unread = await unreadMessageCount();
  const items = NAV.filter((item) => !item.ownerOnly || user.role === "owner").map((item) =>
    item.href === "/admin/messages" && unread > 0 ? { ...item, badge: unread } : item,
  );

  return (
    <div className="cms-shell">
      <aside className="cms-sidebar">
        <Link href="/admin" className="cms-brand">
          <strong>ฝ่ายฝึกวิชาชีพผู้ต้องขัง</strong>
          <span>ทัณฑสถานบำบัดพิเศษกลาง</span>
          <small>ระบบจัดการเนื้อหา</small>
        </Link>
        <nav aria-label="เมนูผู้ดูแล">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                (item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href))
                  ? "page"
                  : undefined
              }
            >
              {item.label}
              {item.badge ? <span>{item.badge}</span> : null}
            </Link>
          ))}
        </nav>
        <div className="cms-user">
          <strong>{user.name}</strong>
          <span>{user.role === "owner" ? "ผู้ดูแลสูงสุด" : "ผู้แก้ไขเนื้อหา"}</span>
          <Link href="/" target="_blank">
            ดูเว็บไซต์ ↗
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: LOGIN_PATH });
            }}
          >
            <Button type="submit" variant="secondary">
              ออกจากระบบ
            </Button>
          </form>
        </div>
      </aside>
      <main className="cms-main">{children}</main>
    </div>
  );
}
