import { Router } from "express";
import { ApiError } from "../http/api-error.js";
import {
  getFeaturedProducts,
  orderCategoryProducts,
  searchProducts,
} from "./catalogue-service.js";
import { ProductProviderError, type ProductProvider } from "./product-provider.js";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const RASTER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function readImageBody(body: ReadableStream<Uint8Array> | null): Promise<Buffer> {
  if (!body) {
    throw new ProductProviderError("The product image could not be loaded.");
  }

  const reader = body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new ProductProviderError("The product image is too large.");
      }

      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    if (error instanceof ProductProviderError) throw error;
    throw new ProductProviderError("The product image could not be loaded.");
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}

export function createProductRouter(
  provider: ProductProvider,
  imageFetcher: typeof fetch = fetch,
): Router {
  const router = Router();

  router.get("/featured", async (_request, response) => {
    response.json(getFeaturedProducts(await provider.listProducts()));
  });

  router.get("/categories", async (_request, response) => {
    response.json(await provider.listCategories());
  });

  router.get("/image/:id", async (request, response) => {
    const idValue = request.params.id;
    if (!/^\d+$/.test(idValue)) {
      throw new ApiError(400, "invalid_product_id", "Product ID must be a positive integer.");
    }

    const id = Number(idValue);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new ApiError(400, "invalid_product_id", "Product ID must be a positive integer.");
    }

    const product = await provider.getProductById(id);
    if (!product) {
      throw new ApiError(404, "product_not_found", "The requested product was not found.");
    }

    let imageUrl: URL;
    try {
      imageUrl = new URL(product.image);
    } catch {
      throw new ProductProviderError("The product image URL is invalid.");
    }

    if (
      imageUrl.protocol !== "https:" ||
      imageUrl.hostname !== "fakestoreapi.com" ||
      imageUrl.port !== "" ||
      imageUrl.username !== "" ||
      imageUrl.password !== "" ||
      !imageUrl.pathname.startsWith("/img/")
    ) {
      throw new ProductProviderError("The product image URL is not allowed.");
    }

    let imageResponse: Response;
    try {
      imageResponse = await imageFetcher(imageUrl, {
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new ProductProviderError("The product image could not be loaded.");
    }

    const contentType = imageResponse.headers.get("content-type")?.split(";")[0].toLowerCase();
    if (!imageResponse.ok || !contentType || !RASTER_IMAGE_TYPES.has(contentType)) {
      throw new ProductProviderError("The product image could not be loaded.");
    }

    const image = await readImageBody(imageResponse.body);

    response
      .set("Content-Type", contentType)
      .set("X-Content-Type-Options", "nosniff")
      .set("Cache-Control", "public, max-age=86400")
      .send(image);
  });

  router.get("/category", () => {
    throw new ApiError(400, "invalid_category", "A product category is required.");
  });

  router.get("/category/:category", async (request, response) => {
    const requestedCategory = request.params.category.trim();
    if (!requestedCategory) {
      throw new ApiError(400, "invalid_category", "A product category is required.");
    }

    const categories = await provider.listCategories();
    const category = categories.find(
      (availableCategory) => availableCategory.toLowerCase() === requestedCategory.toLowerCase(),
    );
    if (!category) {
      throw new ApiError(404, "category_not_found", "The requested category was not found.");
    }

    const products = await provider.listProductsByCategory(category);
    response.json(orderCategoryProducts(products));
  });

  router.get("/search", async (request, response) => {
    const query = request.query.q;
    if (typeof query !== "string" || !query.trim() || query.trim().length > 200) {
      throw new ApiError(
        400,
        "invalid_search_query",
        "Provide a search term between 1 and 200 characters.",
      );
    }

    response.json(searchProducts(await provider.listProducts(), query.trim().toLowerCase()));
  });

  router.get("/", async (_request, response) => {
    response.json(await provider.listProducts());
  });

  router.get("/:id", async (request, response) => {
    const idValue = request.params.id;
    if (!/^\d+$/.test(idValue)) {
      throw new ApiError(400, "invalid_product_id", "Product ID must be a positive integer.");
    }

    const id = Number(idValue);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new ApiError(400, "invalid_product_id", "Product ID must be a positive integer.");
    }

    const product = await provider.getProductById(id);
    if (!product) {
      throw new ApiError(404, "product_not_found", "The requested product was not found.");
    }

    response.json(product);
  });

  return router;
}