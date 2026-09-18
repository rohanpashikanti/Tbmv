import { authService } from "@/lib/services/auth-service";
import { User } from "@prisma/client";

/**
 * Derives current application user from authenticated Supabase server session.
 * Returns null if unauthenticated or session expired.
 */
export async function getCurrentUser(): Promise<User | null> {
  return authService.getCurrentUser();
}
