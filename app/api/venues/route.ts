import { NextRequest, NextResponse } from "next/server";
import { getVenues } from "@/lib/api/venues";
import { VenueCategory } from "@/types/venue";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || undefined;
  const category = (searchParams.get("category") as VenueCategory) || undefined;
  const query = searchParams.get("q") || undefined;

  const venues = await getVenues({ city, category, query });
  return NextResponse.json({ success: true, count: venues.length, data: venues });
}
