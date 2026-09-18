"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ChevronLeft,
  ArrowRight,
  Clock,
  MapPin,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type BookingTab = "upcoming" | "completed" | "cancelled";

export default function BookingsHistoryPage() {
  const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");

  const mockBookings = [
    {
      id: "TBV-849201",
      venueName: "CGI Sports Arena",
      resourceName: "Box Turf #01",
      date: "18 Sep 2026",
      time: "07:00 PM – 08:00 PM",
      location: "Gachibowli, Hyderabad",
      amount: 1487,
      status: "CONFIRMED",
      tab: "upcoming" as const,
      slug: "cgi-sports-arena",
    },
    {
      id: "TBV-521940",
      venueName: "Skyline Private Theatre",
      resourceName: "Platinum Screen (4K Atmos)",
      date: "12 Sep 2026",
      time: "06:00 PM – 08:00 PM",
      location: "Banjara Hills, Hyderabad",
      amount: 3718,
      status: "COMPLETED",
      tab: "completed" as const,
      slug: "skyline-private-theatre",
    },
    {
      id: "TBV-193842",
      venueName: "Urban Play Zone",
      resourceName: "PS5 VIP Lounge #01",
      date: "05 Sep 2026",
      time: "04:00 PM – 05:00 PM",
      location: "Hitech City, Hyderabad",
      amount: 372,
      status: "CANCELLED",
      tab: "cancelled" as const,
      slug: "urban-play-zone",
    },
  ];

  const filteredBookings = mockBookings.filter((b) => b.tab === activeTab);

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Booking History
        </h1>
        <div className="w-16" />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60">
        {(["upcoming", "completed", "cancelled"] as const).map((tab) => (
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

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    {b.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {b.venueName}
                  </h3>
                  <p className="text-xs text-brand-600 font-semibold">{b.resourceName}</p>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                    b.status === "CONFIRMED"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : b.status === "COMPLETED"
                      ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                  }`}
                >
                  {b.status === "CONFIRMED" && <CheckCircle2 className="w-3 h-3" />}
                  {b.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                  {b.status === "CANCELLED" && <XCircle className="w-3 h-3" />}
                  <span>{b.status}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>
                    {b.date} · {b.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>{b.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Paid: {formatCurrency(b.amount)}
                </span>

                <div className="flex items-center gap-3">
                  {b.status === "COMPLETED" && (
                    <Link
                      href={`/venue/${b.slug}`}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Book Again</span>
                    </Link>
                  )}

                  <Link
                    href={`/booking/${b.id}`}
                    className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 flex items-center gap-1"
                  >
                    <span>View Pass</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-200 text-xs text-slate-400">
            No {activeTab} bookings found.
          </div>
        )}
      </div>
    </div>
  );
}
