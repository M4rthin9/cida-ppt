import { Link } from "@/i18n/navigation";
export function StorySection() {
  return (
    <section className="v-story" id="story">
      <div>
        <p className="v-eyebrow">THE SKILL BEHIND THE CRAFT</p>
        <h2>
          จากการฝึกฝน
          <br />
          <span>สู่ผลงานที่มีคุณค่า</span>
        </h2>
        <p>
          ทุกขั้นตอนของการผลิตคือกระบวนการเรียนรู้ ทั้งทักษะ ความรับผิดชอบ ความละเอียด
          และมาตรฐานในการทำงาน
        </p>
        <Link className="v-text-link" href="/story">
          เรื่องราวของเรา ↗
        </Link>
      </div>
      <ol>
        {[
          ["ฝึกฝน", "เรียนรู้จากการลงมือทำจริง"],
          ["พัฒนาทักษะ", "ใส่ใจในวัสดุ เครื่องมือ และรายละเอียด"],
          ["สร้างผลงาน", "ฝึกความรับผิดชอบในทุกขั้นตอน"],
          ["สร้างคุณค่า", "ถ่ายทอดความตั้งใจผ่านงานฝีมือ"],
          ["สร้างโอกาสใหม่", "เตรียมความพร้อมสู่การประกอบอาชีพ"],
        ].map(([title, copy], i) => (
          <li key={title}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
            <span>↗</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
