import { describe, expect, it, vi } from "vitest";
import { FakeStoreProductProvider } from "./fake-store-provider.js";
import type { Product } from "./product.js";
import { ProductProviderError } from "./product-provider.js";

const product: Product = {
  id: 1,
  title: "Sample product",
  price: 12.5,
  description: "A sample product description.",
  category: "electronics",
  image: "https://fakestoreapi.com/img/sample.jpg",
  rating: { rate: 4.5, count: 10 },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("FakeStoreProductProvider", () => {
  it("returns valid products and normalizes the configured base URL", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([product]));
    const provider = new FakeStoreProductProvider("https://store.test///", fetcher);

    await expect(provider.listProducts()).resolves.toEqual([product]);
    expect(fetcher).toHaveBeenCalledWith("https://store.test/products");
  });

  it("encodes category names and returns categories", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([product]))
      .mockResolvedValueOnce(jsonResponse(["electronics"]));
    const provider = new FakeStoreProductProvider("https://store.test", fetcher);

    await expect(provider.listProductsByCategory("women's clothing")).resolves.toEqual([product]);
    await expect(provider.listCategories()).resolves.toEqual(["electronics"]);
    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://store.test/products/category/women's%20clothing",
    );
    expect(fetcher).toHaveBeenNthCalledWith(2, "https://store.test/products/categories");
  });

  it("returns a valid product by ID", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(product));
    const provider = new FakeStoreProductProvider("https://store.test", fetcher);

    await expect(provider.getProductById(1)).resolves.toEqual(product);
    expect(fetcher).toHaveBeenCalledWith("https://store.test/products/1");
  });

  it("rejects invalid product and category payloads", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([{ ...product, rating: null }]))
      .mockResolvedValueOnce(jsonResponse(["electronics", 42]));
    const provider = new FakeStoreProductProvider("https://store.test", fetcher);

    await expect(provider.listProducts()).rejects.toBeInstanceOf(ProductProviderError);
    await expect(provider.listCategories()).rejects.toBeInstanceOf(ProductProviderError);
  });

  it("maps upstream HTTP, network, and invalid JSON failures", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: "unavailable" }, 503))
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(new Response("not-json", { status: 200 }));
    const provider = new FakeStoreProductProvider("https://store.test", fetcher);

    await expect(provider.listProducts()).rejects.toBeInstanceOf(ProductProviderError);
    await expect(provider.listCategories()).rejects.toBeInstanceOf(ProductProviderError);
    await expect(provider.listProducts()).rejects.toBeInstanceOf(ProductProviderError);
  });

  it("returns undefined for a missing product and errors on list 404", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    const provider = new FakeStoreProductProvider("https://store.test", fetcher);

    await expect(provider.getProductById(999)).resolves.toBeUndefined();
    await expect(provider.listProducts()).rejects.toBeInstanceOf(ProductProviderError);
  });
});