import type { Product } from "./product.js";

export interface ProductProvider {
  listProducts(): Promise<Product[]>;
  listProductsByCategory(category: string): Promise<Product[]>;
  listCategories(): Promise<string[]>;
  getProductById(id: number): Promise<Product | undefined>;
}

export class ProductProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductProviderError";
  }
}