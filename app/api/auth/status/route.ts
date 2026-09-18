import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    authProvider: "Firebase",
    database: "Supabase PostgreSQL",
    timestamp: new Date().toISOString(),
  });
}

