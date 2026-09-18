"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Layers,
  CalendarDays,
  CalendarCheck,
  Ban,
  Tag,
  Wallet,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  Plus,
  AlertCircle,
  UserCheck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Radio,
  QrCode
} from "lucide-react";
import { VENUES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { useAvailabilitySSE } from "@/lib/hooks/use-availability-sse";
import { SlotState, SlotStateType } from "@/types/booking-state";

type VendorTab = "dashboard" | "venues" | "resources" | "calendar" | "bookings" | "block_slots" | "pricing" | "revenue";

export default function VendorOperationsPage() {
  const [activeTab, setActiveTab] = useState<VendorTab>("dashboard");
  const [selectedVenueId, setSelectedVenueId] = useState<string>("venue-1");
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-18");

  // Operational State
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [manualBookings, setManualBookings] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [checkInInput, setCheckInInput] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Modal forms
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Form states
  const [blockForm, setBlockForm] = useState({
    resourceId: "res-turf-1",
    date: "2026-09-18",
    startTime: "11:00",
    endTime: "13:00",
    reason: "MAINTENANCE" as const,
    note: "Turf grass repair and net fixing",
  });

  const [manualForm, setManualForm] = useState({
    resourceId: "res-turf-1",
    date: "2026-09-18",
    startTime: "16:00",
    endTime: "17:00",
    customerName: "Venkatesh Rao",
    customerPhone: "+91 98490 11223",
    customerEmail: "venkat@phonebook.in",
    amount: 1200,
    paymentMode: "CASH" as const,
  });

  const [pricingForm, setPricingForm] = useState({
    resourceId: "res-turf-1",
    ruleType: "PEAK_OFFPEAK" as const,
    name: "Night Floodlight Prime Surge",
    amount: 1600,
    startTime: "18:00",
    endTime: "23:00",
    effectiveFrom: "2026-09-01",
    effectiveTo: "2026-12-31",
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeVenue = useMemo(() => VENUES.find((v) => v.id === selectedVenueId) || VENUES[0], [selectedVenueId]);

  // Real-time SSE Connection
  const { isConnected } = useAvailabilitySSE({
    venueId: selectedVenueId,
    date: selectedDate,
    onEvent: (evt) => {
      if (evt.type === "slot.blocked") {
        setNotification({ type: "success", text: `Realtime Sync: Slot ${evt.startTime}-${evt.endTime} was BLOCKED.` });
      } else if (evt.type === "slot.booked") {
        setNotification({ type: "success", text: `Realtime Sync: New booking confirmed for ${evt.startTime}-${evt.endTime}!` });
      }
    },
  });

  // Action Handlers
  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/vendor/block-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: selectedVenueId, ...blockForm }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockedSlots((prev) => [...prev, { ...blockForm, id: data.blockId }]);
        setShowBlockModal(false);
        setNotification({ type: "success", text: data.message });
      } else {
        setNotification({ type: "error", text: data.message });
      }
    } catch {
      setNotification({ type: "error", text: "Network error creating slot block." });
    }
  };

  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/vendor/manual-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: selectedVenueId, ...manualForm }),
      });
      const data = await res.json();
      if (data.success) {
        setManualBookings((prev) => [...prev, { ...manualForm, id: data.bookingId, status: "CONFIRMED" }]);
        setShowManualBookingModal(false);
        setNotification({ type: "success", text: data.message });
      } else {
        setNotification({ type: "error", text: data.message });
      }
    } catch {
      setNotification({ type: "error", text: "Network error submitting manual booking." });
    }
  };

  const handleCreatePricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/vendor/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: selectedVenueId, ...pricingForm }),
      });
      const data = await res.json();
      if (data.success) {
        setPricingRules((prev) => [...prev, { ...pricingForm, id: data.ruleId }]);
        setShowPricingModal(false);
        setNotification({ type: "success", text: "Dynamic pricing rule saved and published." });
      } else {
        setNotification({ type: "error", text: data.message });
      }
    } catch {
      setNotification({ type: "error", text: "Network error saving pricing rule." });
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInInput) return;
    try {
      const res = await fetch("/api/vendor/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingReference: checkInInput }),
      });
      const data = await res.json();
      setCheckInStatus({ success: data.success, message: data.message });
      if (data.success) {
        setCheckInInput("");
      }
    } catch {
      setCheckInStatus({ success: false, message: "Network error checking in pass." });
    }
  };

  // Mock Operational Bookings
  const todayBookings = [
    { id: "TBV-849201", customer: "Rohan Sharma", phone: "+91 98765 43210", resource: "Box Turf #01", time: "18:00 - 19:00", amount: 1200, status: "CONFIRMED", checkInState: "PENDING" },
    { id: "TBV-849202", customer: "Priya Verma", phone: "+91 98765 43211", resource: "Box Turf #02", time: "19:00 - 20:00", amount: 1200, status: "CONFIRMED", checkInState: "CHECKED_IN" },
    { id: "TBV-849203", customer: "Arjun Reddy", phone: "+91 98765 43212", resource: "Box Turf #01", time: "20:00 - 21:00", amount: 1500, status: "CONFIRMED", checkInState: "PENDING" },
    { id: "TBV-849204", customer: "Sneha Patel", phone: "+91 98765 43213", resource: "Box Turf #01", time: "09:00 - 10:00", amount: 1200, status: "COMPLETED", checkInState: "CHECKED_IN" },
    { id: "TBV-849205", customer: "Vikram Mehta", phone: "+91 98765 43214", resource: "Box Turf #02", time: "14:00 - 15:00", amount: 1200, status: "CANCELLED", checkInState: "CANCELLED" },
    ...manualBookings.map((mb) => ({
      id: mb.id,
      customer: mb.customerName,
      phone: mb.customerPhone,
      resource: activeVenue.resources.find((r) => r.id === mb.resourceId)?.name || "Turf #01",
      time: `${mb.startTime} - ${mb.endTime}`,
      amount: mb.amount,
      status: mb.status,
      checkInState: "PENDING",
    })),
  ];

  const hourlySlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

  return (
    <div className="py-6 max-w-7xl mx-auto space-y-6 px-4">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold text-[10px] tracking-wider uppercase">
              Vendor Operations Portal
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {isConnected ? "Live Inventory Sync Active" : "Connecting..."}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            {activeVenue.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm"
          >
            {VENUES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.location.city})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60 text-xs font-bold hover:bg-rose-100 transition-all shadow-sm"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Block Slot</span>
          </button>

          <button
            onClick={() => setShowManualBookingModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Booking</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{notification.text}</span>
            </div>
            <button onClick={() => setNotification(null)} className="font-bold px-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        {[
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: "calendar", label: "Live Calendar", icon: <CalendarDays className="w-4 h-4" /> },
          { id: "bookings", label: "Bookings & Check-In", icon: <CalendarCheck className="w-4 h-4" /> },
          { id: "venues", label: "Venue Profile", icon: <Building2 className="w-4 h-4" /> },
          { id: "resources", label: "Resources & Courts", icon: <Layers className="w-4 h-4" /> },
          { id: "block_slots", label: "Slot Blocks", icon: <Ban className="w-4 h-4" /> },
          { id: "pricing", label: "Dynamic Pricing", icon: <Tag className="w-4 h-4" /> },
          { id: "revenue", label: "Revenue & Ledger", icon: <Wallet className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as VendorTab)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Today&apos;s Confirmed</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{todayBookings.filter(b => b.status === "CONFIRMED").length}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>+15% vs last Friday</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Today&apos;s Gross GMV</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(todayBookings.filter(b => b.status === "CONFIRMED").reduce((acc, curr) => acc + curr.amount, 0))}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Net Payout: ₹{Math.round(todayBookings.reduce((acc, curr) => acc + curr.amount, 0) * 0.95)}</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Slot Occupancy Rate</span>
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400">78.5%</div>
              <div className="text-[11px] text-emerald-600 font-bold">High Demand Peak Window</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Active Live Holds</span>
              <div className="text-2xl font-black text-amber-500">2</div>
              <div className="text-[11px] text-slate-400">Expiring in &lt;10 mins</div>
            </div>
          </div>

          {/* QUICK CHECK-IN & RECENT FEED */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Check-In Scanner Form */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Customer Pass Scanner</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter booking reference (e.g. TBV-849201) or scan customer digital pass.
              </p>

              <form onSubmit={handleCheckIn} className="space-y-3">
                <input
                  type="text"
                  placeholder="Booking Reference # (e.g. TBV-849201)"
                  value={checkInInput}
                  onChange={(e) => setCheckInInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm"
                >
                  Verify & Check-In Customer
                </button>
              </form>

              {checkInStatus && (
                <div className={`p-3 rounded-2xl text-xs font-bold border ${checkInStatus.success ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                  {checkInStatus.message}
                </div>
              )}
            </div>

            {/* Live Today's Schedule */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Today&apos;s Active Schedule</h3>
                <span className="text-xs text-slate-400 font-semibold">{todayBookings.length} total entries</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {todayBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{b.customer}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                          {b.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{b.resource} · {b.time} · {b.phone}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(b.amount)}</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          b.checkInState === "CHECKED_IN"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                            : b.status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {b.checkInState === "CHECKED_IN" ? "Checked-In" : b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LIVE OPERATIONAL CALENDAR */}
      {activeTab === "calendar" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Resource Matrix</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Realtime vertical hourly timeline across all active resources.</p>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4 text-left w-24">Time</th>
                  {activeVenue.resources.map((res) => (
                    <th key={res.id} className="py-3 px-4 text-left">
                      {res.name} ({formatCurrency(res.basePricePerHour)}/hr)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {hourlySlots.map((hour) => (
                  <tr key={hour} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500">{hour}</td>
                    {activeVenue.resources.map((res) => {
                      const isBlocked = blockedSlots.some((b) => b.resourceId === res.id && b.startTime === hour);
                      const isBooked = hour === "09:00" || hour === "19:00";
                      const isHeld = hour === "15:00";

                      return (
                        <td key={res.id} className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold ${
                              isBlocked
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60"
                                : isBooked
                                ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60"
                                : isHeld
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200/60 animate-pulse"
                                : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200/60"
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <Ban className="w-3 h-3" />
                                <span>Blocked</span>
                              </>
                            ) : isBooked ? (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Booked</span>
                              </>
                            ) : isHeld ? (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>Held (10m)</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Available</span>
                              </>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BOOKINGS & CHECK-IN TAB */}
      {activeTab === "bookings" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Confirmed Booking Roster</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">All customer and offline reservations with check-in verification.</p>
            </div>
            <button
              onClick={() => setShowManualBookingModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Offline Walk-In</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4 text-left">Pass #</th>
                  <th className="py-3 px-4 text-left">Customer</th>
                  <th className="py-3 px-4 text-left">Phone</th>
                  <th className="py-3 px-4 text-left">Resource & Time</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {todayBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{b.id}</td>
                    <td className="py-3 px-4 font-bold">{b.customer}</td>
                    <td className="py-3 px-4 text-slate-500">{b.phone}</td>
                    <td className="py-3 px-4">{b.resource} ({b.time})</td>
                    <td className="py-3 px-4 font-extrabold">{formatCurrency(b.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.checkInState === "CHECKED_IN" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {b.checkInState === "CHECKED_IN" ? "Checked-In" : b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.checkInState !== "CHECKED_IN" && b.status === "CONFIRMED" ? (
                        <button
                          onClick={() => {
                            setCheckInInput(b.id);
                            handleCheckIn({ preventDefault: () => {} } as any);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-brand-600 text-white font-bold text-[11px] hover:bg-brand-700"
                        >
                          Check-In
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VENUES & PROFILE TAB */}
      {activeTab === "venues" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Venue Profile & Operating Hours</h2>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              Status: Published
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Venue Name</label>
              <input type="text" readOnly value={activeVenue.name} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">City & Location</label>
              <input type="text" readOnly value={`${activeVenue.location.city} - ${activeVenue.location.address}`} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Timezone</label>
              <input type="text" readOnly value="Asia/Kolkata (IST +05:30)" className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Cancellation Policy</label>
              <input type="text" readOnly value="Free cancellation up to 4 hours before slot time" className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            </div>
          </div>
        </div>
      )}

      {/* 5. RESOURCES TAB */}
      {activeTab === "resources" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Active Resources & Courts</h2>
            <span className="text-xs text-slate-400 font-semibold">{activeVenue.resources.length} active resources</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeVenue.resources.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{r.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span>
                </div>
                <p className="text-slate-500">Category: {r.category} · Capacity: {r.capacity || 10} players</p>
                <div className="pt-2 flex items-center justify-between font-bold">
                  <span className="text-slate-500">Baseline Rate:</span>
                  <span className="text-brand-600 dark:text-brand-400 text-sm font-black">{formatCurrency(r.basePricePerHour)}/hr</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. BLOCK SLOTS TAB */}
      {activeTab === "block_slots" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Slot Blackout & Maintenance Records</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Durable blocks enforced at database level with realtime customer sync.</p>
            </div>
            <button
              onClick={() => setShowBlockModal(true)}
              className="px-3.5 py-2 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-sm hover:bg-rose-700"
            >
              + Create Block
            </button>
          </div>

          {blockedSlots.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No active maintenance blackout blocks configured for this venue.
            </div>
          ) : (
            <div className="space-y-3">
              {blockedSlots.map((b, i) => (
                <div key={i} className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-rose-900 dark:text-rose-200">{b.date} · {b.startTime} - {b.endTime}</span>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">{b.reason}: {b.note}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">BLOCKED</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. DYNAMIC PRICING TAB */}
      {activeTab === "pricing" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Deterministic Dynamic Pricing Matrix</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Precedence: Special Date (50) &gt; Seasonal (40) &gt; Weekend (30) &gt; Peak/Off-Peak (20) &gt; Base (10)</p>
            </div>
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-3.5 py-2 rounded-2xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700"
            >
              + Add Pricing Rule
            </button>
          </div>

          <div className="space-y-3">
            {[
              { type: "BASE_RATE", name: "Standard Weekday Hourly Rate", priority: 10, amount: 1200, validity: "All Days (Default)" },
              { type: "PEAK_OFFPEAK", name: "Evening Floodlight Prime Hours", priority: 20, amount: 1500, validity: "18:00 - 23:00 Daily" },
              { type: "WEEKEND", name: "Weekend Tournament Prime", priority: 30, amount: 1600, validity: "Saturday & Sunday" },
              ...pricingRules.map((pr) => ({
                type: pr.ruleType,
                name: pr.name,
                priority: pr.priority || 25,
                amount: pr.amount,
                validity: `${pr.startTime || "00:00"} - ${pr.endTime || "23:59"} (${pr.effectiveFrom} to ${pr.effectiveTo})`,
              })),
            ].map((rule, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{rule.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-mono text-[10px] font-bold">
                      Priority {rule.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{rule.validity}</p>
                </div>
                <span className="text-base font-black text-brand-600 dark:text-brand-400">{formatCurrency(rule.amount)}/hr</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. REVENUE & FINANCIAL LEDGER */}
      {activeTab === "revenue" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Financial Ledger & Payout Summary</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Versioned commission deduction (5.0%) and payout settlement tracker.</p>
            </div>
            <div className="px-3 py-1 rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
              Next Settlement: 2026-09-22
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 text-xs space-y-1">
              <span className="text-slate-400 font-semibold">Total Gross Bookings</span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(28400)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 text-xs space-y-1">
              <span className="text-slate-400 font-semibold">Platform Fee (5%) + GST</span>
              <div className="text-xl font-black text-rose-500">-₹1,675</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 text-xs space-y-1">
              <span className="text-slate-400 font-semibold">Net Vendor Payable</span>
              <div className="text-xl font-black text-emerald-600">{formatCurrency(26725)}</div>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK SLOT MODAL */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Block Resource Slot</h3>
                <button onClick={() => setShowBlockModal(false)} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleBlockSlot} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-500">Resource</label>
                  <select
                    value={blockForm.resourceId}
                    onChange={(e) => setBlockForm({ ...blockForm, resourceId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    {activeVenue.resources.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500">Start Time</label>
                    <input
                      type="time"
                      value={blockForm.startTime}
                      onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500">End Time</label>
                    <input
                      type="time"
                      value={blockForm.endTime}
                      onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-500">Reason</label>
                  <select
                    value={blockForm.reason}
                    onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="MAINTENANCE">Maintenance / Repairs</option>
                    <option value="PRIVATE_EVENT">Private Venue Event</option>
                    <option value="OFFLINE_RESERVATION">Offline Customer Booking</option>
                    <option value="OTHER">Other Operational Reason</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500">Note</label>
                  <input
                    type="text"
                    value={blockForm.note}
                    onChange={(e) => setBlockForm({ ...blockForm, note: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md"
                >
                  Confirm Slot Block
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL BOOKING MODAL */}
      <AnimatePresence>
        {showManualBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Walk-in / Phone Reservation</h3>
                <button onClick={() => setShowManualBookingModal(false)} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleManualBooking} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-500">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={manualForm.customerName}
                    onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-500">Customer Phone</label>
                  <input
                    type="text"
                    required
                    value={manualForm.customerPhone}
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500">Start Time</label>
                    <input
                      type="time"
                      value={manualForm.startTime}
                      onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500">End Time</label>
                    <input
                      type="time"
                      value={manualForm.endTime}
                      onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500">Amount (₹)</label>
                    <input
                      type="number"
                      value={manualForm.amount}
                      onChange={(e) => setManualForm({ ...manualForm, amount: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500">Payment Mode</label>
                    <select
                      value={manualForm.paymentMode}
                      onChange={(e) => setManualForm({ ...manualForm, paymentMode: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="CASH">Cash at Counter</option>
                      <option value="OFFLINE_UPI">UPI / QR at Counter</option>
                      <option value="POS_CARD">Card POS</option>
                      <option value="COMPLIMENTARY">Complimentary</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-md"
                >
                  Confirm & Reserve Offline Slot
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DYNAMIC PRICING MODAL */}
      <AnimatePresence>
        {showPricingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add Dynamic Pricing Rule</h3>
                <button onClick={() => setShowPricingModal(false)} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleCreatePricingRule} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-500">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={pricingForm.name}
                    onChange={(e) => setPricingForm({ ...pricingForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500">Rule Type</label>
                    <select
                      value={pricingForm.ruleType}
                      onChange={(e) => setPricingForm({ ...pricingForm, ruleType: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="PEAK_OFFPEAK">Peak / Off-Peak (P20)</option>
                      <option value="WEEKEND">Weekend Surge (P30)</option>
                      <option value="SEASONAL">Seasonal Rule (P40)</option>
                      <option value="SPECIAL_DATE">Special Date / Holiday (P50)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-500">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      required
                      value={pricingForm.amount}
                      onChange={(e) => setPricingForm({ ...pricingForm, amount: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500">Start Time</label>
                    <input
                      type="time"
                      value={pricingForm.startTime}
                      onChange={(e) => setPricingForm({ ...pricingForm, startTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500">End Time</label>
                    <input
                      type="time"
                      value={pricingForm.endTime}
                      onChange={(e) => setPricingForm({ ...pricingForm, endTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-md"
                >
                  Save & Publish Rule
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
