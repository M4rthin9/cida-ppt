import { Link } from "@/i18n/navigation";
import NextLink from "next/link";
export function Pager({
  page,
  total,
  limit,
  base,
  query = {},
  localeAware = true,
}: {
  page: number;
  total: number;
  limit: number;
  base: string;
  query?: Record<string, string | undefined>;
  /** Admin routes live outside the public locale provider. */
  localeAware?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  const PageLink = localeAware ? Link : NextLink;
  function href(p: number) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v && k !== "page") q.set(k, v);
    q.set("page", String(p));
    return `${base}?${q}`;
  }
  return (
    <nav className="v-pager" aria-label="เปลี่ยนหน้า">
      {page > 1 ? <PageLink href={href(page - 1)}>← ก่อนหน้า</PageLink> : <span />}
      <span>
        หน้า {page} จาก {pages}
      </span>
      {page < pages ? <PageLink href={href(page + 1)}>ถัดไป →</PageLink> : <span />}
    </nav>
  );
}
