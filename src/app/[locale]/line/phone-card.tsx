"use client";

import { useRef, useState } from "react";
import { openLineFriendsUrl } from "@/lib/line";

export function PhoneCard({ phone, message }: { phone: string; message?: string }) {
  const phoneInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState("");
  async function copy(value: string, kind: "phone" | "message") {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(kind === "phone" ? "คัดลอกเบอร์โทรแล้ว" : "คัดลอกข้อความแล้ว");
    } catch {
      const input = kind === "phone" ? phoneInput.current : messageInput.current;
      input?.focus();
      input?.select();
      setNotice("เลือกข้อความแล้ว กรุณาคัดลอกด้วยเมนูของอุปกรณ์");
    }
  }
  return (
    <section className="v-line-phone-card" aria-label="เพิ่มเพื่อน LINE ด้วยเบอร์โทร">
      <label htmlFor="line-phone">เบอร์โทรสำหรับเพิ่มเพื่อน LINE</label>
      <div className="v-line-copy-row">
        <input id="line-phone" ref={phoneInput} value={phone} readOnly dir="ltr" />
        <button className="v-button v-button-outline" onClick={() => copy(phone, "phone")}>
          คัดลอกเบอร์โทร
        </button>
      </div>
      <ol className="v-line-steps">
        <li>คัดลอกเบอร์โทรด้านบน แล้วเปิดแอป LINE</li>
        <li>เลือก หน้าแรก → เพิ่มเพื่อน → ค้นหา → หมายเลขโทรศัพท์</li>
        <li>เลือกประเทศของเบอร์โทร วางหมายเลข แล้วกดค้นหาเพื่อเพิ่มเพื่อน</li>
      </ol>
      <a className="v-button v-button-dark" href={openLineFriendsUrl()}>
        เปิด LINE เพื่อเพิ่มเพื่อน <span aria-hidden="true">↗</span>
      </a>
      {message && (
        <div className="v-line-message">
          <label htmlFor="line-message">ข้อความสอบถามสินค้า</label>
          <textarea id="line-message" ref={messageInput} value={message} readOnly rows={5} />
          <button className="v-button v-button-outline" onClick={() => copy(message, "message")}>
            คัดลอกข้อความสอบถาม
          </button>
        </div>
      )}
      <p role="status" aria-live="polite" className="v-line-copy-status">
        {notice}
      </p>
    </section>
  );
}
