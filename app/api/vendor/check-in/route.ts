import { NextRequest, NextResponse } from "next/server";
import { vendorOperationsService, AuthContext } from "@/lib/services/vendor-operations-service";
import { authService } from "@/lib/services/auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingReference } = body;

    if (!bookingReference) {
      return NextResponse.json(
        { success: false, message: "Missing bookingReference." },
        { status: 400 }
      );
    }

    const { user, vendorId } = await authService.requireVendorAccess();
    const auth: AuthContext = {
      userId: user.id,
      role: user.role as any,
      vendorId,
    };

    const result = vendorOperationsService.checkInBooking(auth, bookingReference);

    if (!result.success) {
      const status = result.message.includes("Unauthorized") ? 403 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const isUnauthorized = error.message === "UNAUTHORIZED";
    const isForbidden = error.message?.includes("FORBIDDEN");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status });
  }
}
