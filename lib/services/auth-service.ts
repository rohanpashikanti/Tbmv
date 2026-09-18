import { prisma } from "@/lib/prisma";
import { User, AccountStatus, Vendor, KycStatus } from "@prisma/client";
import { postgresBookingService } from "./postgres-booking-service";
import { vendorOperationsService } from "./vendor-operations-service";

export interface VendorContext {
  user: User;
  vendor: Vendor;
  vendorId: string;
}

export class AuthService {
  /**
   * 1. Resolves user from Supabase PostgreSQL (Prisma).
   */
  async getCurrentUser(userId?: string): Promise<User | null> {
    try {
      if (!userId) {
        return null;
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ authUserId: userId }, { id: userId }, { email: userId }],
        },
      });

      return user;
    } catch {
      return null;
    }
  }

  /**
   * 2. Ensures the user is resolved and the account is ACTIVE.
   */
  async requireAuth(userId?: string): Promise<User> {
    const user = await this.getCurrentUser(userId);
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    if (user.status !== AccountStatus.ACTIVE) {
      throw new Error(`FORBIDDEN: Account is ${user.status}`);
    }
    return user;
  }


  /**
   * 3. Ensures user has the specified role (or ADMIN).
   */
  async requireRole(role: string): Promise<User> {
    const user = await this.requireAuth();
    if (user.role !== role && user.role !== "ADMIN") {
      throw new Error(`FORBIDDEN: Requires ${role} role`);
    }
    return user;
  }

  /**
   * 4. Strict Admin Authorization
   */
  async requireAdmin(): Promise<User> {
    const user = await this.requireAuth();
    if (user.role !== "ADMIN") {
      throw new Error("FORBIDDEN: Superadmin privileges required");
    }
    return user;
  }

  /**
   * 5. Strict Vendor Authorization with KYC & Multi-Tenant Venue Ownership Check
   */
  async requireVendorAccess(venueId?: string): Promise<VendorContext> {
    const user = await this.requireAuth();
    if (user.role !== "VENDOR" && user.role !== "ADMIN") {
      throw new Error("FORBIDDEN: Vendor access required");
    }

    // Admin has global operational override access
    if (user.role === "ADMIN") {
      let adminVendor = await prisma.vendor.findFirst({ where: { userId: user.id } });
      if (!adminVendor) {
        adminVendor = {
          id: "admin-platform-vendor",
          userId: user.id,
          businessName: "Platform Admin Master",
          contactName: user.name,
          email: user.email,
          phone: user.phone || "+919999999999",
          kycStatus: KycStatus.APPROVED,
          commissionRate: 0.05 as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return { user, vendor: adminVendor, vendorId: adminVendor.id };
    }

    // Lookup Vendor Entity in database
    let vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
      include: { venues: true },
    });

    if (!vendor) {
      // Check in vendorOperationsService fallback registry
      const memoryVendor = vendorOperationsService.getVendorByUserId(user.id);
      if (memoryVendor) {
        if (memoryVendor.kycStatus !== "APPROVED") {
          throw new Error(`FORBIDDEN: Vendor status is ${memoryVendor.kycStatus}`);
        }
        if (venueId && !vendorOperationsService.validateVendorOwnership({ userId: user.id, role: "VENDOR", vendorId: memoryVendor.id }, venueId)) {
          throw new Error("FORBIDDEN: You do not own this venue");
        }
        return {
          user,
          vendor: {
            id: memoryVendor.id,
            userId: user.id,
            businessName: memoryVendor.businessName,
            contactName: memoryVendor.contactName,
            email: memoryVendor.email,
            phone: memoryVendor.phone,
            kycStatus: memoryVendor.kycStatus as any,
            commissionRate: memoryVendor.commissionRate as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          vendorId: memoryVendor.id,
        };
      }
      throw new Error("FORBIDDEN: Vendor account not found or pending approval");
    }

    // Validate KYC status (Must be APPROVED)
    if (vendor.kycStatus !== KycStatus.APPROVED) {
      throw new Error(`FORBIDDEN: Vendor status is ${vendor.kycStatus}`);
    }

    // Validate Venue Ownership if venueId supplied
    if (venueId) {
      const ownsVenue = vendor.venues.some((v) => v.id === venueId) ||
        vendorOperationsService.validateVendorOwnership({ userId: user.id, role: "VENDOR", vendorId: vendor.id }, venueId);
      
      if (!ownsVenue) {
        throw new Error("FORBIDDEN: You do not own this venue");
      }
    }

    return { user, vendor, vendorId: vendor.id };
  }

  /**
   * 6. Strict Multi-Tenant Booking Ownership Check
   */
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
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
        include: { venues: true },
      });
      const vendorId = vendor?.id || "vendor-1";
      const isOwner = vendor?.venues.some((v) => v.id === booking.venueId) ||
        vendorOperationsService.validateVendorOwnership({ userId: user.id, role: "VENDOR", vendorId }, booking.venueId);
      
      if (isOwner) {
        return { user, booking };
      }
      throw new Error("FORBIDDEN: Booking belongs to a different vendor");
    }

    // Customer ownership
    if (booking.userId && booking.userId !== user.id) {
      throw new Error("FORBIDDEN: Access denied to other customer bookings");
    }

    return { user, booking };
  }
}

export const authService = new AuthService();
