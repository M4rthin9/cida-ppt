import { priceLabel, type Product } from "@/lib/vocational/types";

export function ProductPrice({
  product: p,
}: {
  product: Pick<Product, "price_mode" | "price" | "sale_price" | "sharing_price">;
}) {
  if (p.price_mode === "exact" && p.price !== null && p.sharing_price !== null) {
    const format = (value: string) => `${Number(value).toLocaleString("th-TH")} บาท`;
    return (
      <dl className="v-price-options">
        <div>
          <dt>ราคาแบ่งปัน</dt>
          <dd>{format(p.sharing_price)}</dd>
        </div>
        <div>
          <dt>ราคาขายขาด</dt>
          <dd>{format(p.price)}</dd>
        </div>
      </dl>
    );
  }
  return (
    <>
      <span>{priceLabel(p)}</span>
      {(p.price_mode === "exact" || p.price_mode === "from") &&
        p.sale_price !== null &&
        p.price !== null && <del>{Number(p.price).toLocaleString("th-TH")} บาท</del>}
    </>
  );
}
