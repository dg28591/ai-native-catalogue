import express from "express";
import { createEmailProvider } from "./enquiries/email/create-email-provider.js";
import type { EmailProvider } from "./enquiries/email/email-provider.js";
import { createEnquiryRateLimiter } from "./enquiries/enquiry-rate-limit.js";
import { createEnquiryRouter } from "./enquiries/enquiry-routes.js";
import { errorHandler } from "./http/error-handler.js";
import { FakeStoreProductProvider } from "./products/fake-store-provider.js";
import { createProductRouter } from "./products/product-routes.js";
import type { ProductProvider } from "./products/product-provider.js";

export function createApp(
  provider: ProductProvider = new FakeStoreProductProvider(),
  imageFetcher: typeof fetch = fetch,
  emailProvider: EmailProvider = createEmailProvider(),
) {
  const app = express();
  app.use(express.json({ limit: "16kb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/api/products", createProductRouter(provider, imageFetcher));
  app.use(
    "/api/enquiries",
    createEnquiryRateLimiter(),
    createEnquiryRouter(provider, emailProvider),
  );
  app.use((_request, response) => {
    response.status(404).json({
      error: { code: "not_found", message: "The requested resource was not found." },
    });
  });
  app.use(errorHandler);

  return app;
}