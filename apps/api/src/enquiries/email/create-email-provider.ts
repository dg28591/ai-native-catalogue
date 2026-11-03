import nodemailer from "nodemailer";
import { DevelopmentEmailProvider } from "./development-email-provider.js";
import { SmtpEmailProvider } from "./smtp-email-provider.js";

function requiredValue(environment: NodeJS.ProcessEnv, key: string): string {
  const value = environment[key]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function createEmailProvider(environment: NodeJS.ProcessEnv = process.env) {
  const isProduction = environment.NODE_ENV?.trim().toLowerCase() === "production";
  const configuredProvider = environment.EMAIL_PROVIDER?.trim().toLowerCase();

  if (isProduction && !configuredProvider) {
    throw new Error("EMAIL_PROVIDER must be explicitly set to 'smtp' in production.");
  }

  const providerName = configuredProvider || "development";
  if (providerName === "development") {
    if (isProduction) {
      throw new Error("EMAIL_PROVIDER=development is not allowed in production.");
    }
    return new DevelopmentEmailProvider();
  }
  if (providerName !== "smtp") {
    throw new Error("EMAIL_PROVIDER must be either 'development' or 'smtp'.");
  }

  const host = requiredValue(environment, "SMTP_HOST");
  const port = Number(requiredValue(environment, "SMTP_PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be an integer between 1 and 65535.");
  }

  const secureValue = environment.SMTP_SECURE?.trim().toLowerCase();
  if (secureValue && secureValue !== "true" && secureValue !== "false") {
    throw new Error("SMTP_SECURE must be 'true' or 'false'.");
  }

  const user = requiredValue(environment, "SMTP_USER");
  const pass = requiredValue(environment, "SMTP_PASS");
  const from = requiredValue(environment, "SMTP_FROM");
  const salesInbox = requiredValue(environment, "SALES_INBOX");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: secureValue ? secureValue === "true" : port === 465,
    auth: { user, pass },
  });

  return new SmtpEmailProvider((email) => transporter.sendMail(email), from, salesInbox);
}