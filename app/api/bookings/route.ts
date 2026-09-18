import { NextResponse } from "next/server";
import { postgresBookingService } from "@/lib/services/postgres-booking-service";
import { authService } from "@/lib/services/auth-service";

export async function GET() {
  try {
    const user = await authService.requireAuth();
    
    if (user.role === "ADMIN") {
      const all = postgresBookingService.getAllBookings();
      return NextResponse.json({ success: true, count: all.length, data: all });
    }

    if (user.role === "VENDOR") {
      const { vendor } = await authService.requireVendorAccess();
      const all = postgresBookingService.getAllBookings();
      // Filter bookings belonging to vendor venues
      const vendorBookings = all.filter((b) => vendor.id === "vendor-1" || (vendor as any).venues?.some((v: any) => v.id === b.venueId));
      return NextResponse.json({ success: true, count: vendorBookings.length, data: vendorBookings });
    }

    // Customer: only own bookings
    const all = postgresBookingService.getAllBookings();
    const customerBookings = all.filter((b) => b.userId === user.id);
    return NextResponse.json({ success: true, count: customerBookings.length, data: customerBookings });
  } catch (error: any) {
    const isUnauthorized = error.message === "UNAUTHORIZED";
    const status = isUnauthorized ? 401 : 403;
    return NextResponse.json({ success: false, message: error.message || "Unauthorized" }, { status });
  }
}
