"use client";

import React from "react";
import Link from "next/link";
import { Heart, ChevronLeft } from "lucide-react";
import { VENUES } from "@/lib/mock-data";
import { VenueCard } from "@/components/discovery/venue-card";

export default function FavoritesPage() {
  const favoriteVenues = VENUES.slice(0, 2);

  return (
    <div className="py-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-current" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Saved Venues</h1>
        </div>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteVenues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </div>
  );
}
