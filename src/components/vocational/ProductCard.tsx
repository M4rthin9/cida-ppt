import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { priceLabel, type Product } from "@/lib/vocational/types";
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="v-product-card">
      <Link href={`/products/${p.slug}`} className="v-product-image" aria-label={`ดู ${p.name_th}`}>
        {p.image_url ? (
          <Image
            src={p.image_url}
            alt={p.name_th}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
          />
        ) : (
          <span className="v-no-image">ยังไม่มีภาพสินค้า</span>
        )}
        {p.is_new && <span className="v-product-badge">ใหม่</span>}
        <span className="v-card-arrow">↗</span>
      </Link>
      <div className="v-product-info">
        <small>{p.category_name}</small>
        <h3>
          <Link href={`/products/${p.slug}`}>{p.name_th}</Link>
        </h3>
        {p.name_en && <p lang="en">{p.name_en}</p>}
        <div className="v-product-price">
          <span>{priceLabel(p)}</span>
          {(p.price_mode === "exact" || p.price_mode === "from") &&
            p.sale_price !== null &&
            p.price !== null && <del>{Number(p.price).toLocaleString("th-TH")} บาท</del>}
        </div>
        {p.stock_status === "out_of_stock" && <small>สินค้าหมดชั่วคราว</small>}
      </div>
    </article>
  );
}
