import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  UserCredential,
} from "firebase/auth";
import { auth } from "./client";
import { normalizeIndianPhone, getSafePhoneLogDetails } from "@/lib/auth/phone";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

/**
 * Initializes or retrieves the Firebase reCAPTCHA verifier.
 * @param containerId The DOM element ID or button ID to attach the verifier to.
 */
export function getRecaptchaVerifier(containerId: string = "recaptcha-container"): RecaptchaVerifier {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA verifier can only be initialized in the browser.");
  }

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // Ignore if already cleared
    }
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved - will allow signInWithPhoneNumber
    },
    "expired-callback": () => {
      console.warn("[Firebase Phone Auth] reCAPTCHA expired. User must solve it again.");
    },
  });

  return window.recaptchaVerifier;
}

export interface SendFirebaseOtpResult {
  success: boolean;
  confirmationResult?: ConfirmationResult;
  maskedPhone?: string;
  formattedPhone?: string;
  error?: string;
}

/**
 * Dispatches an SMS verification code to an Indian mobile number using Firebase Phone Auth.
 * @param rawPhone 10-digit Indian phone number (or +91 prefixed)
 * @param recaptchaContainerId DOM container ID
 */
export async function sendFirebasePhoneOtp(
  rawPhone: string,
  recaptchaContainerId: string = "recaptcha-container"
): Promise<SendFirebaseOtpResult> {
  const norm = normalizeIndianPhone(rawPhone);
  const logInfo = getSafePhoneLogDetails(rawPhone);

  if (!norm.success || !norm.phone) {
    return {
      success: false,
      error: norm.error || "Please enter a valid 10-digit Indian mobile number.",
    };
  }

  try {
    const appVerifier = getRecaptchaVerifier(recaptchaContainerId);
    console.log(`[Firebase Phone Auth] Requesting SMS OTP for ${norm.maskedPhone} (Country: ${logInfo.country})`);

    const confirmationResult = await signInWithPhoneNumber(auth, norm.phone, appVerifier);
    window.confirmationResult = confirmationResult;

    return {
      success: true,
      confirmationResult,
      maskedPhone: norm.maskedPhone,
      formattedPhone: norm.phone,
    };
  } catch (err: any) {
    console.error(`[Firebase Phone Auth] signInWithPhoneNumber error: ${err.message}`);
    return {
      success: false,
      error: err.message || "Failed to dispatch verification code. Please try again.",
    };
  }
}

export interface VerifyFirebaseOtpResult {
  success: boolean;
  userCredential?: UserCredential;
  user?: {
    uid: string;
    phoneNumber: string | null;
  };
  error?: string;
}

/**
 * Verifies the 6-digit OTP code and signs in the user.
 * @param code 6-digit SMS verification code
 * @param confirmation Optional ConfirmationResult instance
 */
export async function verifyFirebasePhoneOtp(
  code: string,
  confirmation?: ConfirmationResult
): Promise<VerifyFirebaseOtpResult> {
  const activeConfirmation = confirmation || (typeof window !== "undefined" ? window.confirmationResult : undefined);

  if (!activeConfirmation) {
    return {
      success: false,
      error: "No active verification session found. Please request a new OTP code.",
    };
  }

  const cleanCode = code.trim();
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: "Please enter a valid 6-digit verification code.",
    };
  }

  try {
    const userCredential = await activeConfirmation.confirm(cleanCode);
    console.log(`[Firebase Phone Auth] Verification successful. User UID: ${userCredential.user.uid}`);

    return {
      success: true,
      userCredential,
      user: {
        uid: userCredential.user.uid,
        phoneNumber: userCredential.user.phoneNumber,
      },
    };
  } catch (err: any) {
    console.error(`[Firebase Phone Auth] verify OTP error: ${err.message}`);
    return {
      success: false,
      error: err.code === "auth/invalid-verification-code"
        ? "Invalid verification code. Please check and try again."
        : err.message || "Failed to verify OTP code.",
    };
  }
}
