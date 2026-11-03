import type { EnquiryFieldErrors } from "../types/enquiry";

export interface EnquiryFormValues {
  customerName: string;
  email: string;
  phone: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;

export function validateEnquiry(values: EnquiryFormValues): EnquiryFieldErrors {
  const errors: EnquiryFieldErrors = {};
  const customerName = values.customerName.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const message = values.message.trim();

  if (customerName.length < 2 || customerName.length > 100 || /[\u0000-\u001f\u007f]/.test(customerName)) {
    errors.customerName = "Enter a name between 2 and 100 characters.";
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phone.length > 25 || !PHONE_PATTERN.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = "Enter a phone number with 7 to 15 digits.";
  }
  if (message.length < 10 || message.length > 2000 || message.includes("\u0000")) {
    errors.message = "Enter a message between 10 and 2000 characters.";
  }

  return errors;
}