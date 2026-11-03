import type { Product } from "./product.js";

const FEATURED_PRODUCT_COUNT = 5;

function compareByRating(left: Product, right: Product): number {
  return right.rating.rate - left.rating.rate || left.id - right.id;
}

export function getFeaturedProducts(products: Product[]): Product[] {
  return [...products].sort(compareByRating).slice(0, FEATURED_PRODUCT_COUNT);
}

export function orderCategoryProducts(products: Product[]): Product[] {
  const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()];
  const topRated = [...uniqueProducts].sort(compareByRating).slice(0, FEATURED_PRODUCT_COUNT);
  const topRatedIds = new Set(topRated.map((product) => product.id));

  return [...topRated, ...uniqueProducts.filter((product) => !topRatedIds.has(product.id))];
}

export function searchProducts(products: Product[], term: string): Product[] {
  const normalizedTerm = term.toLowerCase();

  return products.filter((product) =>
    [product.title, product.description, product.category].some((text) =>
      text.toLowerCase().includes(normalizedTerm),
    ),
  );
}