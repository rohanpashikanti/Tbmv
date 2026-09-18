import { createClient } from "@/utils/supabase/middleware";
import { type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  if (supabase) {
    try {
      await supabase.auth.getUser();
    } catch {
      // Ignore network errors in offline/dev static generation
    }
  }
  return supabaseResponse;
}
