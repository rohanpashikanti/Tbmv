import { authService } from "@/lib/services/auth-service";
import { User } from "@prisma/client";

/**
 * Ensures user is authenticated via Supabase and account status is ACTIVE.
 * Throws error if unauthenticated or suspended.
 */
export async function requireAuth(): Promise<User> {
  return authService.requireAuth();
}
