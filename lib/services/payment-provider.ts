export interface PaymentOrderRequest {
  amount: number; // In INR
  holdId: string;
  customerPhone?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResponse {
  success: boolean;
  mode: "mock" | "razorpay" | "stripe";
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  isSimulatedMock: boolean;
}

export interface PaymentProvider {
  mode: "mock" | "razorpay" | "stripe";
  createOrder(req: PaymentOrderRequest): Promise<PaymentOrderResponse>;
  verifySignature(orderId: string, paymentId: string, signature: string): Promise<boolean>;
}

export class MockPaymentProvider implements PaymentProvider {
  public readonly mode = "mock" as const;

  async createOrder(req: PaymentOrderRequest): Promise<PaymentOrderResponse> {
    return {
      success: true,
      mode: "mock",
      orderId: `mock_order_${Math.random().toString(36).substring(2, 9)}`,
      amount: req.amount,
      currency: "INR",
      provider: "Mock Payment Gateway (Dev Sandbox)",
      isSimulatedMock: true,
    };
  }

  async verifySignature(
    _orderId: string,
    _paymentId: string,
    _signature: string
  ): Promise<boolean> {
    return true;
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
