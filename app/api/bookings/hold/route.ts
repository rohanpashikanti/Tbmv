import { NextRequest, NextResponse } from "next/server";
import { postgresBookingService } from "@/lib/services/postgres-booking-service";
import { SlotHoldSchema } from "@/lib/validation/booking";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = SlotHoldSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message || "Invalid hold request",
          errors: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const result = await postgresBookingService.createHold(parsed.data);

    if (!result.success) {
      const statusCode = result.code === "SLOT_UNAVAILABLE" || result.code === "SLOT_ALREADY_HELD" ? 409 : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to create slot hold" },
      { status: 500 }
    );
  }
}
