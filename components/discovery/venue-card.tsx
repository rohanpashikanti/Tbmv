"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, MapPin, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Venue } from "@/types/venue";
import { formatCurrency } from "@/lib/utils";

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % venue.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + venue.images.length) % venue.images.length);
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-glass-sm hover:shadow-glass-md overflow-hidden transition-all"
    >
      <Link href={`/venue/${venue.slug}`} className="flex flex-col h-full">
        {/* IMAGE CAROUSEL CONTAINER */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-t-3xl">
          <Image
            src={venue.images[currentImageIndex] || venue.images[0]}
            alt={venue.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Top Badges & Favorite */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
            {/* Availability / Trending Badge */}
            <div className="pointer-events-auto">
              {venue.isAvailableToday ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Available Today</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold">
                  <span>Fast Filling</span>
                </div>
              )}
            </div>

            {/* Favorite Button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={toggleFav}
              className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-sm ${
                isFavorite
                  ? "bg-rose-500 text-white"
                  : "bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-white"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </motion.button>
          </div>

          {/* Image Navigation Arrows (Desktop hover) */}
          {venue.images.length > 1 && (
            <div className="hidden group-hover:flex items-center justify-between absolute inset-y-0 inset-x-2 z-10 pointer-events-none">
              <button
                onClick={prevImage}
                className="pointer-events-auto w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-md hover:scale-110 transition-transform"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="pointer-events-auto w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-md hover:scale-110 transition-transform"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Carousel Dots */}
          {venue.images.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none">
              {venue.images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex
                      ? "w-4 bg-white shadow-sm"
                      : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* VENUE DETAILS CONTENT */}
        <div className="p-4 flex flex-col justify-between flex-1 gap-3">
          <div>
            {/* Title & Rating Header */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                {venue.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>{venue.rating}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({venue.reviewCount})
                </span>
              </div>
            </div>

            {/* Location & Distance */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{venue.location.neighborhood}, {venue.location.city}</span>
              <span>•</span>
              <span className="shrink-0">{venue.location.distanceKm} km</span>
            </div>
          </div>

          {/* Pricing & CTA Dock inside Card */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {formatCurrency(venue.startingPrice)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  /{venue.priceUnit}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Book Slot &rarr;
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
