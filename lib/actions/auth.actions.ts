"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { normalizeIndianPhone, getSafePhoneLogDetails } from "@/lib/auth/phone";

export type AuthContextChoice = "CUSTOMER" | "VENDOR";

export interface SendOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  maskedPhone?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  redirectUrl?: string;
  vendorStatus?: "APPROVED" | "PENDING" | "SUSPENDED" | "NOT_A_VENDOR";
  user?: {
    id: string;
    phone: string;
    role: string;
    status: string;
  };
  error?: string;
  errorCode?: string;
}

function sanitizeRedirectUrl(url?: string | null): string {
  if (!url) return "/profile";
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("://")) {
    return "/profile";
  }
  return url;
}

/**
 * 1. Send OTP to Indian Mobile Number (+91) via Supabase Auth + Twilio
 */
export async function sendOtp(phoneInput: string): Promise<SendOtpResult> {
  const norm = normalizeIndianPhone(phoneInput);
  const logInfo = getSafePhoneLogDetails(phoneInput);

  if (!norm.success || !norm.phone) {
    console.warn(`[Supabase Auth] Send OTP rejected: ${norm.error} (Country: ${logInfo.country}, Last4: ${logInfo.last4})`);
    return {
      success: false,
      error: norm.error || "Please enter a valid 10-digit Indian mobile number.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: norm.phone,
    });

    if (error) {
      console.error(`[Supabase Auth] signInWithOtp error: code=${error.code || "UNKNOWN"} message="${error.message}" (Country: ${logInfo.country}, Last4: ${logInfo.last4})`);
      return {
        success: false,
        error: error.message,
        errorCode: error.code || undefined,
        maskedPhone: norm.maskedPhone,
      };
    }

    console.log(`[Supabase Auth] signInWithOtp dispatched successfully (Country: ${logInfo.country}, Last4: ${logInfo.last4})`);

    return {
      success: true,
      message: `OTP sent successfully to ${norm.maskedPhone}`,
      maskedPhone: norm.maskedPhone,
    };
  } catch (err: any) {
    console.error(`[Supabase Auth] Unexpected exception: ${err.message} (Country: ${logInfo.country}, Last4: ${logInfo.last4})`);
    return {
      success: false,
      error: err.message || "Failed to dispatch OTP. Please try again.",
    };
  }
}

/**
 * 2. Verify 6-digit OTP and establish Session & Application User
 */
export async function verifyOtp(
  phoneInput: string,
  tokenInput: string,
  context: AuthContextChoice = "CUSTOMER",
  returnTo?: string
): Promise<VerifyOtpResult> {
  const norm = normalizeIndianPhone(phoneInput);
  const logInfo = getSafePhoneLogDetails(phoneInput);

  if (!norm.success || !norm.phone) {
    return {
      success: false,
      error: norm.error || "Invalid mobile number.",
    };
  }

  const cleanToken = tokenInput.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return {
      success: false,
      error: "Please enter a valid 6-digit verification code.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { session, user: supabaseUser },
      error,
    } = await supabase.auth.verifyOtp({
      phone: norm.phone,
      token: cleanToken,
      type: "sms",
    });

    if (error || !supabaseUser) {
      console.warn(`[Supabase Auth] verifyOtp failed: code=${error?.code || "INVALID_OTP"} message="${error?.message}" (Country: ${logInfo.country}, Last4: ${logInfo.last4})`);
      return {
        success: false,
        error: error?.message || "Invalid or expired verification code.",
        errorCode: error?.code || undefined,
      };
    }

    console.log(`[Supabase Auth] verifyOtp succeeded for User UUID=${supabaseUser.id} (Country: ${logInfo.country}, Last4: ${logInfo.last4})`);

    // Match or Provision Application User in Prisma
    let user = await prisma.user.findUnique({
      where: { authUserId: supabaseUser.id },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { phone: norm.phone },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authUserId: supabaseUser.id },
        });
      }
    }

    if (!user) {
      // First-login provisioning: Default role is always CUSTOMER
      user = await prisma.user.create({
        data: {
          authUserId: supabaseUser.id,
          phone: norm.phone,
          email: `${norm.rawDigits}@mobile.thebookmyvenues.in`,
          name: `User ${norm.rawDigits?.slice(-4)}`,
          role: "CUSTOMER", // Default role
          status: AccountStatus.ACTIVE,
        },
      });
    }

    if (user.status !== AccountStatus.ACTIVE) {
      return {
        success: false,
        error: `Your account is currently ${user.status.toLowerCase()}. Please contact support.`,
      };
    }

    // Contextual Routing
    if (context === "VENDOR") {
      if (user.role === "VENDOR") {
        return {
          success: true,
          redirectUrl: "/vendor",
          vendorStatus: "APPROVED",
          user: { id: user.id, phone: norm.phone, role: user.role, status: user.status },
        };
      } else {
        return {
          success: true,
          redirectUrl: "/vendor",
          vendorStatus: "NOT_A_VENDOR",
          user: { id: user.id, phone: norm.phone, role: user.role, status: user.status },
        };
      }
    }

    // Customer flow: preserve returnTo or default to /profile
    const target = sanitizeRedirectUrl(returnTo);
    return {
      success: true,
      redirectUrl: target,
      user: { id: user.id, phone: norm.phone, role: user.role, status: user.status },
    };
  } catch (err: any) {
    console.error(`[Supabase Auth] verifyOtp exception: ${err.message}`);
    return {
      success: false,
      error: err.message || "Failed to verify code. Please try again.",
    };
  }
}

/**
 * 3. Sign Out
 */
export async function signOut(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch {
    return { success: false };
  }
}
