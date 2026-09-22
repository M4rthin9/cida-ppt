import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCachedSetting } from "@/lib/settings/cached";
import { publicMetadata } from "@/lib/seo/metadata";
import { goLinePath } from "@/lib/line";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { LineLink } from "@/components/site/line-link";
import { SectionHeading } from "@/components/site/section-heading";
import { ContactForm } from "./contact-form";
import { Link } from "@/i18n/navigation";
import { listProducts } from "@/lib/vocational/data";
import { absoluteUrl, encodePath } from "@/lib/seo/urls";
import { assertEnv } from "@/lib/env";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return publicMetadata({
    locale,
    paths: "/contact",
    title: t("title"),
    description: t("intro"),
  });
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const tNav = await getTranslations("nav");
  const tLine = await getTranslations("line");
  const query = await searchParams;
  const slug = typeof query.product === "string" ? query.product.trim().slice(0, 255) : undefined;
  // Product context is looked up from published records; arbitrary query text
  // never becomes a product name, SKU or destination in the inquiry.
  const product = slug ? (await listProducts({ slug, limit: 1 })).items[0] : undefined;
  const productUrl = product
    ? absoluteUrl(assertEnv().NEXT_PUBLIC_SITE_URL, locale, encodePath(`/products/${product.slug}`))
    : undefined;
  const inquiryBody = product
    ? [
        `สนใจสอบถามเกี่ยวกับ ${product.name_th}`,
        product.sku ? `รหัสสินค้า: ${product.sku}` : undefined,
        `รายละเอียดสินค้า: ${productUrl}`,
        "",
        "รายละเอียดที่ต้องการสอบถาม: ",
      ]
        .filter((line) => line !== undefined)
        .join("\n")
    : undefined;

  const [general, contact, line] = await Promise.all([
    getCachedSetting("general", locale),
    getCachedSetting("contact", locale),
    getCachedSetting("line", locale),
  ]);

  return (
    <main id="content" className="v-page v-contact">
      <Breadcrumbs items={[{ href: "/", label: tNav("home") }, { label: t("title") }]} />

      <header className="v-page-title">
        <p className="v-eyebrow">LET’S START A CONVERSATION</p>
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </header>

      <div className="v-contact-layout">
        {/*
         * Phone, address and LINE at the same weight — a public-sector body
         * cannot make a chat app the only way to reach it (§14, raised by the
         * seal). The LINE block is one of the three, not the page's headline.
         */}
        <section className="v-contact-channels" aria-labelledby="contact-channels">
          <SectionHeading id="contact-channels">{t("channels")}</SectionHeading>

          <dl className="mt-8 divide-y divide-(--color-border) border-y border-(--color-border)">
            {contact.phone && (
              <div className="grid grid-cols-3 gap-4 py-4">
                <dt className="text-sm text-(--color-text-muted)">{t("phone")}</dt>
                <dd className="col-span-2">
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className="lat text-(--color-brand) hover:text-(--color-brand-hover)"
                  >
                    {contact.phone}
                  </a>
                </dd>
              </div>
            )}
            {contact.email && (
              <div className="grid grid-cols-3 gap-4 py-4">
                <dt className="text-sm text-(--color-text-muted)">{t("email")}</dt>
                <dd className="col-span-2">
                  <a
                    href={`mailto:${contact.email}`}
                    className="lat text-(--color-brand) hover:text-(--color-brand-hover)"
                  >
                    {contact.email}
                  </a>
                </dd>
              </div>
            )}
            {general.address && (
              <div className="grid grid-cols-3 gap-4 py-4">
                <dt className="text-sm text-(--color-text-muted)">{t("address")}</dt>
                <dd className="col-span-2 text-(--color-text)">{general.address}</dd>
              </div>
            )}
            {general.businessHours && (
              <div className="grid grid-cols-3 gap-4 py-4">
                <dt className="text-sm text-(--color-text-muted)">{t("hours")}</dt>
                <dd className="col-span-2 text-(--color-text)">{general.businessHours}</dd>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 py-4">
              <dt className="text-sm text-(--color-text-muted)">{t("line")}</dt>
              <dd className="col-span-2">
                <p className="lat text-(--color-text)">{tLine("handle", { id: line.oaId })}</p>
                <LineLink href={goLinePath()} className="mt-3">
                  {tLine("openAccount")}
                </LineLink>
              </dd>
            </div>
          </dl>

          {contact.mapEmbedUrl && (
            <div className="mt-10">
              <h2 className="text-xl font-medium">{t("map")}</h2>
              <div className="mt-4 overflow-hidden rounded-(--radius-card) border border-(--color-border)">
                <iframe
                  src={contact.mapEmbedUrl}
                  title={t("map")}
                  loading="lazy"
                  // The embed is operator-supplied; keep it sandboxed and
                  // referrer-free rather than trusting whatever URL was pasted.
                  referrerPolicy="no-referrer-when-downgrade"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  className="aspect-[16/9] w-full border-0"
                />
              </div>
            </div>
          )}
        </section>

        <section className="v-contact-form-panel" aria-labelledby="contact-form">
          <SectionHeading id="contact-form">{t("formTitle")}</SectionHeading>
          {product && (
            <aside
              className="mt-6 rounded-(--radius-card) border border-(--color-border) p-5"
              aria-label="ผลงานที่ต้องการสอบถาม"
            >
              <p className="v-eyebrow">สอบถามเกี่ยวกับผลงาน</p>
              <Link className="v-text-link" href={`/products/${product.slug}`}>
                {product.name_th} ↗
              </Link>
              {product.sku && <p className="mt-2 text-sm">รหัสสินค้า: {product.sku}</p>}
              <Link className="mt-3 inline-block text-sm underline" href="/contact#contact-form">
                สอบถามเรื่องทั่วไป
              </Link>
            </aside>
          )}
          <div className="mt-8">
            <ContactForm
              key={product?.id ?? "general"}
              privacyNote={contact.privacyNote ?? t("privacyDefault")}
              initialSubject={product ? `สอบถามผลงาน: ${product.name_th}`.slice(0, 255) : undefined}
              initialBody={inquiryBody}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
