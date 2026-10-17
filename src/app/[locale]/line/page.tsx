import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { getCachedSetting } from "@/lib/settings/cached";
import { addFriendUrl, renderMessageTemplate } from "@/lib/line";
import { listProducts } from "@/lib/vocational/data";
import { absoluteUrl, encodePath } from "@/lib/seo/urls";
import { assertEnv } from "@/lib/env";
import { PhoneCard } from "./phone-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "เพิ่มเพื่อน LINE", robots: { index: false, follow: false } };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ p?: string | string[] }>;
}) {
  const { locale } = await params;
  const line = await getCachedSetting("line", locale);
  if (line.mode === "oa") redirect(addFriendUrl(line.oaId));
  const query = await searchParams;
  const slug = typeof query.p === "string" ? query.p.trim().slice(0, 255) : undefined;
  const product = slug ? (await listProducts({ slug, limit: 1 })).items[0] : undefined;
  let message: string | undefined;
  if (product) {
    const [row] = await db
      .select({ override: products.lineMessageOverride })
      .from(products)
      .where(eq(products.id, product.id))
      .limit(1);
    message = renderMessageTemplate(row?.override?.trim() || line.messageTemplate, {
      product_name: product.name_th + (product.sku ? ` [${product.sku}]` : ""),
      product_url: absoluteUrl(
        assertEnv().NEXT_PUBLIC_SITE_URL,
        locale,
        encodePath(`/products/${product.slug}`),
      ),
      sku: product.sku ?? "",
    });
  }
  return (
    <main id="content" className="v-page v-line-page">
      <nav className="v-breadcrumb" aria-label="เส้นทาง">
        <Link href="/">หน้าแรก</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">เพิ่มเพื่อน LINE</span>
      </nav>
      <header className="v-page-title">
        <p className="v-eyebrow">LET’S START A CONVERSATION</p>
        <h1>เพิ่มเพื่อน LINE ด้วยเบอร์โทร</h1>
        <p>ติดต่อเจ้าหน้าที่เพื่อสอบถามรายละเอียดและสั่งซื้อสินค้า</p>
      </header>
      <PhoneCard phone={line.phone} message={message} />
      {product && (
        <p className="v-line-back">
          <Link className="v-text-link" href={`/products/${product.slug}`}>
            กลับไปที่ {product.name_th} →
          </Link>
        </p>
      )}
    </main>
  );
}
