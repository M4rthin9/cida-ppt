import { requireOwner } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings/store";
import { saveSettingsAction } from "../actions";
import { SettingsForm, type FieldSpec } from "../settings-form";

export const metadata = { title: "หน้าแรก" };

const PER_LINE = "ขึ้นบรรทัดใหม่เพื่อแยกบรรทัด";

const FIELDS: FieldSpec[] = [
  {
    section: "Scrollymation ช่วงที่ 1 (frame 1–100)",
    name: "heroBadge",
    label: "ป้ายชื่อ",
    required: true,
  },
  { name: "heroBadgeNote", label: "ข้อความรองในป้ายชื่อ" },
  { name: "heroTitle", label: "หัวข้อ", required: true },
  { name: "heroTitleAccent", label: "หัวข้อบรรทัดที่สอง" },
  { name: "heroCta", label: "ข้อความบนปุ่ม", required: true },
  {
    name: "heroLede",
    label: "คำบรรยาย",
    type: "textarea",
    hint: "หนึ่งบรรทัดต่อหนึ่งคำบรรยาย สูงสุด 3 บรรทัด",
  },
  { name: "heroWordmark", label: "ชื่อที่แสดงตอนจบฉาก" },

  {
    section: "Scrollymation ช่วงที่ 2 (frame 101–200)",
    name: "apertureEyebrow",
    label: "หัวข้อย่อย (ภาษาอังกฤษ)",
  },
  { name: "apertureTitle", label: "หัวข้อ", required: true },
  { name: "apertureTitleAccent", label: "หัวข้อบรรทัดที่สอง" },
  { name: "apertureLede", label: "คำอธิบาย", type: "textarea" },
  { name: "apertureCta", label: "ข้อความบนปุ่ม", required: true },
  {
    name: "apertureWords",
    label: "คำในกรอบภาพ",
    type: "textarea",
    hint: "หนึ่งคำต่อบรรทัด สูงสุด 3 คำ แสดงเมื่อยังไม่มีวิดีโอประกอบ",
  },

  {
    section: "แถบข้อความเลื่อน",
    name: "marqueeWords",
    label: "คำเพิ่มเติม",
    type: "textarea",
    hint: "หนึ่งคำต่อบรรทัด แสดงต่อจากชื่อหมวดหมู่",
  },

  {
    section: "หมวดหมู่ผลงาน (Craft Collections)",
    name: "collectionsEyebrow",
    label: "หัวข้อย่อย (ภาษาอังกฤษ)",
  },
  { name: "collectionsTitle", label: "หัวข้อ", required: true },
  { name: "collectionsTitleAccent", label: "หัวข้อบรรทัดที่สอง" },
  { name: "collectionsIntro", label: "คำอธิบาย", type: "textarea", hint: PER_LINE },
  { name: "collectionsCta", label: "ข้อความลิงก์", required: true },
  { name: "storyNoteEyebrow", label: "การ์ดเรื่องราว — หัวข้อย่อย" },
  {
    name: "storyNoteTitle",
    label: "การ์ดเรื่องราว — หัวข้อ",
    type: "textarea",
    required: true,
    hint: PER_LINE,
  },
  { name: "storyNoteCta", label: "การ์ดเรื่องราว — ข้อความลิงก์", required: true },
  { name: "featuredNoteEyebrow", label: "การ์ดสินค้าแนะนำ — หัวข้อย่อย" },
  {
    name: "featuredNoteTitle",
    label: "การ์ดสินค้าแนะนำ — หัวข้อ",
    type: "textarea",
    required: true,
    hint: PER_LINE,
  },
  { name: "featuredNoteCta", label: "การ์ดสินค้าแนะนำ — ข้อความลิงก์", required: true },

  {
    section: "ขั้นตอนการฝึก (The Skill Behind the Craft)",
    name: "storyEyebrow",
    label: "หัวข้อย่อย (ภาษาอังกฤษ)",
  },
  { name: "storyTitle", label: "หัวข้อ", required: true },
  { name: "storyTitleAccent", label: "หัวข้อบรรทัดที่สอง" },
  { name: "storyBody", label: "คำอธิบาย", type: "textarea" },
  { name: "storyCta", label: "ข้อความลิงก์", required: true },
  {
    name: "storySteps",
    label: "ขั้นตอน",
    type: "textarea",
    rows: 6,
    hint: "หนึ่งขั้นตอนต่อบรรทัด ในรูปแบบ หัวข้อ | คำอธิบาย",
  },

  {
    section: "ผลงานแนะนำ (Selected Works)",
    name: "featuredEyebrow",
    label: "หัวข้อย่อย (ภาษาอังกฤษ)",
  },
  { name: "featuredTitle", label: "หัวข้อ", required: true },
  { name: "featuredCta", label: "ข้อความลิงก์", required: true },
  {
    name: "featuredEmptyCta",
    label: "ข้อความลิงก์เมื่อยังไม่มีสินค้าแนะนำ",
    required: true,
  },

  {
    section: "ข่าวและกิจกรรม",
    name: "newsEyebrow",
    label: "หัวข้อย่อย (ภาษาอังกฤษ)",
  },
  { name: "newsTitle", label: "หัวข้อ", type: "textarea", required: true, hint: PER_LINE },
  { name: "newsCta", label: "ข้อความลิงก์", required: true },

  {
    section: "ส่วนปิดท้าย",
    name: "closingEyebrow",
    label: "หัวข้อย่อย (ภาษาอังกฤษ)",
  },
  { name: "closingTitle", label: "หัวข้อ", type: "textarea", required: true, hint: PER_LINE },
  { name: "closingCta", label: "ข้อความบนปุ่ม", required: true },
];

export default async function Page() {
  await requireOwner();
  const values = await getSetting("home");
  const action = saveSettingsAction.bind(null, "home");
  return <SettingsForm action={action} fields={FIELDS} values={values} />;
}
