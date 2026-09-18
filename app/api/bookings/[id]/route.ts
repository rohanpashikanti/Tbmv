import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth-service";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const resolved = await params;
    const { booking } = await authService.requireBookingAccess(resolved.id);

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    if (error.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json(
        { success: false, code: "BOOKING_NOT_FOUND", message: "Booking not found" },
        { status: 404 }
      );
    }
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", message: "Authentication required to view this booking" },
        { status: 401 }
      );
    }
    if (error.message?.includes("FORBIDDEN")) {
      return NextResponse.json(
        { success: false, code: "FORBIDDEN", message: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
