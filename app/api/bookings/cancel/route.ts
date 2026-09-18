import { NextRequest, NextResponse } from "next/server";
import { postgresBookingService } from "@/lib/services/postgres-booking-service";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "bookingId is required" },
        { status: 400 }
      );
    }

    const result = await postgresBookingService.cancelBooking(bookingId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
