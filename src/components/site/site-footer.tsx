import { Link } from "@/i18n/navigation";
import NextLink from "next/link";
import Image from "next/image";
import { listCategories } from "@/lib/vocational/data";
import { getCachedSetting } from "@/lib/settings/cached";
import { addFriendUrl } from "@/lib/line";
export async function SiteFooter() {
  const [categories, contact, general, line] = await Promise.all([
    listCategories(),
    getCachedSetting("contact", "th"),
    getCachedSetting("general", "th"),
    getCachedSetting("line", "th"),
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
              <strong>{general.siteName}</strong>
              <small>{general.organisation}</small>
            </span>
          </Link>
          <p>{general.tagline}</p>
          <span className="v-footer-motto" lang="en">
            Crafted with purpose.
          </span>
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
        </div>
        <div>
          <h2>พูดคุยกับเรา</h2>
          <a href={addFriendUrl(line.oaId)} target="_blank" rel="noopener noreferrer">
            LINE {line.oaId} ↗
          </a>
          {contact.phone && (
            <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a>
          )}
          {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          {general.businessHours && <p className="v-footer-hours">{general.businessHours}</p>}
          {contact.facebookUrl && (
            <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer">
              Facebook ↗
            </a>
          )}
          {contact.youtubeUrl && (
            <a href={contact.youtubeUrl} target="_blank" rel="noopener noreferrer">
              YouTube ↗
            </a>
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
