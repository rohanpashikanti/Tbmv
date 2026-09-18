"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ShieldCheck,
  Smartphone,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Edit3,
  Calendar,
  LogOut,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import {
  getUserProfile,
  updateGeneralProfile,
  requestPhoneChange,
  verifyPhoneChange,
  requestEmailChange,
  ProfileData,
} from "@/lib/actions/profile.actions";
import { signOut } from "@/lib/actions/auth.actions";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // General Profile Edit State
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [generalMsg, setGeneralMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Phone Change Modal / State
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"INPUT" | "OTP">("INPUT");
  const [phoneMsg, setPhoneMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email Change State
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getUserProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setName(res.data.name || "");
        setAge(res.data.age ? String(res.data.age) : "");
      } else {
        router.push("/login?returnTo=/profile");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  // Handle General Profile Update (Name & Age)
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralMsg(null);
    startTransition(async () => {
      const res = await updateGeneralProfile({
        name,
        age: age ? parseInt(age, 10) : null,
      });
      if (res.success) {
        setGeneralMsg({ type: "success", text: "Personal details updated successfully." });
        if (profile) {
          setProfile({
            ...profile,
            name: res.data?.name || name,
            age: res.data?.age ?? null,
          });
        }
      } else {
        setGeneralMsg({ type: "error", text: res.error || "Failed to update profile." });
      }
    });
  };

  // Handle Phone Change Request (Send OTP to new number)
  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneMsg(null);
    startTransition(async () => {
      const res = await requestPhoneChange(newPhone);
      if (res.success) {
        setPhoneStep("OTP");
        setPhoneMsg({
          type: "success",
          text: res.message || "OTP sent to new mobile number.",
        });
      } else {
        setPhoneMsg({ type: "error", text: res.error || "Failed to send OTP." });
      }
    });
  };

  // Handle Phone Change OTP Verification
  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneMsg(null);
    startTransition(async () => {
      const res = await verifyPhoneChange(newPhone, phoneOtp);
      if (res.success && res.data) {
        setPhoneMsg({ type: "success", text: res.message || "Mobile number updated!" });
        if (profile) {
          setProfile({
            ...profile,
            phone: res.data.phone,
            maskedPhone: res.data.maskedPhone,
            isPhoneVerified: true,
          });
        }
        setTimeout(() => {
          setIsChangingPhone(false);
          setPhoneStep("INPUT");
          setNewPhone("");
          setPhoneOtp("");
          setPhoneMsg(null);
        }, 1800);
      } else {
        setPhoneMsg({ type: "error", text: res.error || "Invalid OTP code." });
      }
    });
  };

  // Handle Email Change Request
  const handleRequestEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    startTransition(async () => {
      const res = await requestEmailChange(newEmail);
      if (res.success) {
        setEmailMsg({
          type: "success",
          text: res.message || "Verification email sent.",
        });
        setTimeout(() => {
          setIsChangingEmail(false);
          setNewEmail("");
        }, 3000);
      } else {
        setEmailMsg({ type: "error", text: res.error || "Failed to request email change." });
      }
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-6 px-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Account Profile</h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Badge Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 p-[2px] shadow-lg flex-shrink-0">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <UserIcon className="w-9 h-9 text-brand-400" />
            </div>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold">{profile?.name || "Verified Member"}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-brand-500/20 text-brand-300 border border-brand-400/30">
                {profile?.role || "CUSTOMER"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {profile?.maskedPhone || profile?.email}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Supabase Authenticated
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Identity
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. DIRECT EDITABLE FIELDS: NAME & AGE */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Personal Information
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Directly Editable</span>
        </div>

        {generalMsg && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 font-medium ${
              generalMsg.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
            }`}
          >
            {generalMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{generalMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Age (Optional)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 25"
                min="10"
                max="120"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Personal Details</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. VERIFIED IDENTITY FIELD: MOBILE NUMBER (OTP PROTECTED) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Verified Mobile Identity
            </h3>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Lock className="w-3 h-3" /> OTP Protected
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Primary Identity Phone
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {profile?.maskedPhone || "No mobile number linked"}
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Tied directly to your Supabase Phone Auth session & booking reservations.
            </p>
          </div>

          {!isChangingPhone && (
            <button
              onClick={() => {
                setIsChangingPhone(true);
                setPhoneStep("INPUT");
                setPhoneMsg(null);
              }}
              className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-600" />
              <span>Change Number</span>
            </button>
          )}
        </div>

        {/* Change Phone OTP Flow */}
        {isChangingPhone && (
          <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-brand-950 dark:text-brand-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-600" />
                <span>Verify New Mobile Number via Twilio OTP</span>
              </h4>
              <button
                onClick={() => {
                  setIsChangingPhone(false);
                  setPhoneStep("INPUT");
                  setNewPhone("");
                  setPhoneOtp("");
                  setPhoneMsg(null);
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            {phoneMsg && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 font-medium ${
                  phoneMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                    : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                }`}
              >
                {phoneMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{phoneMsg.text}</span>
              </div>
            )}

            {phoneStep === "INPUT" ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    New 10-Digit Indian Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      maxLength={10}
                      required
                      className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPending || newPhone.length !== 10}
                  className="w-full py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  <span>Send Verification Code</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Enter 6-Digit OTP sent to +91 {newPhone}
                  </label>
                  <input
                    type="text"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full px-4 py-2.5 text-center tracking-[0.3em] font-mono text-base font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneStep("INPUT")}
                    className="w-1/3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || phoneOtp.length !== 6}
                    className="w-2/3 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Verify & Link Number</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 3. VERIFIED IDENTITY FIELD: EMAIL (VERIFICATION PROTECTED) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Email Address
            </h3>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            <Lock className="w-3 h-3" /> Email Verification Required
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Registered Email
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {profile?.email || "No email linked"}
              </span>
              {profile?.isEmailVerified && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Used for booking receipts, tax invoices, and account security notices.
            </p>
          </div>

          {!isChangingEmail && (
            <button
              onClick={() => {
                setIsChangingEmail(true);
                setEmailMsg(null);
              }}
              className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Change Email</span>
            </button>
          )}
        </div>

        {/* Change Email Flow */}
        {isChangingEmail && (
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Verify New Email Address</span>
              </h4>
              <button
                onClick={() => {
                  setIsChangingEmail(false);
                  setNewEmail("");
                  setEmailMsg(null);
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            {emailMsg && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 font-medium ${
                  emailMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                    : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                }`}
              >
                {emailMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{emailMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleRequestEmailChange} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !newEmail.includes("@")}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Send Verification Link</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 4. BOOKINGS & ACTIVITY QUICK LINKS */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs font-semibold">
        <Link
          href="/bookings"
          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span className="text-slate-800 dark:text-slate-200">My Venue Reservations & Passes</span>
          </div>
          <ChevronLeft className="w-4 h-4 rotate-180 text-slate-400" />
        </Link>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-800 dark:text-slate-200">Account ID: {profile?.id.slice(0, 13)}...</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{profile?.status}</span>
        </div>
      </div>
    </div>
  );
}
