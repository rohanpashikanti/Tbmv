import { NextResponse } from "next/server";
import { postgresBookingService } from "@/lib/services/postgres-booking-service";

export async function GET() {
  const bookings = postgresBookingService.getAllBookings();
  return NextResponse.json({ success: true, count: bookings.length, data: bookings });
}
