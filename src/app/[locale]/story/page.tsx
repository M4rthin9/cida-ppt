import { Link } from "@/i18n/navigation";
import { StorySection } from "@/components/vocational/StorySection";
import { publicMetadata } from "@/lib/seo/metadata";
import { getCachedSetting } from "@/lib/settings/cached";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return publicMetadata({
    locale,
    paths: "/story",
    title: "เรื่องราวของเรา",
    description: "จากการฝึกฝน สู่ผลงานที่มีคุณค่า และโอกาสใหม่",
  });
}
export default async function Page() {
  const copy = await getCachedSetting("home");
  return (
    <main id="content">
      <header className="v-story-hero">
        <p className="v-eyebrow">OUR PURPOSE</p>
        <h1>
          เราเชื่อในคุณค่า
          <br />
          ของการฝึกฝน
        </h1>
        <p>
          ทักษะไม่ได้เกิดขึ้นในวันเดียว แต่ค่อย ๆ เติบโตจากการเรียนรู้
          <br />
          ลงมือทำ และใส่ใจในรายละเอียดครั้งแล้วครั้งเล่า
        </p>
      </header>
      <div className="v-story-intro">
        <p>
          ฝึกอาชีพ สร้างทักษะ
          <br />
          สร้างคุณค่า สร้างโอกาสใหม่
        </p>
        <div>
          <p>
            งานฝึกวิชาชีพเป็นพื้นที่ให้ผู้ต้องขังได้เรียนรู้ผ่านการปฏิบัติ ทั้งการเตรียมวัสดุ
            การใช้เครื่องมือ การผลิต และการตรวจสอบความเรียบร้อยของชิ้นงาน
          </p>
          <p>
            ทุกผลงานจึงเป็นส่วนหนึ่งของกระบวนการพัฒนาทักษะ ความละเอียด ความรับผิดชอบ
            และความพร้อมสำหรับการประกอบอาชีพในวันข้างหน้า
          </p>
          <Link className="v-text-link" href="/products">
            สำรวจผลงานจากการฝึกฝน ↗
          </Link>
        </div>
      </div>
      <StorySection copy={copy} />
    </main>
  );
}
