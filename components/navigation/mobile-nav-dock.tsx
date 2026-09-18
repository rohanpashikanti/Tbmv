"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Compass, CalendarCheck, Heart, User } from "lucide-react";

export function MobileNavDock() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/#explore", icon: Compass },
    { name: "Bookings", href: "/bookings", icon: CalendarCheck },
    { name: "Favorites", href: "/favorites", icon: Heart },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe pointer-events-none mb-2">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="flex items-center justify-around py-2 px-2 rounded-3xl glass-dock shadow-glass-lg border border-white/80 dark:border-slate-800">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-colors select-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActivePill"
                    className="absolute inset-0 bg-brand-500/10 dark:bg-brand-400/15 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive
                      ? "text-brand-600 dark:text-brand-400 scale-110"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors ${
                    isActive
                      ? "text-brand-600 dark:text-brand-400 font-bold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
