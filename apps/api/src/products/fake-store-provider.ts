import type { Product } from "./product.js";
import { ProductProviderError, type ProductProvider } from "./product-provider.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProduct(value: unknown): value is Product {
  if (!isRecord(value) || !isRecord(value.rating)) {
    return false;
  }

  return (
    Number.isSafeInteger(value.id) &&
    typeof value.title === "string" &&
    typeof value.price === "number" &&
    typeof value.description === "string" &&
    typeof value.category === "string" &&
    typeof value.image === "string" &&
    typeof value.rating.rate === "number" &&
    typeof value.rating.count === "number"
  );
}

function isProductList(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}

function isCategoryList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((category) => typeof category === "string");
}

export class FakeStoreProductProvider implements ProductProvider {
  private readonly baseUrl: string;

  constructor(
    baseUrl = process.env.FAKE_STORE_API_BASE_URL ?? "https://fakestoreapi.com",
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  listProducts(): Promise<Product[]> {
    return this.request("/products", isProductList);
  }

  listProductsByCategory(category: string): Promise<Product[]> {
    return this.request(`/products/category/${encodeURIComponent(category)}`, isProductList);
  }

  listCategories(): Promise<string[]> {
    return this.request("/products/categories", isCategoryList);
  }

  getProductById(id: number): Promise<Product | undefined> {
    return this.request(`/products/${id}`, (value) => value === null || isProduct(value), true);
  }

  private async request<T>(
    path: string,
    isValid: (value: unknown) => boolean,
    allowNotFound = false,
  ): Promise<T> {
    let response: Response;

    try {
      response = await this.fetcher(`${this.baseUrl}${path}`);
    } catch {
      throw new ProductProviderError("Unable to reach the product provider.");
    }

    if (allowNotFound && response.status === 404) {
      return undefined as T;
    }

    if (!response.ok) {
      throw new ProductProviderError("The product provider returned an error.");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ProductProviderError("The product provider returned invalid data.");
    }

    if (!isValid(payload)) {
      throw new ProductProviderError("The product provider returned invalid data.");
    }

    return payload as T;
  }
}