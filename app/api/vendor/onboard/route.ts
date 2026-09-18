import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth-service";
import { vendorOperationsService } from "@/lib/services/vendor-operations-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await authService.requireAuth();
    
    // Check if user has a vendor entity in database or memory
    const dbVendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
      include: { venues: true },
    });

    if (dbVendor) {
      return NextResponse.json({
        success: true,
        isVendor: true,
        kycStatus: dbVendor.kycStatus,
        vendor: dbVendor,
      });
    }

    const memoryVendor = vendorOperationsService.getVendorByUserId(user.id);
    if (memoryVendor) {
      return NextResponse.json({
        success: true,
        isVendor: true,
        kycStatus: memoryVendor.kycStatus,
        vendor: memoryVendor,
      });
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({
        success: true,
        isVendor: true,
        kycStatus: "APPROVED",
        isAdmin: true,
      });
    }

    return NextResponse.json({
      success: true,
      isVendor: false,
      kycStatus: "NOT_APPLIED",
    });
  } catch (error: any) {
    const isUnauthorized = error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { success: false, message: error.message || "Unauthorized" },
      { status: isUnauthorized ? 401 : 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authService.requireAuth();
    const body = await req.json();
    const { businessName, contactName, email, phone, venueName } = body;

    if (!businessName || !contactName || !phone) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: businessName, contactName, phone." },
        { status: 400 }
      );
    }

    // Create vendor application
    const vendor = await vendorOperationsService.applyForVendorAccount(user.id, {
      businessName,
      contactName,
      email: email || user.email,
      phone,
      venueName,
    });

    // Also persist in database
    try {
      await prisma.vendor.upsert({
        where: { userId: user.id },
        update: {
          businessName,
          contactName,
          email: email || user.email,
          phone,
          kycStatus: "PENDING",
        },
        create: {
          userId: user.id,
          businessName,
          contactName,
          email: email || user.email,
          phone,
          kycStatus: "PENDING",
          commissionRate: 0.05,
        },
      });
    } catch {
      // Memory fallback active
    }

    return NextResponse.json({
      success: true,
      message: "Vendor partnership application submitted. Platform administrators will review and approve your account shortly.",
      vendor,
    }, { status: 201 });
  } catch (error: any) {
    const isUnauthorized = error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit vendor application" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
