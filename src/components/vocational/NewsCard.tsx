import Image from "next/image";
import Link from "next/link";
import type { News } from "@/lib/vocational/types";
export function NewsCard({ item: n }: { item: News }) {
  return (
    <article className="v-news-card">
      <Link href={`/news/${n.slug}`}>
        {n.image_url && (
          <div className="v-news-image">
            <Image src={n.image_url} fill sizes="(max-width: 760px) 100vw, 33vw" alt={n.title} />
          </div>
        )}
        <small>
          {n.type === "event" ? "กิจกรรม" : "ข่าวงานฝึกวิชาชีพ"}
          {n.published_at ? ` · ${new Date(n.published_at).toLocaleDateString("th-TH")}` : ""}
        </small>
        <h2>{n.title}</h2>
        <p>{n.excerpt}</p>
        <span className="v-text-link">อ่านเรื่องราว ↗</span>
      </Link>
    </article>
  );
}
