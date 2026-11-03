import { ArrowUpRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types/product";
import { ProductImage } from "./product-image";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card" data-testid="product-card">
      <Link className="product-card-link" to={`/product/${product.id}`}>
        <div className="product-card-image-wrap">
          <ProductImage product={product} />
          <span className="product-category">{product.category}</span>
        </div>
        <div className="product-card-info">
          <div className="product-card-title-row">
            <h3>{product.title}</h3>
            <ArrowUpRight size={17} aria-hidden="true" />
          </div>
          <div className="product-card-meta">
            <span className="rating"><Star size={14} fill="currentColor" aria-hidden="true" /> {product.rating.rate.toFixed(1)}</span>
            <span>{product.rating.count} reviews</span>
          </div>
          <strong className="product-price">{currency.format(product.price)}</strong>
        </div>
      </Link>
    </article>
  );
}