"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
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

type ModalState = "CHOOSER" | "CUSTOMER_PHONE" | "CUSTOMER_OTP" | "VENDOR_PHONE" | "VENDOR_OTP" | "SUCCESS";

export function FirebasePhoneModal() {
  const { isAuthModalOpen, authModalContext, authModalReturnTo, closeAuthModal } = useBookingStore();
  const router = useRouter();

  const [state, setState] = useState<ModalState>("CHOOSER");
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
      if (authModalContext === "VENDOR") {
        setState("VENDOR_PHONE");
      } else {
        setState("CHOOSER");
      }
      setPhoneNumber("");
      setOtpDigits(["", "", "", "", "", ""]);
      setError(null);
      setConfirmationResult(null);
    }
  }, [isAuthModalOpen, authModalContext]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((state === "CUSTOMER_OTP" || state === "VENDOR_OTP") && resendTimer > 0) {
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
  }, [state, resendTimer]);

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

    const res = await sendFirebasePhoneOtp(phoneNumber, "recaptcha-verifier-modal");
    setLoading(false);

    if (res.success && res.confirmationResult) {
      setConfirmationResult(res.confirmationResult);
      setMaskedPhone(res.maskedPhone || `+91 XXXXX ${phoneNumber.slice(-4)}`);
      if (state === "CUSTOMER_PHONE") {
        setState("CUSTOMER_OTP");
      } else {
        setState("VENDOR_OTP");
      }
      setResendTimer(30);
      setCanResend(false);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } else {
      setError(res.error || "Failed to dispatch SMS OTP. Please try again.");
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
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifyFirebasePhoneOtp(token, confirmationResult || undefined);
    setLoading(false);

    if (res.success && res.user) {
      const role = state === "VENDOR_OTP" ? "VENDOR" : "CUSTOMER";
      await firestoreService.syncUser({
        uid: res.user.uid,
        phoneNumber: res.user.phoneNumber,
      });

      setState("SUCCESS");
      setTimeout(() => {
        closeAuthModal();
        const target = authModalReturnTo || (role === "VENDOR" ? "/vendor" : "/profile");
        router.push(target);
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || "Invalid OTP code. Please check and try again.");
    }
  };

  const isVendor = state.startsWith("VENDOR");

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

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Firebase Phone Authentication"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-t-[32px] sm:rounded-3xl border border-white/40 dark:border-slate-800 shadow-2xl overflow-hidden z-10"
          >
            {/* Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />

            {/* Hidden Recaptcha Anchor */}
            <div id="recaptcha-verifier-modal" />

            {/* Header / Close Bar */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              {state !== "CHOOSER" && state !== "SUCCESS" ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    if (state === "CUSTOMER_OTP") setState("CUSTOMER_PHONE");
                    else if (state === "VENDOR_OTP") setState("VENDOR_PHONE");
                    else setState("CHOOSER");
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

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
                {/* 1. CHOOSER STATE */}
                {state === "CHOOSER" && (
                  <motion.div
                    key="chooser"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-1.5">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Welcome to TheBookMyVenues
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Choose how you would like to experience the platform
                      </p>
                    </div>

                    <div className="grid gap-3.5">
                      {/* Customer Card */}
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setState("CUSTOMER_PHONE");
                        }}
                        className="group w-full p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-500/50 text-left transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Book a venue
                              </h3>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                                Customer
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-snug">
                              Discover venues, reserve slots and manage your bookings.
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>

                      {/* Vendor Card */}
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setState("VENDOR_PHONE");
                        }}
                        className="group w-full p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500/50 text-left transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                I own a venue
                              </h3>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                Vendor
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-snug">
                              Manage your venues, availability, bookings and earnings.
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    </div>

                    <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Direct Firebase Phone Number OTP Authentication</span>
                    </div>
                  </motion.div>
                )}

                {/* 2. PHONE INPUT STATE */}
                {(state === "CUSTOMER_PHONE" || state === "VENDOR_PHONE") && (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-1.5">
                      <div
                        className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                          isVendor
                            ? "bg-indigo-500/10 text-indigo-600"
                            : "bg-brand-500/10 text-brand-600"
                        }`}
                      >
                        {isVendor ? <Building2 className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {isVendor ? "Welcome, venue partner." : "Let's get you booked."}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Enter your mobile number to receive a verification OTP.
                      </p>
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Mobile Number
                        </label>
                        <div className="flex items-center rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all overflow-hidden">
                          <div className="px-4 py-3.5 bg-slate-100/80 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 select-none">
                            🇮🇳 +91
                          </div>
                          <input
                            type="tel"
                            autoFocus
                            required
                            placeholder="98765 43210"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            className="w-full px-4 py-3.5 bg-transparent text-slate-900 dark:text-white font-bold text-base tracking-wider outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={loading || phoneNumber.length !== 10}
                        className={`w-full py-4 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                          isVendor
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25"
                            : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/25"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {/* 3. OTP VERIFICATION STATE */}
                {(state === "CUSTOMER_OTP" || state === "VENDOR_OTP") && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-1.5">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                        <Phone className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Enter the 6-digit code
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        SMS code dispatched to {maskedPhone}
                      </p>
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
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
                            className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                          />
                        ))}
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={loading || otpDigits.join("").length !== 6}
                        className={`w-full py-4 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                          isVendor
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25"
                            : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/25"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                      </motion.button>
                    </form>

                    <div className="text-center pt-2">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpDigits(["", "", "", "", "", ""]);
                            setResendTimer(30);
                            setCanResend(false);
                            sendFirebasePhoneOtp(phoneNumber, "recaptcha-verifier-modal");
                          }}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
                        >
                          Resend Code
                        </button>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">
                          Resend code in <span className="font-bold text-slate-700 dark:text-slate-300">{resendTimer}s</span>
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 4. SUCCESS STATE */}
                {state === "SUCCESS" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="py-8 text-center space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      >
                        <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
                      </motion.div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        You&apos;re all set!
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Firebase Mobile Phone Verified. Redirecting...
                      </p>
                    </div>
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
