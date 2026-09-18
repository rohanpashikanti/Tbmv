import React from "react";

export function VenueCardSkeleton() {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-glass-sm overflow-hidden animate-pulse">
      <div className="aspect-[16/10] w-full bg-slate-200 dark:bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-12" />
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}

export function SlotPickerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Date row skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[70px] h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Slots grid skeleton */}
      <div className="space-y-4">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function VenueDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-4">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[16/10] w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
        <div className="lg:col-span-5">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
