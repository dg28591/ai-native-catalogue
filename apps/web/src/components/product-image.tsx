import { useState } from "react";
import { ImageOff } from "lucide-react";
import { getProductImageUrl } from "../services/api";
import type { Product } from "../types/product";

export function ProductImage({ product, large = false }: { product: Product; large?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`product-image-fallback${large ? " product-image-large" : ""}`}>
        <ImageOff aria-hidden="true" />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      className={`product-image${large ? " product-image-large" : ""}`}
      src={getProductImageUrl(product.id)}
      alt={product.title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}