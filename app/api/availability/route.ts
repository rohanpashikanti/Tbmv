import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/api/availability";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  const date = searchParams.get("date") || "2026-09-18";
  const resourceId = searchParams.get("resourceId") || undefined;

  if (!venueId) {
    return NextResponse.json(
      { success: false, error: "venueId parameter is required" },
      { status: 400 }
    );
  }

  const slots = await getAvailability(venueId, date, resourceId);
  return NextResponse.json({ success: true, venueId, date, slots });
}
