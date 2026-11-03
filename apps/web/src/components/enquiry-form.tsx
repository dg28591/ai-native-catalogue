import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, LoaderCircle, X } from "lucide-react";
import type { Product } from "../types/product";
import type { EnquiryFieldErrors, EnquirySubmission } from "../types/enquiry";
import { ApiError, submitEnquiry } from "../services/api";
import { validateEnquiry, type EnquiryFormValues } from "../services/validate-enquiry";

const initialValues: EnquiryFormValues = {
  customerName: "",
  email: "",
  phone: "",
  message: "",
};

export function EnquiryForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<EnquiryFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function updateField(field: keyof EnquiryFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateEnquiry(values);
    setFieldErrors(errors);
    setFormError("");
    if (Object.keys(errors).length > 0) return;

    const submission: EnquirySubmission = {
      productId: product.id,
      customerName: values.customerName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      message: values.message.trim(),
    };

    setIsSubmitting(true);
    try {
      await submitEnquiry(submission);
      setIsSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        setFieldErrors(error.fields as EnquiryFieldErrors);
      }
      setFormError(error instanceof Error ? error.message : "Unable to send your enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <section className="enquiry-panel enquiry-success" role="status" aria-live="polite">
        <CheckCircle2 className="success-icon" size={27} aria-hidden="true" />
        <div className="enquiry-success-copy">
          <span className="eyebrow">Enquiry received</span>
          <h2>Thank you, {values.customerName.trim()}.</h2>
          <p>Your enquiry about <strong>{product.title}</strong> was received.</p>
        </div>
        <button className="enquiry-close" type="button" aria-label="Close enquiry message" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </section>
    );
  }

  return (
    <section className="enquiry-panel" aria-labelledby="enquiry-heading">
      <div className="enquiry-heading-row">
        <div>
          <span className="eyebrow">A question about this piece</span>
          <h2 id="enquiry-heading">Send an enquiry</h2>
          <p>Our team will follow up using the contact details you provide.</p>
        </div>
        <button className="enquiry-close" type="button" aria-label="Close enquiry form" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {formError && <p className="enquiry-form-error" role="alert">{formError}</p>}

      <form className="enquiry-form" noValidate onSubmit={handleSubmit}>
        <div className="enquiry-fields">
          <div className="enquiry-field">
            <label htmlFor="customer-name">Customer name</label>
            <input
              autoComplete="name"
              id="customer-name"
              maxLength={100}
              name="customerName"
              onChange={(event) => updateField("customerName", event.target.value)}
              value={values.customerName}
              aria-invalid={Boolean(fieldErrors.customerName)}
              aria-describedby={fieldErrors.customerName ? "customer-name-error" : undefined}
            />
            {fieldErrors.customerName && <span className="enquiry-field-error" id="customer-name-error">{fieldErrors.customerName}</span>}
          </div>
          <div className="enquiry-field">
            <label htmlFor="customer-email">Email</label>
            <input
              autoComplete="email"
              id="customer-email"
              maxLength={254}
              name="email"
              onChange={(event) => updateField("email", event.target.value)}
              type="email"
              value={values.email}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "customer-email-error" : undefined}
            />
            {fieldErrors.email && <span className="enquiry-field-error" id="customer-email-error">{fieldErrors.email}</span>}
          </div>
          <div className="enquiry-field">
            <label htmlFor="customer-phone">Phone</label>
            <input
              autoComplete="tel"
              id="customer-phone"
              maxLength={25}
              name="phone"
              onChange={(event) => updateField("phone", event.target.value)}
              type="tel"
              value={values.phone}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "customer-phone-error" : undefined}
            />
            {fieldErrors.phone && <span className="enquiry-field-error" id="customer-phone-error">{fieldErrors.phone}</span>}
          </div>
          <div className="enquiry-field enquiry-message-field">
            <label htmlFor="customer-message">Message</label>
            <textarea
              id="customer-message"
              maxLength={2000}
              name="message"
              onChange={(event) => updateField("message", event.target.value)}
              rows={5}
              value={values.message}
              aria-invalid={Boolean(fieldErrors.message)}
              aria-describedby={fieldErrors.message ? "customer-message-error" : undefined}
            />
            {fieldErrors.message && <span className="enquiry-field-error" id="customer-message-error">{fieldErrors.message}</span>}
          </div>
        </div>
        <div className="enquiry-actions">
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><LoaderCircle size={16} className="is-spinning" aria-hidden="true" /> Sending</> : "Send enquiry"}
          </button>
          <span>About: {product.title}</span>
        </div>
      </form>
    </section>
  );
}