import { rateLimit } from "express-rate-limit";

const ENQUIRY_RATE_LIMIT = 5;
const ENQUIRY_RATE_WINDOW_MS = 15 * 60 * 1000;

export function createEnquiryRateLimiter() {
  return rateLimit({
    windowMs: ENQUIRY_RATE_WINDOW_MS,
    limit: ENQUIRY_RATE_LIMIT,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        error: {
          code: "rate_limited",
          message: "Too many enquiries. Please try again later.",
        },
      });
    },
  });
}