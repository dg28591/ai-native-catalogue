import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import type { Product } from "../products/product.js";
import type { ProductProvider } from "../products/product-provider.js";
import { EmailProviderError, type EmailProvider } from "./email/email-provider.js";
import type { EnquiryInput } from "./enquiry.js";

const product: Product = {
  id: 7,
  title: "Sample product",
  price: 25,
  description: "A sample product for enquiry tests.",
  category: "electronics",
  image: "https://fakestoreapi.com/img/sample.jpg",
  rating: { rate: 4.5, count: 10 },
};

const validEnquiry: EnquiryInput = {
  productId: product.id,
  customerName: "Jordan Customer",
  email: "jordan@example.test",
  phone: "+1 212 555 0100",
  message: "Please tell me more about this item.",
};

function createDependencies() {
  const productProvider: ProductProvider = {
    listProducts: vi.fn(async () => [product]),
    listProductsByCategory: vi.fn(async () => [product]),
    listCategories: vi.fn(async () => [product.category]),
    getProductById: vi.fn(async (id) => id === product.id ? product : undefined),
  };
  const emailProvider: EmailProvider = {
    sendEnquiry: vi.fn(async () => undefined),
  };

  return { productProvider, emailProvider };
}

describe("POST /api/enquiries", () => {
  it("sends a valid enquiry and returns success only after delivery", async () => {
    const { productProvider, emailProvider } = createDependencies();
    let finishDelivery: (() => void) | undefined;
    vi.mocked(emailProvider.sendEnquiry).mockImplementation(
      () => new Promise<void>((resolve) => { finishDelivery = resolve; }),
    );
    const responsePromise = request(createApp(productProvider, fetch, emailProvider))
      .post("/api/enquiries")
      .send(validEnquiry)
      .then((response) => response);

    await vi.waitFor(() => expect(emailProvider.sendEnquiry).toHaveBeenCalledWith(validEnquiry, product));
    expect(finishDelivery).toBeDefined();
    finishDelivery?.();
    const response = await responsePromise;

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Your enquiry was received.");
  });

  it("returns field validation errors without attempting delivery", async () => {
    const { productProvider, emailProvider } = createDependencies();
    const response = await request(createApp(productProvider, fetch, emailProvider))
      .post("/api/enquiries")
      .send({
        ...validEnquiry,
        productId: "7",
        customerName: "A",
        email: "invalid",
        phone: "123",
        message: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("invalid_enquiry");
    expect(response.body.error.fields).toEqual({
      productId: "Select a valid product.",
      customerName: "Enter a name between 2 and 100 characters.",
      email: "Enter a valid email address.",
      phone: "Enter a phone number with 7 to 15 digits.",
      message: "Enter a message between 10 and 2000 characters.",
    });
    expect(emailProvider.sendEnquiry).not.toHaveBeenCalled();
  });

  it("rejects enquiries for missing products", async () => {
    const { productProvider, emailProvider } = createDependencies();
    const response = await request(createApp(productProvider, fetch, emailProvider))
      .post("/api/enquiries")
      .send({ ...validEnquiry, productId: 99 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("product_not_found");
    expect(emailProvider.sendEnquiry).not.toHaveBeenCalled();
  });

  it("returns a safe provider error instead of a thank-you response when delivery fails", async () => {
    const { productProvider, emailProvider } = createDependencies();
    vi.mocked(emailProvider.sendEnquiry).mockRejectedValue(new EmailProviderError());
    const response = await request(createApp(productProvider, fetch, emailProvider))
      .post("/api/enquiries")
      .send(validEnquiry);

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("email_provider_error");
    expect(response.body.error.message).toBe("We couldn't send your enquiry. Please try again.");
  });

  it("returns 400 for malformed JSON", async () => {
    const { productProvider, emailProvider } = createDependencies();
    const response = await request(createApp(productProvider, fetch, emailProvider))
      .post("/api/enquiries")
      .set("Content-Type", "application/json")
      .send("{ invalid");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("invalid_json");
  });

  it("allows normal enquiry submissions within the rate limit", async () => {
    const { productProvider, emailProvider } = createDependencies();
    const response = await request(createApp(productProvider, fetch, emailProvider))
      .post("/api/enquiries")
      .send(validEnquiry);

    expect(response.status).toBe(201);
    expect(emailProvider.sendEnquiry).toHaveBeenCalledOnce();
  });

  it("returns 429 after the per-IP enquiry limit is exceeded", async () => {
    const { productProvider, emailProvider } = createDependencies();
    const app = createApp(productProvider, fetch, emailProvider);
    const responses = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(
        await request(app)
          .post("/api/enquiries")
          .send(validEnquiry),
      );
    }

    expect(responses.slice(0, 5).every((response) => response.status === 201)).toBe(true);
    expect(responses[5].status).toBe(429);
    expect(responses[5].body.error.code).toBe("rate_limited");
    expect(emailProvider.sendEnquiry).toHaveBeenCalledTimes(5);
  });
});