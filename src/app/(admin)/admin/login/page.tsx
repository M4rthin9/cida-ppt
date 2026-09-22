import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Seal } from "@/components/site/seal";
import { getAdminUser } from "@/lib/auth/session";
import { ADMIN_HOME } from "@/lib/auth/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ — ระบบจัดการเว็บไซต์" };

export default async function LoginPage() {
  if (await getAdminUser()) redirect(ADMIN_HOME);

  return (
    <main className="cms-login">
      <div className="cms-login-frame">
        <section className="cms-login-intro" aria-label="ฝ่ายฝึกวิชาชีพผู้ต้องขัง">
          <Link href="/" className="cms-login-identity">
            <Seal size={72} />
            <span>
              <strong>ฝ่ายฝึกวิชาชีพผู้ต้องขัง</strong>
              <span>ทัณฑสถานบำบัดพิเศษกลาง</span>
            </span>
          </Link>
          <div className="cms-login-story">
            <p className="cms-login-kicker">พื้นที่สำหรับผู้ดูแลเว็บไซต์</p>
            <h2>
              ทุกผลงานมีคุณค่า
              <br />
              <span>ทุกทักษะสร้างโอกาส</span>
            </h2>
            <p>
              ดูแลผลงาน ผลิตภัณฑ์ และเรื่องราวการฝึกวิชาชีพ เพื่อส่งต่อคุณค่าของงานฝีมือสู่ผู้คน
            </p>
          </div>
          <div className="cms-login-note">
            <span aria-hidden="true">01 — 04</span>
            <p>ฝึกอาชีพ · สร้างทักษะ · สร้างคุณค่า · สร้างโอกาสใหม่</p>
          </div>
        </section>
        <section className="cms-login-access" aria-labelledby="login-heading">
          <div className="cms-login-form">
            <span className="cms-login-access-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="10" width="14" height="11" rx="3" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" strokeLinecap="round" />
              </svg>
            </span>
            <p className="cms-login-kicker">ระบบจัดการเว็บไซต์</p>
            <h1 id="login-heading">ยินดีต้อนรับกลับ</h1>
            <p className="cms-login-description">เข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่ของคุณ</p>
            <LoginForm />
            <p className="cms-login-help">สำหรับเจ้าหน้าที่ผู้ดูแลระบบเท่านั้น</p>
          </div>
        </section>
      </div>
      <Link href="/" className="cms-login-back">
        <span aria-hidden="true">←</span> กลับสู่เว็บไซต์
      </Link>
    </main>
  );
}
