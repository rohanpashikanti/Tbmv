import React from "react";
import { CategoryBar } from "@/components/discovery/category-bar";
import { VenueFeed } from "@/components/discovery/venue-feed";
import { Sparkles, Zap, Shield, Smartphone } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* DESKTOP HERO BANNER (Shown on md+ screens per mockup screen 7) */}
      <section className="hidden md:block relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-slate-950/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Confirmation · Zero Booking Friction</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Play. Celebrate. Create Memories.
          </h1>

          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Discover and reserve box cricket pitches, 4K Dolby Atmos private mini-theatres, celebration lawns, and gaming lounges in seconds.
          </p>
        </div>

        {/* Spatial background orbs inside banner */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-40">
          <div className="absolute top-1/2 -translate-y-1/2 right-12 w-64 h-64 rounded-full bg-brand-500/40 blur-3xl" />
          <div className="absolute -bottom-10 right-32 w-48 h-48 rounded-full bg-indigo-500/30 blur-2xl" />
        </div>
      </section>

      {/* CATEGORY BAR */}
      <section className="w-full">
        <CategoryBar />
      </section>

      {/* VENUE FEED */}
      <VenueFeed />

      {/* VALUE PROPOSITION BADGES (Desktop & Mobile) */}
      <section className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Fast Booking</h4>
            <p className="text-[11px] text-slate-400">Lock slots in seconds</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Mobile First</h4>
            <p className="text-[11px] text-slate-400">Fluid tactile experience</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Live Availability</h4>
            <p className="text-[11px] text-slate-400">Real-time slot updates</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">100% Verified</h4>
            <p className="text-[11px] text-slate-400">Audited amenities</p>
          </div>
        </div>
      </section>
    </div>
  );
}
