import { Router } from "express";
import { ApiError } from "../http/api-error.js";
import type { EmailProvider } from "./email/email-provider.js";
import type { ProductProvider } from "../products/product-provider.js";
import { validateEnquiry } from "./validate-enquiry.js";

export function createEnquiryRouter(
  productProvider: ProductProvider,
  emailProvider: EmailProvider,
): Router {
  const router = Router();

  router.post("/", async (request, response) => {
    const enquiry = validateEnquiry(request.body);
    const product = await productProvider.getProductById(enquiry.productId);
    if (!product) {
      throw new ApiError(404, "product_not_found", "The product for this enquiry was not found.");
    }

    await emailProvider.sendEnquiry(enquiry, product);
    response.status(201).json({ message: "Your enquiry was received." });
  });

  return router;
}