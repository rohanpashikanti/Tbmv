import { postgresBookingService } from "@/lib/services/postgres-booking-service";
import { calculateAuthoritativePriceBreakdown, PriceBreakdown, razorpayProvider } from "./razorpay-provider";

export type PaymentState =
  | "PAYMENT_PENDING"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_FAILED"
  | "PAYMENT_VERIFIED"
  | "BOOKING_CONFIRMING"
  | "BOOKING_CONFIRMED"
  | "BOOKING_FAILED"
  | "REFUNDED";

export interface PaymentRecord {
  id: string;
  orderId: string;
  holdId: string;
  basePrice: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: PaymentState;
  externalPaymentId?: string;
  provider: "razorpay" | "stripe" | "mock";
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEventPayload {
  eventId: string;
  eventType: "payment.captured" | "payment.failed";
  orderId: string;
  paymentId: string;
  amount: number;
  signature?: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
}

export class PaymentService {
  private payments = new Map<string, PaymentRecord>();
  private processedEvents = new Set<string>();

  /**
   * 1. CREATE PAYMENT ORDER (With Authoritative Fee & Tax Computation)
   */
  async createOrder(holdId: string, rawBasePrice: number): Promise<{ payment: PaymentRecord; breakdown: PriceBreakdown }> {
    const breakdown = calculateAuthoritativePriceBreakdown(rawBasePrice);
    const orderId = `order_${Math.random().toString(36).substring(2, 9)}`;

    const payment: PaymentRecord = {
      id: `pay_rec_${Math.random().toString(36).substring(2, 9)}`,
      orderId,
      holdId,
      basePrice: breakdown.basePrice,
      platformFee: breakdown.platformFee,
      taxAmount: breakdown.taxAmount,
      totalAmount: breakdown.totalAmount,
      currency: "INR",
      status: "PAYMENT_PENDING",
      provider: "mock",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.payments.set(orderId, payment);
    return { payment, breakdown };
  }

  /**
   * 2. RETRY FAILED PAYMENT
   */
  async retryPayment(orderId: string): Promise<PaymentRecord | null> {
    const payment = this.payments.get(orderId);
    if (!payment) return null;

    payment.status = "PAYMENT_PENDING";
    payment.updatedAt = new Date().toISOString();
    return payment;
  }

  /**
   * 3. IDEMPOTENT WEBHOOK HANDLER
   */
  async handleWebhook(event: WebhookEventPayload): Promise<{ success: boolean; message: string; bookingId?: string }> {
    if (this.processedEvents.has(event.eventId)) {
      return {
        success: true,
        message: "Webhook event already processed (idempotent ignore).",
      };
    }

    const payment = this.payments.get(event.orderId);
    if (!payment) {
      return { success: false, message: "Order not found for webhook event." };
    }

    this.processedEvents.add(event.eventId);

    if (event.eventType === "payment.captured") {
      payment.status = "PAYMENT_VERIFIED";
      payment.externalPaymentId = event.paymentId;
      payment.updatedAt = new Date().toISOString();

      // Atomically confirm booking in database
      const bookingResult = await postgresBookingService.confirmBooking(
        {
          holdId: payment.holdId,
          paymentId: event.paymentId,
          customerDetails: event.customerDetails,
        },
        `webhook_${event.eventId}`
      );

      if (bookingResult.success && bookingResult.data) {
        payment.status = "BOOKING_CONFIRMED";
        return {
          success: true,
          message: "Payment captured and booking confirmed.",
          bookingId: bookingResult.data.bookingNumber,
        };
      } else {
        payment.status = "BOOKING_FAILED";
        return {
          success: false,
          message: bookingResult.message || "Booking confirmation failed after payment capture.",
        };
      }
    } else {
      payment.status = "PAYMENT_FAILED";
      payment.updatedAt = new Date().toISOString();
      return { success: true, message: "Payment failure recorded." };
    }
  }

  getPayment(orderId: string): PaymentRecord | null {
    return this.payments.get(orderId) || null;
  }
}

export const paymentService = new PaymentService();
