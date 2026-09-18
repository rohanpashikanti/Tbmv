import { NextRequest, NextResponse } from "next/server";
import { vendorOperationsService, AuthContext } from "@/lib/services/vendor-operations-service";
import { authService } from "@/lib/services/auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { venueId, resourceId, date, startTime, endTime, reason, note } = body;

    if (!venueId || !resourceId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: venueId, resourceId, date, startTime, endTime." },
        { status: 400 }
      );
    }

    const { user, vendorId } = await authService.requireVendorAccess(venueId);
    const auth: AuthContext = {
      userId: user.id,
      role: user.role as any,
      vendorId,
    };

    const result = await vendorOperationsService.blockSlot(auth, {
      venueId,
      resourceId,
      date,
      startTime,
      endTime,
      reason: reason || "MAINTENANCE",
      note,
    });

    if (!result.success) {
      const status = result.message.includes("Unauthorized") ? 403 : 409;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const isUnauthorized = error.message === "UNAUTHORIZED";
    const isForbidden = error.message?.includes("FORBIDDEN");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status });
  }
}
