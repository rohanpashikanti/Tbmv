/**
 * Safe Supabase configuration validation helper.
 * Never logs or exposes secret keys or public key values.
 */

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  serviceRoleKey?: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vddvbceadnyaogxjjcjd.supabase.co";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isConfigured = Boolean(url && publishableKey && !publishableKey.includes("<") && publishableKey.length > 10);

  return {
    url,
    publishableKey,
    serviceRoleKey,
    isConfigured,
  };
}

export function validateSupabaseEnv(): { url: string; key: string } {
  const config = getSupabaseConfig();

  if (!config.url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment configuration.");
  }

  if (!config.publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return {
    url: config.url,
    key: config.publishableKey,
  };
}
