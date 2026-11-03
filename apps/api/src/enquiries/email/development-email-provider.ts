import type { Product } from "../../products/product.js";
import type { EnquiryInput } from "../enquiry.js";
import type { EmailProvider } from "./email-provider.js";

export class DevelopmentEmailProvider implements EmailProvider {
  constructor(private readonly logger: Pick<Console, "info"> = console) {}

  async sendEnquiry(enquiry: EnquiryInput, product: Product): Promise<void> {
    this.logger.info("[development-email-provider] Enquiry received", {
      productId: product.id,
      productTitle: product.title,
      customerName: enquiry.customerName,
      email: enquiry.email,
      phone: enquiry.phone,
      message: enquiry.message,
    });
  }
}