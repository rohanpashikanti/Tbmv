import { NextRequest, NextResponse } from "next/server";
import { vendorOperationsService, AuthContext } from "@/lib/services/vendor-operations-service";
import { authService } from "@/lib/services/auth-service";

export async function POST(req: NextRequest) {
  try {
    const user = await authService.requireAdmin();
    const auth: AuthContext = {
      userId: user.id,
      role: "ADMIN",
    };

    const body = await req.json();
    const { venueId, status, reason } = body;

    if (!venueId || !status) {
      return NextResponse.json(
        { success: false, message: "Missing venueId or status." },
        { status: 400 }
      );
    }

    const result = vendorOperationsService.moderateVenue(auth, venueId, status, reason);

    if (!result.success) {
      return NextResponse.json(result, { status: 403 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const isUnauthorized = error.message === "UNAUTHORIZED";
    const isForbidden = error.message?.includes("FORBIDDEN");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status });
  }
}
