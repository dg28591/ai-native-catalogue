import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import type { Product } from "./product.js";
import { ProductProviderError, type ProductProvider } from "./product-provider.js";

const products: Product[] = [
  {
    id: 1,
    title: "Copper kettle",
    price: 35,
    description: "A polished kettle for daily use.",
    category: "electronics",
    image: "https://example.test/1.jpg",
    rating: { rate: 4.2, count: 10 },
  },
  {
    id: 2,
    title: "Wireless audio",
    price: 80,
    description: "Portable sound for every room.",
    category: "electronics",
    image: "https://example.test/2.jpg",
    rating: { rate: 4.9, count: 20 },
  },
  {
    id: 3,
    title: "Desk lamp",
    price: 24,
    description: "A bright reading lamp.",
    category: "electronics",
    image: "https://example.test/3.jpg",
    rating: { rate: 3, count: 5 },
  },
  {
    id: 4,
    title: "Travel speaker",
    price: 55,
    description: "Compact and clear audio.",
    category: "electronics",
    image: "https://example.test/4.jpg",
    rating: { rate: 4.7, count: 12 },
  },
  {
    id: 5,
    title: "Moonstone ring",
    price: 110,
    description: "A silver ring with moonstone.",
    category: "jewelery",
    image: "https://example.test/5.jpg",
    rating: { rate: 4.1, count: 8 },
  },
  {
    id: 6,
    title: "USB hub",
    price: 18,
    description: "Extra ports for your computer.",
    category: "electronics",
    image: "https://example.test/6.jpg",
    rating: { rate: 2.5, count: 3 },
  },
  {
    id: 8,
    title: "Optical mouse",
    price: 22,
    description: "A quiet mouse for office work.",
    category: "electronics",
    image: "https://example.test/8.jpg",
    rating: { rate: 1.8, count: 2 },
  },
  {
    id: 7,
    title: "Silver chain",
    price: 42,
    description: "A simple everyday necklace.",
    category: "jewelery",
    image: "https://example.test/7.jpg",
    rating: { rate: 4.8, count: 15 },
  },
];

function createProvider(): ProductProvider {
  return {
    listProducts: vi.fn(async () => products),
    listProductsByCategory: vi.fn(async (category) =>
      products.filter((product) => product.category === category),
    ),
    listCategories: vi.fn(async () => ["electronics", "jewelery"]),
    getProductById: vi.fn(async (id) => products.find((product) => product.id === id)),
  };
}

