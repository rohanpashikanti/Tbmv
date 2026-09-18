import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/payment-service";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const eventId = request.headers.get("x-webhook-event-id") || rawBody.eventId;

    if (!eventId || !rawBody.orderId) {
      return NextResponse.json(
        { success: false, code: "INVALID_WEBHOOK_PAYLOAD", message: "Missing eventId or orderId" },
        { status: 400 }
      );
    }

    const result = await paymentService.handleWebhook({
      eventId,
      eventType: rawBody.eventType || "payment.captured",
      orderId: rawBody.orderId,
      paymentId: rawBody.paymentId || `pay_${Date.now()}`,
      amount: rawBody.amount || 1200,
      customerDetails: rawBody.customerDetails || {
        name: "Webhook Customer",
        phone: "9999999999",
        email: "webhook@example.com",
      },
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: "WEBHOOK_PROCESSING_FAILED", message: error.message },
      { status: 500 }
    );
  }
}
