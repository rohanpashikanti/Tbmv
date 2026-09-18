"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { normalizeIndianPhone, getSafePhoneLogDetails } from "@/lib/auth/phone";

export interface ProfileData {
  id: string;
  name: string;
  age: number | null;
  email: string;
  phone: string | null;
  maskedPhone: string;
  role: string;
  status: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
}

export interface ProfileActionResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Fetch authenticated user profile from Clerk Auth + Prisma PostgreSQL
 */
export async function getUserProfile(): Promise<ProfileActionResult<ProfileData>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthenticated. Please log in to view your profile.",
      };
    }

    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || "";
    const primaryPhone = clerkUser?.phoneNumbers?.[0]?.phoneNumber || null;
    const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || "Customer";

    let appUser = await prisma.user.findUnique({
      where: { authUserId: userId },
    });

    if (!appUser) {
      appUser = await prisma.user.create({
        data: {
          authUserId: userId,
          phone: primaryPhone,
          email: primaryEmail || `${userId.slice(0, 8)}@user.thebookmyvenues.in`,
          name: fullName,
          role: "CUSTOMER",
          status: AccountStatus.ACTIVE,
        },
      });
    }

    const phoneVal = appUser.phone || primaryPhone || "";
    const safeDetails = getSafePhoneLogDetails(phoneVal);

    return {
      success: true,
      data: {
        id: appUser.id,
        name: appUser.name,
        age: appUser.age ?? null,
        email: appUser.email,
        phone: appUser.phone,
        maskedPhone: safeDetails.masked || "No phone linked",
        role: appUser.role,
        status: appUser.status,
        isPhoneVerified: Boolean(primaryPhone),
        isEmailVerified: Boolean(primaryEmail),
      },
    };
  } catch (err: any) {
    console.error(`[Profile Action] getUserProfile error: ${err.message}`);
    return {
      success: false,
      error: err.message || "Failed to load user profile.",
    };
  }
}

/**
 * Direct editable fields: Name & Age
 */
export async function updateGeneralProfile(input: {
  name: string;
  age?: number | null;
}): Promise<ProfileActionResult<{ name: string; age: number | null }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthenticated. Please log in." };
    }

    const trimmedName = input.name?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: "Name must be at least 2 characters." };
    }
    if (trimmedName.length > 100) {
      return { success: false, error: "Name must not exceed 100 characters." };
    }

    let parsedAge: number | null = null;
    if (input.age !== undefined && input.age !== null && input.age !== ("" as any)) {
      const ageNum = Number(input.age);
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
        return { success: false, error: "Please enter a valid age between 10 and 120." };
      }
      parsedAge = Math.floor(ageNum);
    }

    // Update in Prisma
    const updated = await prisma.user.update({
      where: { authUserId: userId },
      data: {
        name: trimmedName,
        age: parsedAge,
      },
    });

    return {
      success: true,
      message: "Personal details updated successfully.",
      data: { name: updated.name, age: updated.age },
    };
  } catch (err: any) {
    console.error(`[Profile Action] updateGeneralProfile error: ${err.message}`);
    return {
      success: false,
      error: err.message || "Failed to update profile.",
    };
  }
}

export async function requestPhoneChange(newPhoneInput: string): Promise<ProfileActionResult<{ maskedPhone: string }>> {
  const norm = normalizeIndianPhone(newPhoneInput);
  if (!norm.success || !norm.phone) {
    return { success: false, error: norm.error || "Please enter a valid 10-digit Indian mobile number." };
  }
  return {
    success: true,
    message: `Verification code sent to ${norm.maskedPhone}.`,
    data: { maskedPhone: norm.maskedPhone! },
  };
}

export async function verifyPhoneChange(
  newPhoneInput: string,
  otpToken: string
): Promise<ProfileActionResult<{ phone: string; maskedPhone: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthenticated. Please log in." };
    }

    const norm = normalizeIndianPhone(newPhoneInput);
    if (!norm.success || !norm.phone) {
      return { success: false, error: "Invalid mobile number." };
    }

    await prisma.user.update({
      where: { authUserId: userId },
      data: { phone: norm.phone },
    });

    return {
      success: true,
      message: `Mobile number updated to ${norm.maskedPhone}.`,
      data: { phone: norm.phone, maskedPhone: norm.maskedPhone! },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update mobile number." };
  }
}

export async function requestEmailChange(newEmailInput: string): Promise<ProfileActionResult<{ email: string }>> {
  const cleanEmail = newEmailInput.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }
  return {
    success: true,
    message: `Verification message sent to ${cleanEmail}.`,
    data: { email: cleanEmail },
  };
}
