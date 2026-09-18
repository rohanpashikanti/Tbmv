import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseConfig } from "@/lib/supabase/env";

export async function GET() {
  const config = getSupabaseConfig();

  let supabaseSession = null;
  let supabaseAuthUser = null;
  let applicationUser = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      supabaseAuthUser = {
        id: user.id,
        phone: user.phone,
        email: user.email,
      };

      const appUser = await prisma.user.findUnique({
        where: { authUserId: user.id },
      });

      if (appUser) {
        applicationUser = {
          id: appUser.id,
          name: appUser.name,
          email: appUser.email,
          role: appUser.role,
          status: appUser.status,
        };
      }
    }
  } catch (err: any) {
    // Gracefully handle unauthenticated/offline states
  }

  return NextResponse.json({
    status: "ok",
    supabase: {
      configured: config.isConfigured,
      projectUrl: config.url,
      clientKeyType: "PUBLISHABLE",
    },
    session: {
      authenticated: Boolean(supabaseAuthUser),
      supabaseUser: supabaseAuthUser,
      applicationUser,
    },
    timestamp: new Date().toISOString(),
  });
}
