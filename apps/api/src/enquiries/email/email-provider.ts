import type { Product } from "../../products/product.js";
import type { EnquiryInput } from "../enquiry.js";

export interface EmailProvider {
  sendEnquiry(enquiry: EnquiryInput, product: Product): Promise<void>;
}

export class EmailProviderError extends Error {
  constructor(message = "Enquiry email delivery failed.") {
    super(message);
    this.name = "EmailProviderError";
  }
}

export interface OutboundEmail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export type EmailSender = (email: OutboundEmail) => Promise<unknown>;