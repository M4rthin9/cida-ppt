import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/media/product-image";
import { type Product } from "@/lib/vocational/types";
import { ProductPrice } from "./ProductPrice";
export function ProductCard({
  product: p,
  imageSizes,
  preload = false,
}: {
  product: Product;
  imageSizes?: string;
  preload?: boolean;
}) {
  return (
    <article className="v-product-card">
      <Link href={`/products/${p.slug}`} className="v-product-image" aria-label={`ดู ${p.name_th}`}>
        <ProductImage
          src={p.image_url}
          alt={p.name_th}
          sizes={imageSizes || "(max-width: 380px) 88vw, (max-width: 1000px) 44vw, 30vw"}
          preload={preload}
        />
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
          <ProductPrice product={p} />
        </div>
        {p.stock_status === "out_of_stock" && <small>สินค้าหมดชั่วคราว</small>}
      </div>
    </article>
  );
}
