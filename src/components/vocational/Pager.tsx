import Link from "next/link";
export function Pager({
  page,
  total,
  limit,
  base,
  query = {},
}: {
  page: number;
  total: number;
  limit: number;
  base: string;
  query?: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  function href(p: number) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v && k !== "page") q.set(k, v);
    q.set("page", String(p));
    return `${base}?${q}`;
  }
  return (
    <nav className="v-pager" aria-label="เปลี่ยนหน้า">
      {page > 1 ? <Link href={href(page - 1)}>← ก่อนหน้า</Link> : <span />}
      <span>
        หน้า {page} จาก {pages}
      </span>
      {page < pages ? <Link href={href(page + 1)}>ถัดไป →</Link> : <span />}
    </nav>
  );
}
