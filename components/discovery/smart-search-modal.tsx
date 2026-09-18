"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Search, Sparkles, Mic, ArrowRight, Compass, Calendar, Flame } from "lucide-react";
import { useBookingStore } from "@/stores/booking-store";
import { TypedSearchQuery, VenueCategory } from "@/types/venue";

export function SmartSearchModal() {
  const shouldReduceMotion = useReducedMotion();
  const { isSearchModalOpen, setSearchModalOpen, setSearchQuery, setSelectedCategory } = useBookingStore();
  const [inputValue, setInputValue] = useState("");

  const suggestedPrompts = [
    {
      title: "Find a private theatre tonight",
      query: { category: "private-theatre" as VenueCategory, time: "evening", rawQuery: "private theatre tonight" },
    },
    {
      title: "Book cricket turf tomorrow",
      query: { category: "cricket" as VenueCategory, date: "tomorrow", rawQuery: "cricket turf tomorrow" },
    },
    {
      title: "Gaming near me",
      query: { category: "gaming" as VenueCategory, location: "nearby", rawQuery: "gaming near me" },
    },
    {
      title: "Party hall for 30 people",
      query: { category: "party-hall" as VenueCategory, partySize: 30, rawQuery: "party hall for 30 people" },
    },
  ];

  const handleSelectPrompt = (prompt: typeof suggestedPrompts[0]) => {
    setInputValue(prompt.title);
    setSearchQuery(prompt.query.rawQuery || prompt.title);
    if (prompt.query.category) {
      setSelectedCategory(prompt.query.category);
    }
    setSearchModalOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchQuery(inputValue.trim());
      setSearchModalOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-slate-700 shadow-2xl p-6 overflow-hidden z-10"
          >
            {/* Ambient Glowing Orb */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-tr from-brand-500/30 via-purple-500/25 to-pink-500/20 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-400/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Smart Conversational Search
                </span>
              </div>
              <button
                onClick={() => setSearchModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center my-4 space-y-1">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 p-[2px] shadow-lg shadow-brand-500/30 animate-pulse-subtle">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Just tell me what you need
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search with natural language for sports, private screens, or events
              </p>
            </div>

            {/* Suggested Prompts List */}
            <div className="space-y-2 my-4">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPrompt(prompt)}
                  className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/70 dark:hover:bg-brand-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-colors" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-brand-900 dark:group-hover:text-brand-200">
                      {prompt.title}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            {/* Natural language input */}
            <form onSubmit={handleSearchSubmit} className="relative mt-5">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g. 5v5 turf in Gachibowli tonight under ₹1500..."
                className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 shadow-inner"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
