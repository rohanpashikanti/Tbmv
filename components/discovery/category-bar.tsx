"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Shield,
  Tv,
  PartyPopper,
  Palmtree,
  Gamepad2,
  Waves,
  Activity,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { useBookingStore } from "@/stores/booking-store";
import { CATEGORIES } from "@/lib/mock-data";
import { VenueCategory } from "@/types/venue";

const iconMap: Record<string, React.ElementType> = {
  Flame,
  Shield,
  Tv,
  PartyPopper,
  Palmtree,
  Gamepad2,
  Waves,
  Activity,
  Sparkles,
};

export function CategoryBar() {
  const { selectedCategory, setSelectedCategory } = useBookingStore();

  const allCategoryItem = {
    id: "all" as VenueCategory,
    name: "All Venues",
    iconName: "LayoutGrid",
    colorClass: "text-brand-600",
    bgClass: "bg-brand-500/10 border-brand-500/20",
  };

  const categories = [allCategoryItem, ...CATEGORIES];

  return (
    <div className="w-full py-2">
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 -mx-1 select-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = cat.id === "all" ? LayoutGrid : iconMap[cat.iconName] || Sparkles;

          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-semibold transition-all border shrink-0 ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md shadow-slate-900/10"
                  : "bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-white/20 text-white dark:text-slate-900 dark:bg-slate-900/10"
                    : `${cat.bgClass} ${cat.colorClass}`
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </div>
              <span>{cat.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
