"use server";

import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { normalizeIndianPhone, getSafePhoneLogDetails } from "@/lib/auth/phone";

export type AuthContextChoice = "CUSTOMER" | "VENDOR";

export interface SyncUserInput {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  phone?: string;
}

export interface SyncUserResult {
  success: boolean;
  user?: {
    id: string;
    authUserId: string | null;
    email: string;
    name: string;
    role: string;
    status: string;
    phone: string | null;
  };
  error?: string;
}

/**
 * Synchronizes a Firebase Authenticated user into Supabase PostgreSQL (via Prisma).
 */
export async function syncFirebaseUserToSupabase(input: SyncUserInput): Promise<SyncUserResult> {
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name?.trim() || cleanEmail.split("@")[0] || "Customer";
  const role = input.role === "VENDOR" ? "VENDOR" : "CUSTOMER";

  try {
    // 1. Check by Firebase Auth UID
    let user = await prisma.user.findUnique({
      where: { authUserId: input.uid },
    });

    // 2. If not found by UID, check by Email
    if (!user && cleanEmail) {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authUserId: input.uid,
            name: user.name || cleanName,
            updatedAt: new Date(),
          },
        });
      }
    }

    // 3. If still not found, create new User in Supabase/Postgres
    if (!user) {
      user = await prisma.user.create({
        data: {
          authUserId: input.uid,
          email: cleanEmail,
          name: cleanName,
          phone: input.phone || null,
          role: role,
          status: AccountStatus.ACTIVE,
        },
      });

      // If user selected VENDOR role, also create the Vendor record
      if (role === "VENDOR") {
        await prisma.vendor.create({
          data: {
            userId: user.id,
            businessName: `${cleanName}'s Venues`,
            contactName: cleanName,
            email: cleanEmail,
            phone: input.phone || "",
          },
        }).catch((err) => {
          console.warn("[Prisma] Vendor auto-provision notice:", err.message);
        });
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        authUserId: user.authUserId,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        phone: user.phone,
      },
    };
  } catch (err: any) {
    console.error(`[Supabase / Prisma Sync Error]: ${err.message}`);
    return {
      success: false,
      error: err.message || "Failed to sync user to Supabase database.",
    };
  }
}

/**
 * Fetch application profile from Supabase PostgreSQL by Firebase UID
 */
export async function getSupabaseUserProfile(uid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { authUserId: uid },
      include: {
        vendor: true,
      },
    });

    if (!user) return { success: false, error: "User not found." };

    return {
      success: true,
      user: {
        id: user.id,
        authUserId: user.authUserId,
        email: user.email,
        name: user.name,
        age: user.age,
        phone: user.phone,
        role: user.role,
        status: user.status,
        vendor: user.vendor ? {
          id: user.vendor.id,
          businessName: user.vendor.businessName,
          kycStatus: user.vendor.kycStatus,
        } : null,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update personal profile in Supabase PostgreSQL
 */
export async function updateSupabaseUserProfile(uid: string, data: { name?: string; age?: number | null; phone?: string }) {
  try {
    const updated = await prisma.user.update({
      where: { authUserId: uid },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.age !== undefined ? { age: data.age } : {}),
        ...(data.phone ? { phone: data.phone.trim() } : {}),
      },
    });
    return { success: true, user: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Legacy compatibility OTP actions
 */
export async function sendOtp(phone: string) {
  try {
    const normalized = normalizeIndianPhone(phone);
    return { success: true, phone: normalized };
  } catch (err: any) {
    return { success: false, error: err.message || "Invalid phone number" };
  }
}

export async function verifyOtp(phone: string, token: string, context: AuthContextChoice = "CUSTOMER") {
  try {
    const normalized = normalizeIndianPhone(phone);
    if (!token || token.trim().length !== 6 || !/^\d{6}$/.test(token.trim())) {
      return { success: false, error: "OTP must be a 6-digit number" };
    }
    return { success: true, phone: normalized, context };
  } catch (err: any) {
    return { success: false, error: err.message || "Verification failed" };
  }
}
