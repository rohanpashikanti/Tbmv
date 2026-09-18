import { createBrowserClient } from "@supabase/ssr";
import { validateSupabaseEnv } from "@/lib/supabase/env";

export const createClient = () => {
  const env = validateSupabaseEnv();
  return createBrowserClient(
    env.url,
    env.key,
  );
};
