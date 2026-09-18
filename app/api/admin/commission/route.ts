import { NextRequest, NextResponse } from "next/server";
import { vendorOperationsService, AuthContext } from "@/lib/services/vendor-operations-service";
import { authService } from "@/lib/services/auth-service";

export async function GET() {
  const rate = vendorOperationsService.getGlobalCommissionRate();
  return NextResponse.json({ success: true, commissionRate: rate, percentage: `${rate * 100}%` });
}

export async function POST(req: NextRequest) {
  try {
    const user = await authService.requireAdmin();
    const auth: AuthContext = {
      userId: user.id,
      role: "ADMIN",
    };

    const body = await req.json();
    const { rate } = body;

    if (rate === undefined || typeof rate !== "number" || rate < 0 || rate > 0.5) {
      return NextResponse.json(
        { success: false, message: "Invalid commission rate. Must be a decimal between 0.00 and 0.50 (0% - 50%)." },
        { status: 400 }
      );
    }

    const result = vendorOperationsService.updateGlobalCommission(auth, rate);

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
