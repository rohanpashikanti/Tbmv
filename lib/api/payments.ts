export interface PaymentOrderParams {
  amount: number; // in INR
  bookingHoldId: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  provider: "razorpay" | "stripe" | "mock";
}

/**
 * Payment Gateway Provider Abstraction
 * Supports future drop-in of Razorpay SDK or Stripe
 */
export async function createPaymentOrder(
  params: PaymentOrderParams
): Promise<PaymentOrderResult> {
  return {
    orderId: `order_${Math.random().toString(36).substring(2, 10)}`,
    amount: params.amount,
    currency: "INR",
    provider: "mock",
  };
}