describe("product catalogue routes", () => {
  it("returns the five highest-rated featured products", async () => {
    const response = await request(createApp(createProvider())).get("/api/products/featured");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    expect(response.body.map((product: Product) => product.id)).toEqual([2, 7, 4, 1, 5]);
  });

  it("lists products and categories", async () => {
    const app = createApp(createProvider());

    const productResponse = await request(app).get("/api/products");
    const categoryResponse = await request(app).get("/api/products/categories");

    expect(productResponse.status).toBe(200);
    expect(productResponse.body).toHaveLength(products.length);
    expect(categoryResponse.status).toBe(200);
    expect(categoryResponse.body).toEqual(["electronics", "jewelery"]);
  });

  it("returns top-rated category products first without duplicates", async () => {
    const provider = createProvider();
    vi.mocked(provider.listProductsByCategory).mockResolvedValue([
      ...products.filter((product) => product.category === "electronics"),
      products[1],
    ]);

    const response = await request(createApp(provider)).get(
      "/api/products/category/Electronics",
    );

    expect(response.status).toBe(200);
    expect(response.body.map((product: Product) => product.id)).toEqual([2, 4, 1, 3, 6, 8]);
    expect(new Set(response.body.map((product: Product) => product.id)).size).toBe(6);
  });

  it("searches title, description, and category case-insensitively", async () => {
    const app = createApp(createProvider());

    const titleResponse = await request(app).get("/api/products/search?q=wireless");
    const descriptionResponse = await request(app).get("/api/products/search?q=moonstone");
    const categoryResponse = await request(app).get("/api/products/search?q=JEWELERY");

    expect(titleResponse.body.map((product: Product) => product.id)).toEqual([2]);
    expect(descriptionResponse.body.map((product: Product) => product.id)).toEqual([5]);
    expect(categoryResponse.body.map((product: Product) => product.id)).toEqual([5, 7]);
  });

  it("validates search queries and categories", async () => {
    const app = createApp(createProvider());

    const missingSearchResponse = await request(app).get("/api/products/search");
    const unknownCategoryResponse = await request(app).get(
      "/api/products/category/not-a-category",
    );
    const missingCategoryResponse = await request(app).get("/api/products/category/");

    expect(missingSearchResponse.status).toBe(400);
    expect(unknownCategoryResponse.status).toBe(404);
    expect(missingCategoryResponse.status).toBe(400);
  });

  it("validates product IDs and returns 404 for missing products", async () => {
    const app = createApp(createProvider());

    const productResponse = await request(app).get("/api/products/2");
    const invalidIdResponse = await request(app).get("/api/products/2x");
    const missingProductResponse = await request(app).get("/api/products/999");

    expect(productResponse.status).toBe(200);
    expect(productResponse.body.id).toBe(2);
    expect(invalidIdResponse.status).toBe(400);
    expect(missingProductResponse.status).toBe(404);
  });

  it("proxies only allowlisted product images through the backend", async () => {
    const provider = createProvider();
    vi.mocked(provider.getProductById).mockResolvedValue({
      ...products[0],
      image: "https://fakestoreapi.com/img/1.jpg",
    });
    const imageFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([255, 216, 255]), {
        headers: { "content-type": "image/jpeg" },
      }),
    );

    const response = await request(createApp(provider, imageFetcher)).get(
      "/api/products/image/1",
    );

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("image/jpeg");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(imageFetcher).toHaveBeenCalledWith(
      new URL("https://fakestoreapi.com/img/1.jpg"),
      expect.objectContaining({ redirect: "error" }),
    );
  });

  it("rejects image URLs outside the Fake Store image host", async () => {
    const provider = createProvider();
    const imageFetcher = vi.fn<typeof fetch>();

    const response = await request(createApp(provider, imageFetcher)).get(
      "/api/products/image/1",
    );

    expect(response.status).toBe(502);
    expect(imageFetcher).not.toHaveBeenCalled();
  });

  it("rejects SVG image responses", async () => {
    const provider = createProvider();
    vi.mocked(provider.getProductById).mockResolvedValue({
      ...products[0],
      image: "https://fakestoreapi.com/img/1.svg",
    });
    const imageFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>", {
        headers: { "content-type": "image/svg+xml" },
      }),
    );

    const response = await request(createApp(provider, imageFetcher)).get(
      "/api/products/image/1",
    );

    expect(response.status).toBe(502);
    expect(imageFetcher).toHaveBeenCalledOnce();
  });

  it("cancels an image stream as soon as it exceeds the size limit", async () => {
    const provider = createProvider();
    vi.mocked(provider.getProductById).mockResolvedValue({
      ...products[0],
      image: "https://fakestoreapi.com/img/1.jpg",
    });
    let pulls = 0;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls === 1) controller.enqueue(new Uint8Array(8 * 1024 * 1024));
        else if (pulls === 2) controller.enqueue(new Uint8Array(1));
        else controller.close();
      },
      cancel() {
        cancelled = true;
      },
    }, { highWaterMark: 0 });
    const imageFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(body, { headers: { "content-type": "image/jpeg" } }),
    );

    const response = await request(createApp(provider, imageFetcher)).get(
      "/api/products/image/1",
    );

    expect(response.status).toBe(502);
    expect(cancelled).toBe(true);
  });

  it("returns 502 when the product provider fails", async () => {
    const provider = createProvider();
    vi.mocked(provider.listProducts).mockRejectedValue(
      new ProductProviderError("The product provider returned an error."),
    );

    const response = await request(createApp(provider)).get("/api/products");

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("product_provider_error");
  });
});