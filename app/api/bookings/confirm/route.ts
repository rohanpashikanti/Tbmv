import { NextRequest, NextResponse } from "next/server";
import { postgresBookingService } from "@/lib/services/postgres-booking-service";
import { BookingConfirmSchema } from "@/lib/validation/booking";

export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get("idempotency-key") || undefined;
    const rawBody = await request.json();
    const parsed = BookingConfirmSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message || "Invalid booking confirmation payload",
          errors: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const result = await postgresBookingService.confirmBooking(parsed.data, idempotencyKey);

    if (!result.success) {
      const statusCode =
        result.code === "SLOT_UNAVAILABLE"
          ? 409
          : result.code === "HOLD_EXPIRED"
          ? 410
          : result.code === "HOLD_NOT_FOUND"
          ? 404
          : 400;

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: "DATABASE_CONFLICT", message: error.message || "Confirmation failed" },
      { status: 500 }
    );
  }
}
