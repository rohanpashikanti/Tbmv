"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Lock,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useBookingStore } from "@/stores/booking-store";
import { sendFirebasePhoneOtp, verifyFirebasePhoneOtp } from "@/lib/firebase/phone-auth";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { ConfirmationResult } from "firebase/auth";
import { useRouter } from "next/navigation";

type Step = "PHONE" | "OTP" | "SUCCESS";

export function FirebasePhoneModal() {
  const { isAuthModalOpen, authModalContext, authModalReturnTo, closeAuthModal } = useBookingStore();
  const router = useRouter();

  const [step, setStep] = useState<Step>("PHONE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthModalOpen) {
      setStep("PHONE");
      setPhoneNumber("");
      setOtpDigits(["", "", "", "", "", ""]);
      setError(null);
      setConfirmationResult(null);
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "OTP" && resendTimer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(raw);
    setError(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await sendFirebasePhoneOtp(phoneNumber, "recaptcha-verifier-container");
    setLoading(false);

    if (res.success && res.confirmationResult) {
      setConfirmationResult(res.confirmationResult);
      setMaskedPhone(res.maskedPhone || `+91 XXXXX ${phoneNumber.slice(-4)}`);
      setStep("OTP");
      setResendTimer(30);
      setCanResend(false);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } else {
      setError(res.error || "Failed to send SMS OTP. Please try again.");
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split("");
      const next = [...otpDigits];
      pasted.forEach((d, i) => {
        if (i < 6) next[i] = d;
      });
      setOtpDigits(next);
      const targetIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[targetIndex]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join("");
    if (token.length !== 6) {
      setError("Please enter the full 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifyFirebasePhoneOtp(token, confirmationResult || undefined);
    setLoading(false);

    if (res.success && res.user) {
      // Sync user profile in Firestore
      await firestoreService.syncUser({
        uid: res.user.uid,
        phoneNumber: res.user.phoneNumber,
      });

      setStep("SUCCESS");
      setTimeout(() => {
        closeAuthModal();
        const target = authModalReturnTo || (authModalContext === "VENDOR" ? "/vendor" : "/profile");
        router.push(target);
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || "Invalid OTP code. Please check and try again.");
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-t-[32px] sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10"
          >
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />

            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-verifier-container" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Firebase Phone Auth
                </span>
              </div>
              <button
                type="button"
                onClick={closeAuthModal}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 pt-2 pb-8">
              <AnimatePresence mode="wait">
                {step === "PHONE" && (
                  <motion.div
                    key="phone-step"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Enter your mobile number
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        We&apos;ll send a 6-digit SMS verification code to your phone.
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all overflow-hidden">
                          <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 select-none">
                            🇮🇳 +91
                          </div>
                          <input
                            type="tel"
                            autoFocus
                            required
                            placeholder="98765 43210"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            className="w-full px-4 py-3 bg-transparent text-slate-900 dark:text-white font-bold text-base outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || phoneNumber.length !== 10}
                        className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Protected by Firebase Auth & Google reCAPTCHA</span>
                    </div>
                  </motion.div>
                )}

                {step === "OTP" && (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Enter 6-digit code
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Code sent to {maskedPhone}
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputsRef.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-11 h-13 text-center text-xl font-black rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpDigits.join("").length !== 6}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify & Sign In</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="text-center">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpDigits(["", "", "", "", "", ""]);
                            setResendTimer(30);
                            setCanResend(false);
                            sendFirebasePhoneOtp(phoneNumber, "recaptcha-verifier-container");
                          }}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700"
                        >
                          Resend Code
                        </button>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Resend code in <span className="font-bold text-slate-700">{resendTimer}s</span>
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === "SUCCESS" && (
                  <motion.div
                    key="success-step"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-6 text-center space-y-3"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Verified Successfully!
                    </h2>
                    <p className="text-xs text-slate-500">
                      Authenticated with Firebase & Firestore. Redirecting...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
