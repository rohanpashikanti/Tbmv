import { NextRequest, NextResponse } from "next/server";
import { postgresBookingService } from "@/lib/services/postgres-booking-service";
import { authService } from "@/lib/services/auth-service";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const resolved = await params;
    const booking = postgresBookingService.getBooking(resolved.id);

    if (!booking) {
      return NextResponse.json(
        { success: false, code: "BOOKING_NOT_FOUND", message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check booking ownership if booking is associated with a registered user
    if (booking.userId) {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return NextResponse.json(
          { success: false, code: "UNAUTHORIZED", message: "Authentication required to view this booking" },
          { status: 401 }
        );
      }

      if (
        currentUser.id !== booking.userId &&
        currentUser.role !== "ADMIN" &&
        currentUser.role !== "VENDOR"
      ) {
        return NextResponse.json(
          { success: false, code: "FORBIDDEN", message: "You do not have permission to view this booking" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
