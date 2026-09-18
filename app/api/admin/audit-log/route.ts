import { NextResponse } from "next/server";
import { vendorOperationsService } from "@/lib/services/vendor-operations-service";

export async function GET() {
  const logs = vendorOperationsService.getAuditLogs();
  return NextResponse.json({ success: true, count: logs.length, logs });
}
