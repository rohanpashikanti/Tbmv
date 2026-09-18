import { authService } from "@/lib/services/auth-service";
import { User } from "@prisma/client";

/**
 * Ensures user has the specific application role (CUSTOMER, VENDOR, ADMIN).
 */
export async function requireRole(role: string): Promise<User> {
  return authService.requireRole(role);
}

export async function requireAdmin(): Promise<User> {
  return authService.requireAdmin();
}

export async function requireVendor(venueId?: string): Promise<{ user: User; vendorId: string }> {
  return authService.requireVendorAccess(venueId);
}
