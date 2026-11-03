import type { Product } from "../types/product";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}