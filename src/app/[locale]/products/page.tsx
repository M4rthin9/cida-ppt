import { Catalog } from "@/components/vocational/Catalog";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "ผลิตภัณฑ์งานฝึกวิชาชีพ",
  description: "สำรวจงานฝีมือและผลิตภัณฑ์จากฝ่ายฝึกวิชาชีพผู้ต้องขัง ทัณฑสถานบำบัดพิเศษกลาง",
  alternates: { canonical: "/products" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <main id="content" className="v-page">
      <header className="v-page-title">
        <p className="v-eyebrow">CRAFTED WITH PURPOSE</p>
        <h1>
          ผลงานจากทักษะ
          <br />
          <span>คุณค่าจากความตั้งใจ</span>
        </h1>
        <p>
          สำรวจผลิตภัณฑ์และรายละเอียดของงานฝีมือ
          <br />
          ที่เกิดจากกระบวนการฝึกวิชาชีพ
        </p>
      </header>
      <Catalog query={await searchParams} />
    </main>
  );
}
