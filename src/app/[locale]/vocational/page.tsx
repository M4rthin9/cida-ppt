import { listCategories } from "@/lib/vocational/data";
import { CategoryBento } from "@/components/vocational/CategoryBento";
import { StorySection } from "@/components/vocational/StorySection";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "งานฝึกวิชาชีพผู้ต้องขัง",
  description: "ฝึกอาชีพ สร้างทักษะ และเตรียมความพร้อมสู่การประกอบอาชีพ",
  alternates: { canonical: "/vocational" },
};
export default async function Page() {
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
        <CategoryBento categories={await listCategories()} />
      </div>
      <StorySection />
    </main>
  );
}
