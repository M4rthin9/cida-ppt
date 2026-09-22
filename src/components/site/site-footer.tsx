import { Link } from "@/i18n/navigation";
import NextLink from "next/link";
import Image from "next/image";
import { listCategories } from "@/lib/vocational/data";
import { getCachedSetting } from "@/lib/settings/cached";
export async function SiteFooter() {
  const [categories, contact] = await Promise.all([
    listCategories(),
    getCachedSetting("contact", "th"),
  ]);
  return (
    <footer className="v-footer">
      <div className="v-footer-main">
        <div>
          <Link className="v-brand" href="/">
            <Image
              src="/brand/cida-logo.png"
              width={64}
              height={64}
              alt="ตราทัณฑสถานบำบัดพิเศษกลาง"
            />
            <span>
              <strong>ฝ่ายฝึกวิชาชีพผู้ต้องขัง</strong>
              <small>ทัณฑสถานบำบัดพิเศษกลาง</small>
            </span>
          </Link>
          <p>ฝึกอาชีพ สร้างทักษะ สร้างคุณค่า สร้างโอกาสใหม่</p>
        </div>
        <div>
          <h2>ผลงานและผลิตภัณฑ์</h2>
          {categories.map((c) => (
            <Link key={c.id} href={`/products/category/${c.slug}`}>
              {c.name_th}
            </Link>
          ))}
        </div>
        <div>
          <h2>รู้จักเรา</h2>
          <Link href="/vocational">งานฝึกวิชาชีพ</Link>
          <Link href="/story">เรื่องราวของเรา</Link>
          <Link href="/news">ข่าวและกิจกรรม</Link>
          <Link href="/contact">ติดต่อสอบถาม</Link>
          {contact.phone && (
            <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a>
          )}
        </div>
      </div>
      <div className="v-footer-bottom">
        <span>ทัณฑสถานบำบัดพิเศษกลาง · กรมราชทัณฑ์ กระทรวงยุติธรรม</span>
        <NextLink href="/admin">สำหรับเจ้าหน้าที่ ↗</NextLink>
      </div>
    </footer>
  );
}
