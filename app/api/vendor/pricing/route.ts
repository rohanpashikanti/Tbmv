import { NextRequest, NextResponse } from "next/server";
import { vendorOperationsService, AuthContext } from "@/lib/services/vendor-operations-service";
import { authService } from "@/lib/services/auth-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");

  if (!resourceId) {
    return NextResponse.json({ success: false, message: "Missing resourceId parameter." }, { status: 400 });
  }

  const rules = vendorOperationsService.getPricingRules(resourceId);
  return NextResponse.json({ success: true, rules });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { venueId, resourceId, ruleType, priority, name, effectiveFrom, effectiveTo, dayOfWeek, startTime, endTime, amount, active } = body;

    if (!venueId || !resourceId || !ruleType || !amount || !effectiveFrom || !effectiveTo) {
      return NextResponse.json(
        { success: false, message: "Missing required fields for dynamic pricing rule." },
        { status: 400 }
      );
    }

    const { user, vendorId } = await authService.requireVendorAccess(venueId);
    const auth: AuthContext = {
      userId: user.id,
      role: user.role as any,
      vendorId,
    };

    const result = vendorOperationsService.setPricingRule(auth, {
      venueId,
      resourceId,
      ruleType,
      priority: priority || (ruleType === "SPECIAL_DATE" ? 50 : ruleType === "SEASONAL" ? 40 : ruleType === "WEEKEND" ? 30 : ruleType === "PEAK_OFFPEAK" ? 20 : 10),
      name: name || `${ruleType} Rule`,
      effectiveFrom,
      effectiveTo,
      dayOfWeek,
      startTime,
      endTime,
      amount,
      active: active !== undefined ? active : true,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 403 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const isUnauthorized = error.message === "UNAUTHORIZED";
    const isForbidden = error.message?.includes("FORBIDDEN");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status });
  }
}
