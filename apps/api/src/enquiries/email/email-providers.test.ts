import { describe, expect, it, vi } from "vitest";
import { DevelopmentEmailProvider } from "./development-email-provider.js";
import { createEmailProvider } from "./create-email-provider.js";
import { EmailProviderError, type EmailSender } from "./email-provider.js";
import { SmtpEmailProvider } from "./smtp-email-provider.js";
import type { EnquiryInput } from "../enquiry.js";
import type { Product } from "../../products/product.js";

const enquiry: EnquiryInput = {
  productId: 7,
  customerName: "Jordan Customer",
  email: "jordan@example.test",
  phone: "+1 212 555 0100",
  message: "Please tell me more about this item.",
};

const product: Product = {
  id: 7,
  title: "Sample product",
  price: 25,
  description: "A sample product for provider tests.",
  category: "electronics",
  image: "https://fakestoreapi.com/img/sample.jpg",
  rating: { rate: 4.5, count: 10 },
};

describe("email providers", () => {
  it("logs enquiry details locally through the development provider", async () => {
    const logger = { info: vi.fn() };
    const provider = new DevelopmentEmailProvider(logger);

    await provider.sendEnquiry(enquiry, product);

    expect(logger.info).toHaveBeenCalledWith(
      "[development-email-provider] Enquiry received",
      expect.objectContaining({
        productId: product.id,
        customerName: enquiry.customerName,
        email: enquiry.email,
        phone: enquiry.phone,
        message: enquiry.message,
      }),
    );
  });

  it("sends SMTP enquiries to the configured sales inbox with customer reply-to", async () => {
    const sendMail = vi.fn<EmailSender>().mockResolvedValue(undefined);
    const provider = new SmtpEmailProvider(sendMail, "catalogue@example.test", "sales@example.test");

    await provider.sendEnquiry(enquiry, product);

    expect(sendMail).toHaveBeenCalledWith({
      from: "catalogue@example.test",
      to: "sales@example.test",
      replyTo: enquiry.email,
      subject: `Product enquiry #${product.id}`,
      text: [
        `Product: ${product.title} (ID ${product.id})`,
        `Customer: ${enquiry.customerName}`,
        `Email: ${enquiry.email}`,
        `Phone: ${enquiry.phone}`,
        "",
        enquiry.message,
      ].join("\n"),
    });
  });

  it("wraps SMTP transport failures without exposing transport details", async () => {
    const sendMail = vi.fn<EmailSender>().mockRejectedValue(new Error("sensitive SMTP response"));
    const provider = new SmtpEmailProvider(sendMail, "catalogue@example.test", "sales@example.test");

    await expect(provider.sendEnquiry(enquiry, product)).rejects.toEqual(
      expect.objectContaining({
        name: "EmailProviderError",
        message: "Enquiry email delivery failed.",
      }),
    );
  });

  it("selects development by default and requires SMTP configuration", () => {
    expect(createEmailProvider({})).toBeInstanceOf(DevelopmentEmailProvider);
    expect(() => createEmailProvider({ EMAIL_PROVIDER: "smtp" })).toThrow(
      "Missing required environment variable: SMTP_HOST",
    );
    expect(() => createEmailProvider({ EMAIL_PROVIDER: "unsupported" })).toThrow(
      "EMAIL_PROVIDER must be either 'development' or 'smtp'.",
    );
  });

  it("fails closed in production when provider configuration is missing", () => {
    expect(() => createEmailProvider({ NODE_ENV: "production" })).toThrow(
      "EMAIL_PROVIDER must be explicitly set to 'smtp' in production.",
    );
  });

  it("rejects development and invalid providers in production", () => {
    expect(() => createEmailProvider({
      NODE_ENV: "production",
      EMAIL_PROVIDER: "development",
    })).toThrow("EMAIL_PROVIDER=development is not allowed in production.");
    expect(() => createEmailProvider({
      NODE_ENV: "production",
      EMAIL_PROVIDER: "invalid",
    })).toThrow("EMAIL_PROVIDER must be either 'development' or 'smtp'.");
  });

  it("requires SMTP settings in production when SMTP is selected", () => {
    expect(() => createEmailProvider({
      NODE_ENV: "production",
      EMAIL_PROVIDER: "smtp",
    })).toThrow("Missing required environment variable: SMTP_HOST");
  });

  it("creates the SMTP provider from environment configuration without connecting", () => {
    const provider = createEmailProvider({
      EMAIL_PROVIDER: "smtp",
      SMTP_HOST: "smtp.example.test",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: "smtp-user",
      SMTP_PASS: "placeholder-password",
      SMTP_FROM: "catalogue@example.test",
      SALES_INBOX: "sales@example.test",
    });

    expect(provider).toBeInstanceOf(SmtpEmailProvider);
  });

  it("preserves typed email-provider errors", () => {
    expect(new EmailProviderError()).toBeInstanceOf(Error);
  });
});