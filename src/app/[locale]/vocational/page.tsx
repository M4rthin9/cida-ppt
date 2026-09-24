import { listCategories } from "@/lib/vocational/data";
import { CategoryBento } from "@/components/vocational/CategoryBento";
import { StorySection } from "@/components/vocational/StorySection";
import { publicMetadata } from "@/lib/seo/metadata";
import { getCachedSetting } from "@/lib/settings/cached";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return publicMetadata({
    locale,
    paths: "/vocational",
    title: "งานฝึกวิชาชีพผู้ต้องขัง",
    description: "ฝึกอาชีพ สร้างทักษะ และเตรียมความพร้อมสู่การประกอบอาชีพ",
  });
}
export default async function Page() {
  const [categories, copy] = await Promise.all([listCategories(), getCachedSetting("home")]);
  return (
    <main id="content">
      <div className="v-page">
        <header className="v-page-title">
          <p className="v-eyebrow">VOCATIONAL TRAINING & REHABILITATION</p>
          <h1>
            เรียนรู้จากการลงมือทำ
            <br />
            <span>เติบโตผ่านทุกขั้นตอน</span>
          </h1>
          <p>
            ฝ่ายฝึกวิชาชีพผู้ต้องขัง ทัณฑสถานบำบัดพิเศษกลาง
            <br />
            พื้นที่เรียนรู้ทักษะอาชีพ ความมีวินัย และความรับผิดชอบผ่านการทำงานจริง
          </p>
        </header>
        <CategoryBento categories={categories} copy={copy} />
      </div>
      <StorySection copy={copy} />
    </main>
  );
}
