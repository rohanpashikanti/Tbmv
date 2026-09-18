"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Download,
  AlertTriangle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  X,
  Phone,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { VENUES } from "@/lib/mock-data";
import { exportBookingToIcs } from "@/components/booking/calendar-export";

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingPageProps) {
  const resolved = use(params);
  const bookingId = resolved.id;

  const [bookingStatus, setBookingStatus] = useState<"CONFIRMED" | "CANCELLED" | "PENDING">("CONFIRMED");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Mock lookup or fetch from booking service
  const venue = VENUES[0];
  const resource = venue.resources[0];

  const bookingData = {
    bookingNumber: bookingId.startsWith("TBV-") ? bookingId : `TBV-${bookingId}`,
    venueName: venue.name,
    venueAddress: venue.location.address,
    city: venue.location.city,
    resourceName: resource.name,
    date: "2026-09-18",
    startTime: "07:00",
    endTime: "08:00",
    duration: "1 hour",
    basePrice: 1200,
    platformFee: 60,
    taxAmount: 227,
    totalAmount: 1487,
    customerName: "Rohan Sharma",
    customerPhone: "+91 98765 43210",
    customerEmail: "rohan@example.com",
    paymentId: `pay_${bookingId.replace(/[^a-zA-Z0-9]/g, "")}`,
    createdAt: "2026-09-18T07:20:00.000Z",
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `Booking at ${bookingData.venueName}`,
          text: `I've booked ${bookingData.resourceName} at ${bookingData.venueName} for ${bookingData.date} (${bookingData.startTime} - ${bookingData.endTime}). Reference: ${bookingData.bookingNumber}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `Booking Ref: ${bookingData.bookingNumber} | ${bookingData.venueName} (${bookingData.resourceName}) on ${bookingData.date} @ ${bookingData.startTime}`
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleDownloadCalendar = () => {
    exportBookingToIcs({
      bookingNumber: bookingData.bookingNumber,
      venueName: bookingData.venueName,
      resourceName: bookingData.resourceName,
      address: bookingData.venueAddress,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
    });
  };

  const handleConfirmCancellation = async () => {
    setIsCancelling(true);
    try {
      await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingData.bookingNumber }),
      });
      setBookingStatus("CANCELLED");
      setIsCancelModalOpen(false);
    } catch {} finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/bookings"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>My Bookings</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Share</span>
          </button>
          <button
            onClick={handleDownloadCalendar}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {isCopied && (
        <div className="p-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center shadow-md">
          Booking reference copied to clipboard!
        </div>
      )}

      {/* Main Confirmation Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-glass-md space-y-6">
        {/* Status Badge & Header */}
        <div className="text-center space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div
            className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
              bookingStatus === "CONFIRMED"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                : "bg-rose-50 dark:bg-rose-950/60 text-rose-600"
            }`}
          >
            {bookingStatus === "CONFIRMED" ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <X className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {bookingStatus === "CONFIRMED" ? "Reservation Confirmed" : "Reservation Cancelled"}
          </h1>
          <p className="text-xs text-slate-400 font-mono font-semibold">
            Booking ID: {bookingData.bookingNumber}
          </p>
        </div>

        {/* Digital Check-In Pass / QR area */}
        {bookingStatus === "CONFIRMED" && (
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-700 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-200">
                  Digital Venue Pass
                </span>
                <h3 className="text-base font-bold">{bookingData.venueName}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/20 font-medium">
              <div>
                <span className="text-[10px] text-brand-200">Resource:</span>
                <p className="font-bold">{bookingData.resourceName}</p>
              </div>
              <div>
                <span className="text-[10px] text-brand-200">Slot Time:</span>
                <p className="font-bold">
                  {bookingData.startTime} – {bookingData.endTime}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Schedule & Location */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Reservation Schedule
          </h4>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
              <div>
                <span className="text-slate-400 text-[11px]">Date</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {bookingData.date} (Today)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-brand-600 shrink-0" />
              <div>
                <span className="text-slate-400 text-[11px]">Time & Duration</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {bookingData.startTime} – {bookingData.endTime} ({bookingData.duration})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px]">Venue Address</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {bookingData.venueAddress}
                </p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    bookingData.venueName + " " + bookingData.venueAddress
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 text-[11px] font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <span>Get Directions</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Authoritative Price Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Payment & Price Breakdown
          </h4>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Base Pitch Rate ({bookingData.duration}):</span>
              <span className="font-semibold">{formatCurrency(bookingData.basePrice)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Platform Convenience Fee:</span>
              <span className="font-semibold">{formatCurrency(bookingData.platformFee)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Taxes & GST (18%):</span>
              <span className="font-semibold">{formatCurrency(bookingData.taxAmount)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
              <span>Total Paid:</span>
              <span className="text-brand-600">{formatCurrency(bookingData.totalAmount)}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payment Reference: {bookingData.paymentId} (UPI Verified)</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Contact / Cancel */}
        <div className="pt-2 flex items-center gap-3">
          <a
            href="tel:+919876543210"
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>Call Venue</span>
          </a>

          {bookingStatus === "CONFIRMED" && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="py-3 px-4 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Cancel Reservation
            </button>
          )}
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCancelModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold">Cancel Reservation?</h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Per the venue&apos;s cancellation policy, cancellations made at least 4 hours before the slot are eligible for a 100% refund.
              </p>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Estimated Refund:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(bookingData.totalAmount)}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Refund will be credited to original payment source within 24-48 hours.
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Keep Booking
                </button>
                <button
                  disabled={isCancelling}
                  onClick={handleConfirmCancellation}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isCancelling ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
