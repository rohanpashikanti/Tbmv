"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  Building2,
  Calendar,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Phone,
  KeyRound,
} from "lucide-react";
import { useBookingStore } from "@/stores/booking-store";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { sendFirebasePhoneOtp, verifyFirebasePhoneOtp } from "@/lib/firebase/phone-auth";
import { ConfirmationResult } from "firebase/auth";
import { useRouter } from "next/navigation";

type AuthMode = "SIGNIN" | "SIGNUP" | "FORGOT" | "PHONE_OTP";

export function FirebasePhoneModal() {
  const { isAuthModalOpen, authModalContext, authModalReturnTo, closeAuthModal } = useBookingStore();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } = useFirebaseAuth();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("SIGNIN");
  const [role, setRole] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP Flow State
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(30);

  // Status & Alerts
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode("SIGNIN");
      setRole(authModalContext === "VENDOR" ? "VENDOR" : "CUSTOMER");
      setError(null);
      setSuccessMsg(null);
      setPassword("");
      setIsOtpStep(false);
      setOtpDigits(["", "", "", "", "", ""]);
    }
  }, [isAuthModalOpen, authModalContext]);

  // Resend Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "PHONE_OTP" && isOtpStep && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, isOtpStep, resendTimer]);

  const handleAuthSuccess = (redirectTarget?: string) => {
    setSuccessMsg("Authenticated successfully! Loading your session...");
    setTimeout(() => {
      closeAuthModal();
      const target = redirectTarget || authModalReturnTo || (role === "VENDOR" ? "/vendor" : "/profile");
      router.push(target);
      router.refresh();
    }, 1200);
  };

  // Submit Sign In (Email & Password)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signInWithEmail(email, password);
    setLoading(false);

    if (res.success) {
      handleAuthSuccess();
    } else {
      setError(res.error || "Failed to sign in. Please verify your email and password.");
    }
  };

  // Submit Sign Up (Email & Password)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await signUpWithEmail(email, password, name, role);
    setLoading(false);

    if (res.success) {
      handleAuthSuccess();
    } else {
      setError(res.error || "Failed to create account. Please try again.");
    }
  };

  // Submit Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await sendPasswordReset(email);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || "Password reset email sent! Check your inbox.");
      setTimeout(() => setMode("SIGNIN"), 3000);
    } else {
      setError(res.error || "Failed to send reset email.");
    }
  };

  // Google OAuth
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    const res = await signInWithGoogle(role);
    setLoading(false);

    if (res.success) {
      handleAuthSuccess();
    } else if (res.error) {
      setError(res.error);
    }
  };

  // Phone OTP Flow
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await sendFirebasePhoneOtp(phone, "recaptcha-modal-target");
    setLoading(false);

    if (res.success && res.confirmationResult) {
      setConfirmationResult(res.confirmationResult);
      setMaskedPhone(res.maskedPhone || `+91 ${phone}`);
      setIsOtpStep(true);
      setResendTimer(30);
    } else {
      setError(res.error || "Failed to dispatch SMS OTP.");
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join("");
    if (token.length !== 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifyFirebasePhoneOtp(token, confirmationResult || undefined);
    setLoading(false);

    if (res.success && res.user) {
      handleAuthSuccess();
    } else {
      setError(res.error || "Invalid OTP code.");
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

          {/* Hidden reCAPTCHA container for Phone Auth */}
          <div id="recaptcha-modal-target" />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="TheBookMyVenues Authentication"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-t-[32px] sm:rounded-3xl border border-white/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10"
          >
            {/* Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />

            {/* Header / Close */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  TheBook<span className="text-brand-600 dark:text-brand-400">MyVenues</span>
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
            <div className="p-6 pt-2 pb-7 space-y-4">
              {/* Tab Selector (Sign In vs Sign Up) */}
              {mode !== "FORGOT" && mode !== "PHONE_OTP" && (
                <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("SIGNIN");
                      setError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      mode === "SIGNIN"
                        ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("SIGNUP");
                      setError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      mode === "SIGNUP"
                        ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Error Message Alert */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Success Message Alert */}
              {successMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* 1. SIGN IN FORM (EMAIL & PASSWORD) */}
              {mode === "SIGNIN" && (
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Email Address
                    </label>
                    <div className="flex items-center px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 transition-all">
                      <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                      <input
                        type="email"
                        autoFocus
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("FORGOT");
                          setError(null);
                        }}
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="flex items-center px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 transition-all">
                      <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In with Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 2. SIGN UP FORM (EMAIL, PASSWORD, NAME, ROLE) */}
              {mode === "SIGNUP" && (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Full Name
                    </label>
                    <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 transition-all">
                      <UserIcon className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        required
                        placeholder="Rohan Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 transition-all">
                      <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Create Password (Min 6 chars)
                    </label>
                    <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 transition-all">
                      <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Account Type Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      I want to
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("CUSTOMER")}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          role === "CUSTOMER"
                            ? "bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Venues</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("VENDOR")}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          role === "VENDOR"
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Host Venues</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email || !password || !name}
                    className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Free Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 3. FORGOT PASSWORD */}
              {mode === "FORGOT" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Reset your password
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enter your email and we&apos;ll send you a password reset link.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 transition-all">
                      <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                      <input
                        type="email"
                        autoFocus
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("SIGNIN")}
                      className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-2/3 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      <span>Send Reset Link</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 4. PHONE OTP ALTERNATIVE */}
              {mode === "PHONE_OTP" && (
                <div className="space-y-4">
                  {!isOtpStep ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Mobile OTP Login
                        </span>
                        <button
                          type="button"
                          onClick={() => setMode("SIGNIN")}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700"
                        >
                          Use Email
                        </button>
                      </div>

                      <div className="flex items-center rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 overflow-hidden">
                        <div className="px-3.5 py-3 bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 select-none">
                          🇮🇳 +91
                        </div>
                        <input
                          type="tel"
                          autoFocus
                          required
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className="w-full px-3 py-3 bg-transparent text-slate-900 dark:text-white font-bold text-sm outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || phone.length !== 10}
                        className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                        <span>Send SMS OTP</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyPhoneOtp} className="space-y-3.5">
                      <div className="text-center space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Enter 6-Digit Code
                        </h4>
                        <p className="text-xs text-slate-500">Sent to {maskedPhone}</p>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const next = [...otpDigits];
                              next[idx] = e.target.value.replace(/\D/g, "");
                              setOtpDigits(next);
                            }}
                            className="w-10 h-12 text-center text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpDigits.join("").length !== 6}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>Verify & Continue</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Social / Alternative Divider */}
              {mode !== "FORGOT" && (
                <>
                  <div className="relative flex items-center justify-center pt-1">
                    <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                    <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute">
                      or
                    </span>
                  </div>

                  <div className="grid gap-2 pt-1">
                    {/* Google OAuth Button */}
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs transition shadow-sm flex items-center justify-center gap-2.5"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    {/* Mobile Phone OTP toggle */}
                    {mode !== "PHONE_OTP" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("PHONE_OTP");
                          setError(null);
                        }}
                        className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2"
                      >
                        <Phone className="w-3.5 h-3.5 text-brand-600" />
                        <span>Sign in with Mobile Number</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
