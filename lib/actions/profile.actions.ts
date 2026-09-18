"use server";

import { createClient } from "@/lib/supabase/server";
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
 * Fetch authenticated user profile from Supabase Auth + Prisma PostgreSQL
 */
export async function getUserProfile(): Promise<ProfileActionResult<ProfileData>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return {
        success: false,
        error: "Unauthenticated. Please log in to view your profile.",
      };
    }

    let appUser = await prisma.user.findUnique({
      where: { authUserId: supabaseUser.id },
    });

    if (!appUser && supabaseUser.phone) {
      // Find by phone
      appUser = await prisma.user.findFirst({
        where: { phone: supabaseUser.phone },
      });
      if (appUser) {
        appUser = await prisma.user.update({
          where: { id: appUser.id },
          data: { authUserId: supabaseUser.id },
        });
      }
    }

    if (!appUser) {
      // Provision if somehow missing
      const rawPhone = supabaseUser.phone || "";
      const digits = rawPhone.replace(/\D/g, "");
      appUser = await prisma.user.create({
        data: {
          authUserId: supabaseUser.id,
          phone: supabaseUser.phone || null,
          email: supabaseUser.email || `${digits || supabaseUser.id.slice(0, 8)}@mobile.thebookmyvenues.in`,
          name: supabaseUser.user_metadata?.name || `User ${digits.slice(-4) || "Guest"}`,
          role: "CUSTOMER",
          status: AccountStatus.ACTIVE,
        },
      });
    }

    const phoneVal = appUser.phone || supabaseUser.phone || "";
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
        isPhoneVerified: Boolean(supabaseUser.phone && supabaseUser.phone_confirmed_at),
        isEmailVerified: Boolean(supabaseUser.email && supabaseUser.email_confirmed_at),
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
 * 1. Direct editable fields: Name & Age (No OTP required)
 */
export async function updateGeneralProfile(input: {
  name: string;
  age?: number | null;
}): Promise<ProfileActionResult<{ name: string; age: number | null }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
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
      where: { authUserId: supabaseUser.id },
      data: {
        name: trimmedName,
        age: parsedAge,
      },
    });

    // Sync user_metadata in Supabase Auth
    await supabase.auth.updateUser({
      data: { name: trimmedName, age: parsedAge },
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

/**
 * 2. Mobile Identity Field: Request Phone Change (Dispatches Twilio OTP to NEW number)
 */
export async function requestPhoneChange(newPhoneInput: string): Promise<ProfileActionResult<{ maskedPhone: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return { success: false, error: "Unauthenticated. Please log in." };
    }

    const norm = normalizeIndianPhone(newPhoneInput);
    if (!norm.success || !norm.phone) {
      return { success: false, error: norm.error || "Please enter a valid 10-digit Indian mobile number." };
    }

    if (norm.phone === supabaseUser.phone) {
      return { success: false, error: "New mobile number cannot be the same as your current verified number." };
    }

    // Check if phone is already claimed by another user in Prisma
    const existing = await prisma.user.findFirst({
      where: {
        phone: norm.phone,
        authUserId: { not: supabaseUser.id },
      },
    });

    if (existing) {
      return { success: false, error: "This mobile number is already linked to another account." };
    }

    // Call Supabase Auth to request phone update (dispatches OTP to new phone via Twilio)
    const { error: updateError } = await supabase.auth.updateUser({
      phone: norm.phone,
    });

    if (updateError) {
      console.error(`[Profile Action] requestPhoneChange error: ${updateError.message}`);
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      message: `Verification code sent to ${norm.maskedPhone}. Please enter the 6-digit OTP to confirm.`,
      data: { maskedPhone: norm.maskedPhone! },
    };
  } catch (err: any) {
    console.error(`[Profile Action] requestPhoneChange exception: ${err.message}`);
    return {
      success: false,
      error: err.message || "Failed to send verification code to new number.",
    };
  }
}

/**
 * 3. Mobile Identity Field: Verify Phone Change OTP and Update Database
 */
export async function verifyPhoneChange(
  newPhoneInput: string,
  otpToken: string
): Promise<ProfileActionResult<{ phone: string; maskedPhone: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return { success: false, error: "Unauthenticated. Please log in." };
    }

    const norm = normalizeIndianPhone(newPhoneInput);
    if (!norm.success || !norm.phone) {
      return { success: false, error: norm.error || "Invalid mobile number." };
    }

    const cleanToken = otpToken.trim();
    if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      return { success: false, error: "Please enter a valid 6-digit verification code." };
    }

    // Verify OTP with Supabase Auth for phone change
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: norm.phone,
      token: cleanToken,
      type: "phone_change",
    });

    if (verifyError || !data.user) {
      console.warn(`[Profile Action] verifyPhoneChange failed: ${verifyError?.message}`);
      return {
        success: false,
        error: verifyError?.message || "Invalid or expired verification code.",
      };
    }

    // Update verified phone in Prisma PostgreSQL database
    await prisma.user.update({
      where: { authUserId: supabaseUser.id },
      data: { phone: norm.phone },
    });

    return {
      success: true,
      message: `Mobile number updated to ${norm.maskedPhone} and verified with Supabase Auth.`,
      data: {
        phone: norm.phone,
        maskedPhone: norm.maskedPhone!,
      },
    };
  } catch (err: any) {
    console.error(`[Profile Action] verifyPhoneChange exception: ${err.message}`);
    return {
      success: false,
      error: err.message || "Failed to verify and update mobile number.",
    };
  }
}

/**
 * 4. Email Identity Field: Request Email Change (Dispatches verification link/OTP to NEW email)
 */
export async function requestEmailChange(newEmailInput: string): Promise<ProfileActionResult<{ email: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return { success: false, error: "Unauthenticated. Please log in." };
    }

    const cleanEmail = newEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (cleanEmail === supabaseUser.email?.toLowerCase()) {
      return { success: false, error: "New email cannot be the same as your current email." };
    }

    // Check if email already exists in Prisma
    const existing = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        authUserId: { not: supabaseUser.id },
      },
    });

    if (existing) {
      return { success: false, error: "This email is already registered to another account." };
    }

    // Request email update via Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      email: cleanEmail,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      message: `Verification message sent to ${cleanEmail}. Please verify to complete the change.`,
      data: { email: cleanEmail },
    };
  } catch (err: any) {
    console.error(`[Profile Action] requestEmailChange exception: ${err.message}`);
    return {
      success: false,
      error: err.message || "Failed to request email change.",
    };
  }
}
