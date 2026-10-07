import type { Metadata } from "next";
import Link from "next/link";
import { getAdminUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth";
import { LOGIN_PATH } from "@/lib/auth/config";
import { Seal } from "@/components/site/seal";
import { AdminIcon } from "@/components/admin/AdminIcon";
import {
  AdminNavigation,
  AdminTopbar,
  type AdminNavItem,
} from "@/components/admin/AdminNavigation";
import { unreadMessageCount } from "@/lib/admin/messages";

export const metadata: Metadata = {
  title: { default: "ระบบจัดการเว็บไซต์", template: "%s — ระบบจัดการเว็บไซต์" },
  robots: { index: false, follow: false },
};

/** Every admin label is Thai (CLAUDE.md). Sections not yet built are not listed. */
type NavItem = AdminNavItem & { ownerOnly?: boolean };

const NAV: readonly NavItem[] = [
  { href: "/admin", label: "ภาพรวม", icon: "overview" },
  { href: "/admin/categories", label: "หมวดหมู่", icon: "category" },
  { href: "/admin/products", label: "สินค้า", icon: "product" },
  { href: "/admin/news", label: "ข่าวและกิจกรรม", icon: "news" },
  { href: "/admin/media", label: "คลังภาพ", icon: "media" },
  { href: "/admin/messages", label: "กล่องข้อความ", icon: "messages" },
  { href: "/admin/users", label: "ผู้ดูแลระบบ", icon: "users", group: "system", ownerOnly: true },
  {
    href: "/admin/settings/general",
    label: "ตั้งค่า",
    icon: "settings",
    group: "system",
    ownerOnly: true,
  },
  { href: "/admin/audit", label: "ประวัติการแก้ไข", icon: "history", group: "system" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page nests under /admin but must render without a session.
  const user = await getAdminUser();

  if (!user) {
    return <>{children}</>;
  }

  const unread = await unreadMessageCount();
  const items = NAV.filter((item) => !item.ownerOnly || user.role === "owner").map((item) =>
    item.href === "/admin/messages" && unread > 0 ? { ...item, badge: unread } : item,
  );
  const role = user.role === "owner" ? "ผู้ดูแลสูงสุด" : "ผู้แก้ไขเนื้อหา";
  const signout = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: LOGIN_PATH });
      }}
    >
      <button type="submit" className="cms-signout">
        <AdminIcon name="logout" />
        ออกจากระบบ
      </button>
    </form>
  );

  return (
    <div className="cms-shell">
      <a href="#admin-content" className="cms-skip">
        ข้ามไปยังเนื้อหา
      </a>
      <aside className="cms-sidebar">
        <Link href="/admin" className="cms-brand">
          <Seal size={42} />
          <div>
            <strong>ฝ่ายฝึกวิชาชีพผู้ต้องขัง</strong>
            <span>ทัณฑสถานบำบัดพิเศษกลาง</span>
          </div>
        </Link>
        <AdminNavigation items={items} />
        <Link className="cms-sidebar-visit" href="/" target="_blank" rel="noopener noreferrer">
          <span>
            <strong>เว็บไซต์ของคุณ</strong>
            <small>เปิดดูหน้าสาธารณะ</small>
          </span>
          <AdminIcon name="external" />
        </Link>
        <div className="cms-user">
          <div className="cms-user-identity">
            <span className="cms-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{role}</span>
            </div>
          </div>
          {signout}
        </div>
      </aside>
      <div className="cms-workspace">
        <AdminTopbar items={items} name={user.name} role={role} signout={signout} />
        <main className="cms-main" id="admin-content">
          {children}
        </main>
        <footer className="cms-workspace-footer">
          ฝ่ายฝึกวิชาชีพผู้ต้องขัง <span>ทัณฑสถานบำบัดพิเศษกลาง</span>
        </footer>
      </div>
    </div>
  );
}
