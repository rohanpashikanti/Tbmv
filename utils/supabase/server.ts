import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateSupabaseEnv } from "@/lib/supabase/env";

export const createClient = async (explicitCookieStore?: Awaited<ReturnType<typeof cookies>>) => {
  const cookieStore = explicitCookieStore || (await cookies());
  const env = validateSupabaseEnv();

  return createServerClient(
    env.url,
    env.key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  );
};
