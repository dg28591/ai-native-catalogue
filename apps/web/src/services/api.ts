import type { Product } from "../types/product";
import type { EnquirySubmission } from "../types/enquiry";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, init);
  } catch {
    throw new ApiError(0, "Could not reach the catalogue. Check your connection and try again.");
  }

  if (!response.ok) {
    let message = "Something went wrong while loading the catalogue.";
    let fields: Record<string, string> | undefined;
    try {
      const body = (await response.json()) as {
        error?: { message?: string; fields?: Record<string, string> };
      };
      message = body.error?.message ?? message;
      fields = body.error?.fields;
    } catch {
      // Infrastructure errors may not include a JSON response body.
    }
    throw new ApiError(response.status, message, fields);
  }

  return (await response.json()) as T;
}

const get = <T>(path: string) => request<T>(path);

export const getFeaturedProducts = () => get<Product[]>("/products/featured");
export const getProducts = () => get<Product[]>("/products");
export const getCategories = () => get<string[]>("/products/categories");
export const getProductsByCategory = (category: string) =>
  get<Product[]>(`/products/category/${encodeURIComponent(category)}`);
export const searchProducts = (query: string) =>
  query
    ? get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`)
    : Promise.resolve([]);
export const getProductById = (id: string) => get<Product>(`/products/${encodeURIComponent(id)}`);
export const getProductImageUrl = (id: number) => `${apiBaseUrl}/products/image/${id}`;
export const submitEnquiry = (enquiry: EnquirySubmission) =>
  request<{ message: string }>("/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enquiry),
  });