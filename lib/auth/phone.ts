/**
 * Canonical Phone Normalization Helper for Indian Numbers (+91).
 * Converts user-supplied phone numbers to canonical E.164 format.
 */

export interface NormalizedPhoneResult {
  success: boolean;
  phone?: string; // Canonical E.164 format: +919391997586
  rawDigits?: string; // 10 digits: 9391997586
  maskedPhone?: string; // Masked for safe logs and UI: +91 XXXXX 97586
  error?: string;
}

/**
 * Normalizes an Indian phone number string into E.164 format (+91XXXXXXXXXX).
 * 
 * Rules:
 * 1. Strips all spaces, hyphens, parenthesis, and non-digit characters except leading '+'.
 * 2. If it starts with '+91', strips '+91'.
 * 3. If it starts with '91' and length is 12, strips '91'.
 * 4. If it starts with '0' and length is 11, strips '0'.
 * 5. Verifies exactly 10 digits remaining.
 * 6. Verifies valid Indian mobile starting digit (6, 7, 8, or 9).
 * 7. Returns canonical E.164 format: +91XXXXXXXXXX.
 */
export function normalizeIndianPhone(input: string | null | undefined): NormalizedPhoneResult {
  if (!input || typeof input !== "string") {
    return {
      success: false,
      error: "Phone number is required.",
    };
  }

  // Strip all non-digit characters
  let digits = input.replace(/\D/g, "");

  // Remove leading country code 91 if 12 digits (e.g. 919391997586)
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Remove leading trunk 0 if 11 digits (e.g. 09391997586)
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Validate exactly 10 digits
  if (digits.length !== 10) {
    return {
      success: false,
      error: "Please enter a valid 10-digit Indian mobile number.",
    };
  }

  // Validate Indian mobile prefix (starts with 6, 7, 8, 9)
  if (!/^[6-9]/.test(digits)) {
    return {
      success: false,
      error: "Invalid mobile number. Indian mobile numbers must begin with 6, 7, 8, or 9.",
    };
  }

  const phone = `+91${digits}`;
  const maskedPhone = `+91 XXXXX ${digits.slice(5)}`;

  return {
    success: true,
    phone,
    rawDigits: digits,
    maskedPhone,
  };
}

/**
 * Helper to produce safe log snippet without exposing complete number.
 */
export function getSafePhoneLogDetails(phoneInput: string) {
  const norm = normalizeIndianPhone(phoneInput);
  if (!norm.success || !norm.rawDigits) {
    return { country: "IN (+91)", last4: "INVALID", valid: false };
  }
  return {
    country: "IN (+91)",
    last4: norm.rawDigits.slice(-4),
    masked: norm.maskedPhone,
    valid: true,
  };
}
