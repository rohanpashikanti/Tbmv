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
    const { bookingId, reason } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Missing bookingId for refund processing." },
        { status: 400 }
      );
    }

    const result = await vendorOperationsService.adminProcessRefund(
      auth,
      bookingId,
      reason || "Administrative Customer Resolution"
    );

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
