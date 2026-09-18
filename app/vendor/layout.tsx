import React from "react";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { Building2, ShieldAlert, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/vendor");
  }

  // Admin has override access to vendor hub
  if (user.role === "ADMIN" || user.role === "VENDOR") {
    return <>{children}</>;
  }

  // Customer attempting to view vendor hub
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Partner Account Required
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            You are currently signed in as a <span className="font-bold text-slate-700 dark:text-slate-200">Customer</span> ({user.email}). To manage venues and availability, submit a partner onboarding application.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-left flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold space-y-0.5">
            <p className="font-bold">Partner Verification in Progress</p>
            <p className="text-amber-700 dark:text-amber-400 font-normal">
              Admin review and KYC approval is required before venue management tools are unlocked.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Discover Venues</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
