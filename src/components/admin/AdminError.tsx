"use client";

import Link from "next/link";

export function AdminError({ reset }: { reset: () => void }) {
  return (
    <section className="cms-panel" aria-labelledby="admin-error-title">
      <p className="cms-eyebrow">ระบบจัดการเนื้อหา</p>
      <h1 id="admin-error-title">ไม่สามารถโหลดข้อมูลได้ในขณะนี้</h1>
      <p role="alert">กรุณาลองอีกครั้ง หากยังพบปัญหา โปรดติดต่อผู้ดูแลระบบ</p>
      <div className="cms-actions">
        <button type="button" className="cms-primary" onClick={reset}>
          ลองอีกครั้ง
        </button>
        <Link href="/admin">กลับหน้าภาพรวม</Link>
        <Link href="/">ดูเว็บไซต์</Link>
      </div>
    </section>
  );
}
