import type { ErrorRequestHandler } from "express";
import { ApiError } from "./api-error.js";
import { EmailProviderError } from "../enquiries/email/email-provider.js";
import { ProductProviderError } from "../products/product-provider.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
    return;
  }

  if (error instanceof EmailProviderError) {
    response.status(502).json({
      error: { code: "email_provider_error", message: "We couldn't send your enquiry. Please try again." },
    });
    return;
  }

  if (error instanceof ProductProviderError) {
    response.status(502).json({
      error: { code: "product_provider_error", message: error.message },
    });
    return;
  }

  if (typeof error === "object" && error !== null && "type" in error) {
    const bodyErrorType = error.type;
    if (bodyErrorType === "entity.parse.failed") {
      response.status(400).json({
        error: { code: "invalid_json", message: "Request body must be valid JSON." },
      });
      return;
    }
    if (bodyErrorType === "entity.too.large") {
      response.status(413).json({
        error: { code: "request_too_large", message: "Request body is too large." },
      });
      return;
    }
  }

  response.status(500).json({
    error: { code: "internal_server_error", message: "An unexpected error occurred." },
  });
};