export interface EnquirySubmission {
  productId: number;
  customerName: string;
  email: string;
  phone: string;
  message: string;
}

export type EnquiryFieldErrors = Partial<Record<keyof Omit<EnquirySubmission, "productId">, string>>;