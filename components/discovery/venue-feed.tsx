"use client";

import React from "react";
import { motion } from "framer-motion";
import { VenueCard } from "./venue-card";
import { useBookingStore } from "@/stores/booking-store";
import { VENUES } from "@/lib/mock-data";
import { Sparkles, ArrowRight } from "lucide-react";

export function VenueFeed() {
  const { selectedCategory, selectedCity, searchQuery } = useBookingStore();

  const filteredVenues = VENUES.filter((venue) => {
    // City filter
    const matchesCity = selectedCity === "Hyderabad" ? true : venue.location.city.toLowerCase() === selectedCity.toLowerCase();

    // Category filter
    const matchesCategory =
      selectedCategory === "all" || venue.category === selectedCategory;

    // Search query filter
    const matchesQuery =
      !searchQuery ||
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.location.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesCategory && matchesQuery;
  });

  return (
    <section className="w-full py-4 space-y-6">
      {/* Section Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Popular Venues in {selectedCity}
            </h2>
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 text-[11px] font-bold text-brand-600 dark:text-brand-400">
              <Sparkles className="w-3 h-3" />
              <span>Real-time Slots</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Handpicked sports arenas, private theatres & celebration spaces
          </p>
        </div>

        <button className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 group">
          <span>See All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid List */}
      {filteredVenues.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          {filteredVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </motion.div>
      ) : (
        <div className="py-16 text-center rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            No venues found matching your criteria.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try choosing a different category or clearing your search filters.
          </p>
        </div>
      )}
    </section>
  );
}
