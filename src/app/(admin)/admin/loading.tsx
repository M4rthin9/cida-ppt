export default function Loading() {
  return (
    <section className="cms-panel" role="status" aria-live="polite" aria-busy="true">
      <p className="cms-eyebrow">ระบบจัดการเนื้อหา</p>
      <h1>กำลังโหลดข้อมูล…</h1>
      <p>กรุณารอสักครู่</p>
    </section>
  );
}
