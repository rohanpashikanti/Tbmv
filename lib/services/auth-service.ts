import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { User, AccountStatus } from "@prisma/client";
import { postgresBookingService } from "./postgres-booking-service";
import { vendorOperationsService } from "./vendor-operations-service";

export class AuthService {
  /**
   * Resolves the current authenticated user from Supabase and our DB.
   * Client-submitted role or user headers are NEVER trusted.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = await createClient();
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !supabaseUser) {
        return null;
      }

      let user = await prisma.user.findUnique({
        where: { authUserId: supabaseUser.id },
      });

      if (!user && supabaseUser.email) {
        // Fallback: check if an application user already exists with this email
        user = await prisma.user.findUnique({
          where: { email: supabaseUser.email },
        });

        if (user) {
          // Link the existing application user with the new Supabase Auth user ID
          user = await prisma.user.update({
            where: { id: user.id },
            data: { authUserId: supabaseUser.id },
          });
        }
      }

      if (!user) {
        // Auto-provision application User linked to Supabase Auth user
        user = await prisma.user.create({
          data: {
            authUserId: supabaseUser.id,
            email: supabaseUser.email || `${supabaseUser.id}@guest.thebookmyvenues.in`,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Customer",
            role: "CUSTOMER", // Registration always defaults to CUSTOMER
            status: AccountStatus.ACTIVE,
          },
        });
      }

      return user;
    } catch {
      return null;
    }
  }

  /**
   * Ensures the request is authenticated and the account is ACTIVE.
   */
  async requireAuth(): Promise<User> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    if (user.status !== AccountStatus.ACTIVE) {
      throw new Error(`FORBIDDEN: Account is ${user.status}`);
    }
    return user;
  }

  /**
   * Ensures the request is authenticated, ACTIVE, and has the specified role.
   */
  async requireRole(role: string): Promise<User> {
    const user = await this.requireAuth();
    if (user.role !== role && user.role !== "ADMIN") {
      throw new Error(`FORBIDDEN: Requires ${role} role`);
    }
    return user;
  }

  async requireAdmin(): Promise<User> {
    const user = await this.requireAuth();
    if (user.role !== "ADMIN") {
      throw new Error("FORBIDDEN: Superadmin privileges required");
    }
    return user;
  }

  async requireVendorAccess(venueId?: string): Promise<{ user: User; vendorId: string }> {
    const user = await this.requireAuth();
    if (user.role !== "VENDOR" && user.role !== "ADMIN") {
      throw new Error("FORBIDDEN: Vendor access required");
    }

    // Determine vendorId associated with user
    const vendorId = "vendor-1"; // Default linked vendor entity

    if (venueId && user.role === "VENDOR") {
      const isOwner = vendorOperationsService.validateVendorOwnership(
        { userId: user.id, role: "VENDOR", vendorId },
        venueId
      );
      if (!isOwner) {
        throw new Error("FORBIDDEN: You do not own this venue");
      }
    }

    return { user, vendorId };
  }

  async requireBookingAccess(bookingId: string): Promise<{ user: User; booking: any }> {
    const user = await this.requireAuth();
    const booking = postgresBookingService.getBooking(bookingId);

    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    if (user.role === "ADMIN") {
      return { user, booking };
    }

    if (user.role === "VENDOR") {
      const isOwner = vendorOperationsService.validateVendorOwnership(
        { userId: user.id, role: "VENDOR", vendorId: "vendor-1" },
        booking.venueId
      );
      if (isOwner) {
        return { user, booking };
      }
    }

    if (booking.userId && booking.userId !== user.id) {
      throw new Error("FORBIDDEN: Access denied to other customer bookings");
    }

    return { user, booking };
  }
}

export const authService = new AuthService();
