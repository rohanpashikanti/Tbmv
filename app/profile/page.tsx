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
} from "lucide-react";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { firestoreService } from "@/lib/firebase/firestore-service";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading, signOut, refreshProfile } = useFirebaseAuth();
  const [isPending, startTransition] = useTransition();

  // General Profile Edit State
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [email, setEmail] = useState("");
  const [generalMsg, setGeneralMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?next=/profile");
      } else if (userProfile) {
        setName(userProfile.name || "");
        setAge(userProfile.age ? String(userProfile.age) : "");
        setEmail(userProfile.email || "");
      }
    }
  }, [user, userProfile, loading, router]);

  // Handle General Profile Update
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setGeneralMsg(null);
    startTransition(async () => {
      try {
        await firestoreService.updateUser(user.uid, {
          name,
          age: age ? parseInt(age, 10) : null,
          email: email || undefined,
        });
        await refreshProfile();
        setGeneralMsg({ type: "success", text: "Profile details updated in Cloud Firestore." });
      } catch (err: any) {
        setGeneralMsg({ type: "error", text: err.message || "Failed to update profile." });
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

  if (!user) {
    return null;
  }

  const maskedPhone = user.phoneNumber
    ? user.phoneNumber.replace(/(\+91\d{2})\d{4}(\d{4})/, "$1 **** $2")
    : "Mobile Authenticated";

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
              <h2 className="text-xl font-bold">{userProfile?.name || "Verified Member"}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-brand-500/20 text-brand-300 border border-brand-400/30">
                {userProfile?.role || "CUSTOMER"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {maskedPhone}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Firebase Phone Authenticated
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Firestore Synced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. DIRECT EDITABLE FIELDS: NAME, AGE & EMAIL */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Personal Information
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Synced to Firestore</span>
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Details</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. VERIFIED IDENTITY FIELD: MOBILE NUMBER */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Verified Mobile Identity
            </h3>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Lock className="w-3 h-3" /> Firebase Phone Auth
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Primary Identity Phone
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {user.phoneNumber || "No mobile number linked"}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Session
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tied directly to your Firebase Authentication & Firestore booking reservations.
            </p>
          </div>
        </div>
      </div>

      {/* 3. BOOKINGS & ACTIVITY QUICK LINKS */}
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
            <span className="text-slate-800 dark:text-slate-200">Firebase UID: {user.uid.slice(0, 13)}...</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{userProfile?.status || "ACTIVE"}</span>
        </div>
      </div>
    </div>
  );
}
