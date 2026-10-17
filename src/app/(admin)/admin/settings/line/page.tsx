import { requireOwner } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings/store";
import { saveSettingsAction } from "../actions";
import { SettingsForm, type FieldSpec } from "../settings-form";

export const metadata = { title: "LINE" };

const FIELDS: FieldSpec[] = [
  {
    name: "mode",
    label: "LINE ที่แสดงบนเว็บไซต์",
    type: "select",
    required: true,
    options: { oa: "LINE Official Account (OA)", phone: "เพิ่มเพื่อนด้วยเบอร์โทรศัพท์" },
    hint: "ปุ่ม LINE หน้าเว็บและหน้าสินค้าจะใช้ช่องทางที่เลือก",
  },
  {
    name: "oaId",
    label: "รหัส LINE Official Account",
    placeholder: "@355kxfoj",
    hint: "จำเป็นเมื่อเลือก LINE OA เก็บไว้เพื่อสลับกลับมาใช้ได้",
  },
  {
    name: "phone",
    label: "เบอร์โทรสำหรับเพิ่มเพื่อน LINE",
    type: "tel",
    placeholder: "0812345678 หรือ +66812345678",
    hint: "จำเป็นเมื่อเลือกเบอร์โทร ใช้เบอร์ที่ผูกกับ LINE และเปิดให้ค้นหาด้วยเบอร์โทร",
  },
  { name: "buttonLabel", label: "ข้อความบนปุ่ม", required: true },
  {
    name: "messageTemplate",
    label: "ข้อความตั้งต้น",
    type: "textarea",
    required: true,
    hint: "ใช้ {product_name} และ {product_url} แทนชื่อและลิงก์สินค้า",
  },
];

export default async function Page() {
  await requireOwner();
  const values = await getSetting("line");
  const action = saveSettingsAction.bind(null, "line");
  return <SettingsForm action={action} fields={FIELDS} values={values} />;
}
