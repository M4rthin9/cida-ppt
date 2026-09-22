import { Catalog } from "@/components/vocational/Catalog";
import type { PublicSearchParams } from "@/components/vocational/catalog-query";
import { publicMetadata } from "@/lib/seo/metadata";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return publicMetadata({
    locale,
    paths: "/products",
    title: "ผลิตภัณฑ์งานฝึกวิชาชีพ",
    description: "สำรวจงานฝีมือและผลิตภัณฑ์จากฝ่ายฝึกวิชาชีพผู้ต้องขัง ทัณฑสถานบำบัดพิเศษกลาง",
  });
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>;
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
