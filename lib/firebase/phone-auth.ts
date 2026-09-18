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
 * Initializes or resets the Firebase reCAPTCHA verifier safely.
 * Cleans up any prior rendered instances to prevent "reCAPTCHA has already been rendered" error.
 * @param containerId The DOM element ID to attach the verifier to.
 */
export function getRecaptchaVerifier(containerId: string = "recaptcha-verifier-container"): RecaptchaVerifier {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA verifier can only be initialized in the browser.");
  }

  // Clear existing verifier if any
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // Ignore if already cleared
    }
    delete window.recaptchaVerifier;
  }

  // Clear container DOM to prevent duplicate iframe rendering
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      console.warn("[Firebase Phone Auth] reCAPTCHA expired. Resetting...");
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {}
        delete window.recaptchaVerifier;
      }
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
  recaptchaContainerId: string = "recaptcha-verifier-container"
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
    console.error(`[Firebase Phone Auth] signInWithPhoneNumber error: [${err.code}] ${err.message}`);

    // Clean up verifier on error so subsequent attempts start fresh
    if (typeof window !== "undefined" && window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
      delete window.recaptchaVerifier;
    }

    let userMessage = err.message || "Failed to dispatch verification code. Please try again.";

    if (err.code === "auth/billing-not-enabled") {
      userMessage = "Firebase requires billing (Blaze plan) to send real SMS messages, or you can add your number under 'Phone numbers for testing' in Firebase Console for free instant testing.";
    } else if (err.code === "auth/operation-not-allowed") {
      userMessage = "Phone Authentication is not enabled in your Firebase Console. Please go to Firebase Console -> Authentication -> Sign-in method and enable 'Phone'.";
    } else if (err.code === "auth/too-many-requests") {
      userMessage = "Too many SMS requests. Please wait a few minutes before trying again or use a test phone number in Firebase Console.";
    } else if (err.code === "auth/invalid-phone-number") {
      userMessage = "The phone number entered is invalid. Please enter a valid 10-digit Indian mobile number.";
    } else if (err.code === "auth/captcha-check-failed") {
      userMessage = "reCAPTCHA verification failed. Please try sending again.";
    } else if (err.code === "auth/quota-exceeded") {
      userMessage = "SMS quota exceeded for this Firebase project. Enable Blaze plan or configure Test Phone Numbers in Firebase Console.";
    }

    return {
      success: false,
      error: userMessage,
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
    console.error(`[Firebase Phone Auth] verify OTP error: [${err.code}] ${err.message}`);
    return {
      success: false,
      error: err.code === "auth/invalid-verification-code"
        ? "Invalid verification code. Please check and try again."
        : err.code === "auth/code-expired"
        ? "The verification code has expired. Please request a new one."
        : err.message || "Failed to verify OTP code.",
    };
  }
}
