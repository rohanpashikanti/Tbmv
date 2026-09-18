import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/payment-service";

export async function POST(request: NextRequest) {
  try {
    const { holdId, amount } = await request.json();

    if (!holdId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "Valid holdId and amount are required" },
        { status: 400 }
      );
    }

    const order = await paymentService.createOrder(holdId, amount);
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: "PAYMENT_CREATION_FAILED", message: error.message },
      { status: 500 }
    );
  }
}
