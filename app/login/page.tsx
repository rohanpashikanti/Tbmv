"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Building2,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
  Phone,
  RefreshCw,
  Lock,
} from "lucide-react";
import { sendOtp, verifyOtp, AuthContextChoice } from "@/lib/actions/auth.actions";

function sanitizeRedirectUrl(url?: string | null): string {
  if (!url) return "/profile";
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("://")) {
    return "/profile";
  }
  return url;
}

type AuthPageState = "CHOOSER" | "CUSTOMER_PHONE" | "CUSTOMER_OTP" | "VENDOR_PHONE" | "VENDOR_OTP" | "SUCCESS";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const returnTo = sanitizeRedirectUrl(rawNext);

  const [state, setState] = useState<AuthPageState>("CHOOSER");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ redirectUrl?: string; vendorStatus?: string } | null>(null);
  const [maskedNumber, setMaskedNumber] = useState("");

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await sendOtp(phoneNumber);
    setLoading(false);

    if (res.success) {
      setResendTimer(30);
      setCanResend(false);
      setMaskedNumber(res.maskedPhone || `+91 XXXXX ${phoneNumber.slice(-4)}`);
      if (state === "CUSTOMER_PHONE") {
        setState("CUSTOMER_OTP");
      } else {
        setState("VENDOR_OTP");
      }
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } else {
      setError(res.error || "Could not dispatch OTP. Please verify your number.");
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
      setError("Please enter all 6 verification digits.");
      return;
    }

    setLoading(true);
    setError(null);

    const context: AuthContextChoice = state === "VENDOR_OTP" ? "VENDOR" : "CUSTOMER";
    const res = await verifyOtp(phoneNumber, token, context, returnTo);

    setLoading(false);

    if (res.success) {
      setSuccessInfo(res);
      setState("SUCCESS");
      setTimeout(() => {
        if (res.redirectUrl) {
          router.push(res.redirectUrl);
          router.refresh();
        }
      }, 1600);
    } else {
      setError(res.error || "Verification failed. Please double check the code.");
    }
  };

  const isCustomer = state.startsWith("CUSTOMER");
  const isVendor = state.startsWith("VENDOR");

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/80 dark:border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />

        {state !== "CHOOSER" && state !== "SUCCESS" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              if (state === "CUSTOMER_OTP") setState("CUSTOMER_PHONE");
              else if (state === "VENDOR_OTP") setState("VENDOR_PHONE");
              else setState("CHOOSER");
            }}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* 1. CHOOSER */}
          {state === "CHOOSER" && (
            <motion.div
              key="chooser"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Welcome to TheBookMyVenues
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Choose your path to get started
                </p>
              </div>

              <div className="grid gap-4">
                {/* Customer */}
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
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          Book a venue
                        </h2>
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

                {/* Vendor */}
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
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          I own a venue
                        </h2>
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
                <span>Secure 256-bit Supabase Mobile OTP Verification</span>
              </div>
            </motion.div>
          )}

          {/* 2. PHONE */}
          {(state === "CUSTOMER_PHONE" || state === "VENDOR_PHONE") && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1.5">
                <div
                  className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                    isVendor ? "bg-indigo-500/10 text-indigo-600" : "bg-brand-500/10 text-brand-600"
                  }`}
                >
                  {isVendor ? <Building2 className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {isVendor ? "Welcome, venue partner." : "Let's get you booked."}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Enter your mobile number to continue.
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
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* 3. OTP */}
          {(state === "CUSTOMER_OTP" || state === "VENDOR_OTP") && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
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
                  Code sent to {maskedNumber || `+91 XXXXX ${phoneNumber.slice(-4)}`}
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
                      <span>Verify & Continue</span>
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
                      sendOtp(phoneNumber);
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

          {/* 4. SUCCESS */}
          {state === "SUCCESS" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
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
                  You&apos;re all set.
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {successInfo?.vendorStatus === "NOT_A_VENDOR"
                    ? "Signed in as customer. Redirecting..."
                    : "Identity verified. Redirecting..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <p className="text-sm font-bold text-slate-400">Loading gateway...</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
