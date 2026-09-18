"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Building2,
  Users,
  CalendarCheck,
  CreditCard,
  Percent,
  BarChart3,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Star,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { VENUES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

type AdminTab = "overview" | "vendors" | "venues" | "bookings" | "payments" | "commissions" | "analytics" | "audit";

export default function AdminCommandCenterPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [commissionRate, setCommissionRate] = useState<number>(0.05);
  const [newCommissionInput, setNewCommissionInput] = useState<string>("5.0");

  const [venueStatuses, setVenueStatuses] = useState<Record<string, string>>({
    "venue-1": "PUBLISHED",
    "venue-2": "PUBLISHED",
    "venue-3": "PUBLISHED",
  });

  const [vendorsList, setVendorsList] = useState([
    { id: "vendor-1", name: "CGI Sports Ltd", owner: "Rohan Sharma", email: "partner@cgisports.in", kyc: "APPROVED", venues: 3, bookings: 412, revenue: 494400 },
    { id: "vendor-2", name: "Premier Turf Arena", owner: "Suresh Pillai", email: "contact@premierturf.in", kyc: "PENDING", venues: 1, bookings: 85, revenue: 102000 },
    { id: "vendor-3", name: "Star Cinemas & Screens", owner: "Karan Johar", email: "ops@starscreens.com", kyc: "APPROVED", venues: 2, bookings: 320, revenue: 800000 },
  ]);

  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: "aud_9281a", actor: "superadmin-001", action: "VENUE_PUBLISHED", target: "CGI Sports Arena", time: "10 mins ago", role: "ADMIN" },
    { id: "aud_9282b", actor: "user-vendor-1", action: "SLOT_BLOCKED", target: "Turf #01 (11:00-13:00)", time: "25 mins ago", role: "VENDOR" },
    { id: "aud_9283c", actor: "superadmin-001", action: "COMMISSION_UPDATED", target: "Platform Rate 5%", time: "1 hour ago", role: "ADMIN" },
    { id: "aud_9284d", actor: "system", action: "WEBHOOK_CAPTURED", target: "TBV-849201", time: "2 hours ago", role: "SYSTEM" },
  ]);

  const [refundModal, setRefundModal] = useState<{ isOpen: boolean; bookingId?: string; bookingNumber?: string; amount?: number }>({ isOpen: false });
  const [refundReason, setRefundReason] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handlers
  const handleModerateVenue = async (venueId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, status, reason: `Admin direct action: ${status}` }),
      });
      const data = await res.json();
      if (data.success) {
        setVenueStatuses((prev) => ({ ...prev, [venueId]: status }));
        setAuditLogs((prev) => [
          { id: `aud_${Date.now()}`, actor: "superadmin-001", action: `VENUE_${status}`, target: venueId, time: "Just now", role: "ADMIN" },
          ...prev,
        ]);
        setNotification({ type: "success", text: `Venue ${venueId} updated to ${status}.` });
      }
    } catch {
      setNotification({ type: "error", text: "Network error executing moderation action." });
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateFloat = parseFloat(newCommissionInput) / 100;
    try {
      const res = await fetch("/api/admin/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: rateFloat }),
      });
      const data = await res.json();
      if (data.success) {
        setCommissionRate(rateFloat);
        setAuditLogs((prev) => [
          { id: `aud_${Date.now()}`, actor: "superadmin-001", action: "COMMISSION_RATE_UPDATED", target: `${newCommissionInput}%`, time: "Just now", role: "ADMIN" },
          ...prev,
        ]);
        setNotification({ type: "success", text: data.message });
      }
    } catch {
      setNotification({ type: "error", text: "Error updating commission." });
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModal.bookingId) return;
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: refundModal.bookingId, reason: refundReason }),
      });
      const data = await res.json();
      if (data.success) {
        setRefundModal({ isOpen: false });
        setNotification({ type: "success", text: data.message });
      } else {
        setNotification({ type: "error", text: data.message });
      }
    } catch {
      setNotification({ type: "error", text: "Error executing refund." });
    }
  };

  const mockBookings = [
    { id: "book_01", bookingNumber: "TBV-849201", customer: "Rohan Sharma", venue: "CGI Sports Arena", time: "18 Sep, 18:00", amount: 1200, status: "CONFIRMED", paymentId: "pay_rzp_94821" },
    { id: "book_02", bookingNumber: "TBV-849202", customer: "Priya Verma", venue: "CGI Sports Arena", time: "18 Sep, 19:00", amount: 1200, status: "CONFIRMED", paymentId: "pay_rzp_94822" },
    { id: "book_03", bookingNumber: "TBV-849203", customer: "Arjun Reddy", venue: "CGI Sports Arena", time: "18 Sep, 20:00", amount: 1500, status: "CONFIRMED", paymentId: "pay_rzp_94823" },
    { id: "book_04", bookingNumber: "TBV-849204", customer: "Sneha Patel", venue: "Starlight Private Cinema", time: "18 Sep, 21:00", amount: 2500, status: "REFUNDED", paymentId: "pay_rzp_94824" },
  ];

  const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heatmapHours = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];

  return (
    <div className="py-6 max-w-7xl mx-auto space-y-6 px-4">
      {/* SUPERADMIN BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Superadmin Control Center
            </span>
            <span className="text-xs font-semibold text-slate-400">Environment: Production Master</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Platform Master Command
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Customer Site
          </Link>
          <Link
            href="/vendor"
            className="px-3.5 py-2 rounded-2xl bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20"
          >
            Vendor Portal
          </Link>
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

      {/* ADMIN TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        {[
          { id: "overview", label: "Overview & KPIs", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "vendors", label: "Vendors & KYC", icon: <Users className="w-4 h-4" /> },
          { id: "venues", label: "Venue Moderation", icon: <Building2 className="w-4 h-4" /> },
          { id: "bookings", label: "Bookings & Refunds", icon: <CalendarCheck className="w-4 h-4" /> },
          { id: "payments", label: "Gateway Ledger", icon: <CreditCard className="w-4 h-4" /> },
          { id: "commissions", label: "Platform Take-Rate", icon: <Percent className="w-4 h-4" /> },
          { id: "analytics", label: "Heatmap & Analytics", icon: <TrendingUp className="w-4 h-4" /> },
          { id: "audit", label: "Audit Log Trail", icon: <FileText className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
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

      {/* 1. OVERVIEW & KPIS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400">Platform GMV (30D)</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(1396400)}</div>
              <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+24.5% MoM</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400">Total Bookings</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">817</div>
              <div className="text-[11px] text-slate-400">Avg Value: ₹1,709</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400">Platform Revenue (5%)</span>
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(69820)}</div>
              <div className="text-[11px] text-slate-400">Net Take-Rate</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400">Payment Success Rate</span>
              <div className="text-2xl font-black text-emerald-600">99.4%</div>
              <div className="text-[11px] text-slate-400">0.6% refund rate</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VENDORS & KYC */}
      {activeTab === "vendors" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Registered Partner Vendors</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage onboarding verification and KYC compliance.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4 text-left">Vendor Business</th>
                  <th className="py-3 px-4 text-left">Owner / Email</th>
                  <th className="py-3 px-4 text-left">KYC Status</th>
                  <th className="py-3 px-4 text-left">Active Venues</th>
                  <th className="py-3 px-4 text-left">Total Volume</th>
                  <th className="py-3 px-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vendorsList.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-slate-100">{v.name}</td>
                    <td className="py-3 px-4">
                      <div>{v.owner}</div>
                      <div className="text-[11px] text-slate-400">{v.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.kyc === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {v.kyc}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{v.venues} Venues</td>
                    <td className="py-3 px-4 font-extrabold">{formatCurrency(v.revenue)} ({v.bookings} bookings)</td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-[11px] hover:bg-slate-200">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. VENUE MODERATION */}
      {activeTab === "venues" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Venue Moderation & Listings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Approve, pause, or feature venues on the platform.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {VENUES.map((v) => {
              const currentStatus = venueStatuses[v.id] || "PUBLISHED";
              return (
                <div key={v.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{v.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentStatus === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {currentStatus}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">{v.location.city} · {v.category} · {v.resources.length} resources · Starting {formatCurrency(v.startingPrice)}/hr</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleModerateVenue(v.id, "PUBLISHED")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 border border-emerald-200"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleModerateVenue(v.id, "PAUSED")}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs hover:bg-amber-100 border border-amber-200"
                    >
                      Pause Listing
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. BOOKINGS & CONTROLLED REFUNDS */}
      {activeTab === "bookings" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Global Bookings & Controlled Refund Actions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Auditable administrative refund processing with inventory release.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4 text-left">Ref #</th>
                  <th className="py-3 px-4 text-left">Customer</th>
                  <th className="py-3 px-4 text-left">Venue & Schedule</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold">{b.bookingNumber}</td>
                    <td className="py-3 px-4 font-bold">{b.customer}</td>
                    <td className="py-3 px-4">{b.venue} ({b.time})</td>
                    <td className="py-3 px-4 font-extrabold">{formatCurrency(b.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.status === "CONFIRMED" ? (
                        <button
                          onClick={() => setRefundModal({ isOpen: true, bookingId: b.id, bookingNumber: b.bookingNumber, amount: b.amount })}
                          className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-bold text-[11px] hover:bg-rose-100 border border-rose-200"
                        >
                          Trigger Refund
                        </button>
                      ) : (
                        <span className="text-slate-400">Refunded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. COMMISSIONS TAKE-RATE SETTINGS */}
      {activeTab === "commissions" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Platform Take-Rate & Commission Rules</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Versioned commission updates apply strictly to future transactions and will never alter historical ledger entries.
            </p>
          </div>

          <form onSubmit={handleUpdateCommission} className="max-w-md space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Global Platform Take-Rate (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={newCommissionInput}
                  onChange={(e) => setNewCommissionInput(e.target.value)}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-sm"
                >
                  Save & Publish Version
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Current Active Take-Rate: <span className="font-bold text-slate-900 dark:text-slate-100">{(commissionRate * 100).toFixed(1)}%</span>
            </div>
          </form>
        </div>
      )}

      {/* 6. ANALYTICS & UTILIZATION HEATMAP */}
      {activeTab === "analytics" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Slot Utilization Heatmap (Day × Hour)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hourly density of confirmed slot bookings across all platform venues.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2 px-3 text-left w-16">Day</th>
                  {heatmapHours.map((h) => (
                    <th key={h} className="py-2 px-3 text-center">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {heatmapDays.map((day, dIdx) => (
                  <tr key={day}>
                    <td className="py-2 px-3 font-bold text-slate-600 dark:text-slate-400">{day}</td>
                    {heatmapHours.map((hour, hIdx) => {
                      const intensity = (dIdx * 3 + hIdx * 7) % 10;
                      return (
                        <td key={hour} className="p-2 text-center">
                          <div
                            className={`py-2 px-3 rounded-xl font-extrabold text-[11px] ${
                              intensity > 7
                                ? "bg-brand-600 text-white"
                                : intensity > 4
                                ? "bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}
                          >
                            {intensity * 10 + 20}%
                          </div>
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

      {/* 7. AUDIT LOG TRAIL */}
      {activeTab === "audit" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Superadmin Audit Trail</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Immutable chronological record of administrative actions.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4 text-left">Log ID</th>
                  <th className="py-3 px-4 text-left">Actor & Role</th>
                  <th className="py-3 px-4 text-left">Action</th>
                  <th className="py-3 px-4 text-left">Target</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{log.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{log.actor}</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">{log.role}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">{log.action}</td>
                    <td className="py-3 px-4">{log.target}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      <AnimatePresence>
        {refundModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-rose-600">Administrative Refund Execution</h3>
                <button onClick={() => setRefundModal({ isOpen: false })} className="font-bold text-slate-400">✕</button>
              </div>

              <p className="text-slate-500">
                Are you sure you want to execute a refund of <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(refundModal.amount || 0)}</span> for booking <span className="font-mono font-bold">{refundModal.bookingNumber}</span>? This will release inventory back into available stock.
              </p>

              <form onSubmit={handleProcessRefund} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-500">Reason for Refund</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer dispute resolution"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md"
                >
                  Confirm & Process Refund
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
