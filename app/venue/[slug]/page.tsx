"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Share2,
  Heart,
  Star,
  MapPin,
  Shield,
  Car,
  Bath,
  Coffee,
  DoorClosed,
  Camera,
  Sun,
  Droplet,
  Tv,
  Armchair,
  Wind,
  PartyPopper,
  Gamepad2,
  Waves,
  Zap,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { VENUES } from "@/lib/mock-data";
import { SlotPicker } from "@/components/booking/slot-picker";
import { FloatingBookingDock } from "@/components/booking/floating-booking-dock";
import { formatCurrency } from "@/lib/utils";

const amenityIconMap: Record<string, React.ElementType> = {
  Shield,
  Car,
  Bath,
  Coffee,
  DoorClosed,
  Camera,
  Sun,
  Droplet,
  Tv,
  Armchair,
  Wind,
  PartyPopper,
  Gamepad2,
  Waves,
  Zap,
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function VenueDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const venue = VENUES.find((v) => v.slug === resolvedParams.slug);

  if (!venue) {
    notFound();
  }

  const [activeTab, setActiveTab] = useState<"overview" | "amenities" | "rules" | "map">("overview");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="pb-24 pt-2 max-w-7xl mx-auto space-y-6">
      {/* TOP NAVIGATION / ACTION BAR */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Venues</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-colors ${
              isFavorite
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {isCopied && (
        <div className="p-2 rounded-xl bg-emerald-500 text-white text-xs font-bold text-center">
          Link copied to clipboard!
        </div>
      )}

      {/* DESKTOP 2-COLUMN / MOBILE SINGLE COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Media, Overview, Amenities, Rules, Map (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* PHOTO GALLERY */}
          <div className="space-y-2">
            {/* Main Featured Image */}
            <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-glass-md">
              <Image
                src={venue.images[activeImageIndex] || venue.images[0]}
                alt={venue.name}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold">
                Photo {activeImageIndex + 1} of {venue.images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {venue.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {venue.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx
                        ? "border-brand-600 ring-2 ring-brand-500/20 scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${venue.name} photo ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* VENUE HEADER INFO */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {venue.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {venue.tagline}
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 text-amber-700 dark:text-amber-400 font-bold text-sm shrink-0">
                <Star className="w-4 h-4 fill-current text-amber-500" />
                <span>{venue.rating}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({venue.reviewCount})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>{venue.location.address}</span>
              </div>
              <span>•</span>
              <span className="font-semibold text-brand-600">
                {venue.location.distanceKm} km away
              </span>
            </div>
          </div>

          {/* SEGMENTED TAB CONTROLS */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60">
            {(["overview", "amenities", "rules", "map"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  activeTab === tab
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENTS */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                    About this venue
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {venue.description}
                  </p>
                </div>

                {/* Popular Amenities Chips */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Top Amenities
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {venue.amenities.map((amenity) => {
                      const IconComponent = amenityIconMap[amenity.icon] || CheckCircle2;
                      return (
                        <div
                          key={amenity.id}
                          className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"
                        >
                          <IconComponent className="w-4 h-4 text-brand-600 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {amenity.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* AMENITIES TAB */}
            {activeTab === "amenities" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                  All Amenities & Facilities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {venue.amenities.map((amenity) => {
                    const IconComponent = amenityIconMap[amenity.icon] || CheckCircle2;
                    return (
                      <div
                        key={amenity.id}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                      >
                        <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {amenity.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RULES TAB */}
            {activeTab === "rules" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Venue Guidelines & Rules
                </h3>
                <ul className="space-y-2.5">
                  {venue.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* MAP TAB */}
            {activeTab === "map" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Location & Directions
                </h3>
                <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <div className="text-center p-6 space-y-2">
                    <MapPin className="w-8 h-8 text-brand-600 mx-auto animate-bounce" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {venue.location.address}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Coordinates: {venue.location.mapCoordinates?.lat}, {venue.location.mapCoordinates?.lng}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Slot Picker & Booking Dock (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Select Your Slot
                </h2>
                <p className="text-xs text-slate-400">
                  Instant real-time slot reservation
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Rate</span>
                <p className="text-base font-extrabold text-brand-600">
                  {formatCurrency(venue.startingPrice)}
                  <span className="text-xs text-slate-400 font-normal">/{venue.priceUnit}</span>
                </p>
              </div>
            </div>

            {/* Interactive SlotPicker */}
            <SlotPicker venue={venue} />
          </div>
        </div>
      </div>

      {/* FLOATING BOOKING DOCK (Persistent on Mobile & Desktop) */}
      <FloatingBookingDock venue={venue} />
    </div>
  );
}
