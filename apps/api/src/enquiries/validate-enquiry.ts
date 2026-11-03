import { ApiError } from "../http/api-error.js";
import type { EnquiryInput } from "./enquiry.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateEnquiry(value: unknown): EnquiryInput {
  if (!isRecord(value)) {
    throw new ApiError(400, "invalid_enquiry", "Enter valid enquiry details.", {
      form: "Enter valid enquiry details.",
    });
  }

  const fields: Record<string, string> = {};
  const productId = value.productId;
  const customerName = typeof value.customerName === "string" ? value.customerName.trim() : "";
  const email = typeof value.email === "string" ? value.email.trim() : "";
  const phone = typeof value.phone === "string" ? value.phone.trim() : "";
  const message = typeof value.message === "string" ? value.message.trim() : "";

  if (!Number.isSafeInteger(productId) || (productId as number) < 1) {
    fields.productId = "Select a valid product.";
  }
  if (customerName.length < 2 || customerName.length > 100 || /[\u0000-\u001f\u007f]/.test(customerName)) {
    fields.customerName = "Enter a name between 2 and 100 characters.";
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fields.email = "Enter a valid email address.";
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phone.length > 25 || !PHONE_PATTERN.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    fields.phone = "Enter a phone number with 7 to 15 digits.";
  }
  if (message.length < 10 || message.length > 2000 || message.includes("\u0000")) {
    fields.message = "Enter a message between 10 and 2000 characters.";
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, "invalid_enquiry", "Please correct the highlighted fields.", fields);
  }

  return {
    productId: productId as number,
    customerName,
    email,
    phone,
    message,
  };
}