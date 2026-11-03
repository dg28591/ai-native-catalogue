import type { Product } from "../../products/product.js";
import type { EnquiryInput } from "../enquiry.js";
import { EmailProviderError, type EmailProvider, type EmailSender } from "./email-provider.js";

export class SmtpEmailProvider implements EmailProvider {
  constructor(
    private readonly sendMail: EmailSender,
    private readonly from: string,
    private readonly salesInbox: string,
  ) {}

  async sendEnquiry(enquiry: EnquiryInput, product: Product): Promise<void> {
    const text = [
      `Product: ${product.title} (ID ${product.id})`,
      `Customer: ${enquiry.customerName}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone}`,
      "",
      enquiry.message,
    ].join("\n");

    try {
      await this.sendMail({
        from: this.from,
        to: this.salesInbox,
        replyTo: enquiry.email,
        subject: `Product enquiry #${product.id}`,
        text,
      });
    } catch {
      throw new EmailProviderError();
    }
  }
}