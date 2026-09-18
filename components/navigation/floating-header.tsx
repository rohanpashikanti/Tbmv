"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Sparkles, ChevronDown, Mic } from "lucide-react";
import { useBookingStore } from "@/stores/booking-store";
import { CITIES } from "@/lib/mock-data";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function FloatingHeader() {
  const { selectedCity, setSelectedCity, setSearchModalOpen } = useBookingStore();
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 transition-all">
      <div className="max-w-7xl mx-auto">
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex items-center justify-between gap-4 px-5 py-3 rounded-3xl glass-dock">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                TheBook<span className="text-brand-600 dark:text-brand-400">MyVenues</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Premium Venues & Slots
              </p>
            </div>
          </Link>

          {/* Search Trigger Bar (Center) */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex-1 max-w-lg flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-brand-400/60 hover:bg-white dark:hover:bg-slate-800 transition-all text-left shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
              <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                Search turfs, private theatres, banquets...
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
              <Sparkles className="w-3 h-3" />
              <span>AI Search</span>
            </div>
          </button>

          {/* Right Actions: City Selector + Links + Clerk Auth */}
          <div className="flex items-center gap-3">
            {/* City Selector */}
            <div className="relative">
              <button
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-200/60 transition-colors border border-slate-200/50 dark:border-slate-700/50"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {isCityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 py-2 rounded-2xl glass-dock shadow-xl z-50 border border-slate-200/80 dark:border-slate-700"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Select City
                    </div>
                    {CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors hover:bg-brand-50 dark:hover:bg-slate-800 ${
                          selectedCity === city
                            ? "text-brand-600 dark:text-brand-400 font-bold bg-brand-50/50 dark:bg-brand-950/40"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/vendor"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors px-2.5 py-1.5"
            >
              List Venue
            </Link>

            {/* Clerk Authentication Controls using <Show> */}
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 px-3 py-1.5">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-3.5 py-1.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <Link
                href="/bookings"
                className="text-xs font-semibold text-slate-600 hover:text-brand-600 px-2 py-1"
              >
                My Bookings
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-2xl ring-2 ring-brand-500/20",
                  },
                }}
              />
            </Show>
          </div>
        </div>

        {/* MOBILE HEADER */}
        <div className="flex md:hidden flex-col gap-2.5">
          {/* Top Bar: Location & Avatar / Auth */}
          <div className="flex items-center justify-between">
            <div>
              <div className="relative inline-block">
                <button
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>{selectedCity}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <AnimatePresence>
                  {isCityDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-44 py-2 rounded-2xl glass-dock shadow-xl z-50 border border-slate-200/80"
                    >
                      {CITIES.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedCity(city);
                            setIsCityDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-medium ${
                            selectedCity === city
                              ? "text-brand-600 font-bold bg-brand-50"
                              : "text-slate-600"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Welcome to TheBookMyVenues ✨
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSearchModalOpen(true)}
                className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 flex items-center justify-center text-brand-600 dark:text-brand-400"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="px-3 py-1 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-sm">
                    Sign In
                  </button>
                </SignInButton>
              </Show>

              <Show when="signed-in">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 rounded-full",
                    },
                  }}
                />
              </Show>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Where do you want to book today?
          </h2>

          {/* Mobile Search Button Bar */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 shadow-glass-sm"
          >
            <div className="flex items-center gap-2.5 text-slate-400 text-xs">
              <Search className="w-4 h-4 text-brand-600" />
              <span>Search venues, sports, events...</span>
            </div>
            <Mic className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
