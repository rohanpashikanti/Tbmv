"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  ShieldCheck,
  X,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Smartphone,
  Building2,
  Info,
} from "lucide-react";
import { Venue } from "@/types/venue";
import { useBookingStore } from "@/stores/booking-store";
import { formatCurrency } from "@/lib/utils";
import { createBookingHold } from "@/lib/api/bookings";
import { BookingHoldResult } from "@/lib/services/booking-service";
import { useHoldCountdown } from "@/lib/hooks/use-hold-countdown";
import { calculateAuthoritativePriceBreakdown, PriceBreakdown } from "@/lib/services/razorpay-provider";

interface FloatingBookingDockProps {
  venue: Venue;
  onOpenSlotPicker?: () => void;
}

export function FloatingBookingDock({ venue, onOpenSlotPicker }: FloatingBookingDockProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { selectedDate, selectedSlots, clearSelectedSlots } = useBookingStore();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [holdResult, setHoldResult] = useState<BookingHoldResult | null>(null);
  const [paymentState, setPaymentState] = useState<
    "IDLE" | "HELD" | "PAYMENT_PROCESSING" | "PAYMENT_FAILED" | "CONFIRMED"
  >("IDLE");
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");

  // Server Countdown Hook
  const { formatted: countdownFormatted, isExpired: isHoldExpired } = useHoldCountdown(
    holdResult?.expiresAt || null,
    () => {
      setErrorMessage("Your slot hold expired. Please re-select your slot.");
      setPaymentState("IDLE");
      setHoldResult(null);
    }
  );

  const totalBasePrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
  const totalHours = selectedSlots.length;
  const breakdown: PriceBreakdown = calculateAuthoritativePriceBreakdown(totalBasePrice);

  const activeResourceName =
    venue.resources.find((r) => r.id === selectedSlots[0]?.resourceId)?.name ||
    venue.resources[0]?.name ||
    "Court #01";

  // Step 1: Secure Slot (POST /api/bookings/hold)
  const handleSecureSlot = async () => {
    if (selectedSlots.length === 0) {
      if (onOpenSlotPicker) onOpenSlotPicker();
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const res = await createBookingHold({
        venueId: venue.id,
        resourceId: selectedSlots[0]?.resourceId || venue.resources[0].id,
        date: selectedDate,
        slotIds: selectedSlots.map((s) => s.id),
      });

      if (res.success && res.holdId) {
        setHoldResult(res);
        setPaymentState("HELD");
        setIsDrawerOpen(true);
      } else {
        setErrorMessage(res.message || "Slot unavailable. Please choose another slot.");
      }
    } catch {
      setErrorMessage("Could not secure hold. The slot may have just been taken.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Pay & Confirm Transaction
  const handleProcessPayment = async () => {
    if (!holdResult || isHoldExpired) {
      setErrorMessage("Hold has expired. Please re-select your slot.");
      return;
    }

    setIsProcessing(true);
    setPaymentState("PAYMENT_PROCESSING");
    setErrorMessage(null);

    try {
      // 1. Create payment order
      const orderRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdId: holdResult.holdId, amount: breakdown.totalAmount }),
      });
      const orderJson = await orderRes.json();

      // 2. Trigger webhook verification & confirmation
      const webhookRes = await fetch("/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-event-id": `evt_${Date.now()}`,
        },
        body: JSON.stringify({
          eventId: `evt_${Date.now()}`,
          eventType: "payment.captured",
          orderId: orderJson.data.orderId,
          paymentId: `pay_${Date.now()}`,
          amount: breakdown.totalAmount,
          customerDetails: {
            name: "Rohan Sharma",
            phone: "+91 98765 43210",
            email: "rohan@example.com",
          },
        }),
      });

      const webhookJson = await webhookRes.json();

      if (webhookJson.success) {
        setConfirmedBookingId(webhookJson.bookingId || "TBV-849201");
        setPaymentState("CONFIRMED");
      } else {
        setPaymentState("PAYMENT_FAILED");
        setErrorMessage(webhookJson.message || "Payment verification failed.");
      }
    } catch {
      setPaymentState("PAYMENT_FAILED");
      setErrorMessage("Payment transaction error. Your hold is still active — you can retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* PERSISTENT BOTTOM FLOATING DOCK */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 pb-safe pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <motion.div
            initial={shouldReduceMotion ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-3xl glass-dock shadow-glass-lg border border-white/80 dark:border-slate-800"
          >
            {/* Price & Selection Details */}
            <div className="flex flex-col max-w-[65%]">
              {selectedSlots.length > 0 ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {activeResourceName}
                    </span>
                    <span>•</span>
                    <span>{selectedSlots[0]?.startTime}</span>
                    <span>({totalHours} hr{totalHours > 1 ? "s" : ""})</span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(breakdown.totalAmount)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (incl. taxes & fees)
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[11px] text-slate-400 font-medium">Starting from</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(venue.startingPrice)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/{venue.priceUnit}</span>
                  </div>
                </>
              )}
            </div>

            {/* CTA */}
            <motion.button
              whileTap={!shouldReduceMotion ? { scale: 0.95 } : undefined}
              disabled={isProcessing}
              onClick={handleSecureSlot}
              className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/30 hover:from-brand-500 hover:to-indigo-500 transition-all select-none shrink-0 disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{selectedSlots.length > 0 ? "Secure Slot" : "Check Slots"}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* CHECKOUT & HOLD DRAWER MODAL */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
              animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 max-h-[92vh] overflow-y-auto"
            >
              {paymentState !== "CONFIRMED" ? (
                <div className="space-y-5">
                  {/* Hold Countdown Header Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 text-brand-900 dark:text-brand-200">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
                      <span>Slot Secured — Complete in:</span>
                    </div>
                    <div className="text-base font-mono font-extrabold text-brand-600 dark:text-brand-400">
                      {countdownFormatted}
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Checkout & Reserve
                      </h3>
                      <p className="text-xs text-slate-400">
                        {venue.name} · {activeResourceName}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                      {paymentState === "PAYMENT_FAILED" && (
                        <button
                          onClick={handleProcessPayment}
                          className="text-xs font-bold underline shrink-0"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  )}

                  {/* Authoritative Price Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">
                        Base Rate ({totalHours} hr{totalHours > 1 ? "s" : ""}):
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(breakdown.basePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Platform Convenience Fee (5%):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(breakdown.platformFee)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Taxes & GST (18%):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(breakdown.taxAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      <span>Total Payable:</span>
                      <span className="text-brand-600 dark:text-brand-400">
                        {formatCurrency(breakdown.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPaymentMethod("upi")}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === "upi"
                            ? "bg-brand-50 border-brand-600 text-brand-700 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="text-[11px]">UPI / QR</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === "card"
                            ? "bg-brand-50 border-brand-600 text-brand-700 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-[11px]">Cards</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod("netbanking")}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === "netbanking"
                            ? "bg-brand-50 border-brand-600 text-brand-700 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600"
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span className="text-[11px]">Net Banking</span>
                      </button>
                    </div>
                  </div>

                  {/* Cancellation Note */}
                  <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      Free cancellation up to 4 hours before slot start time for a 100% full refund.
                    </span>
                  </div>

                  {/* Pay CTA */}
                  <button
                    disabled={isProcessing || isHoldExpired}
                    onClick={handleProcessPayment}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Pay {formatCurrency(breakdown.totalAmount)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* CONFIRMATION SUCCESS STATE */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Booking Confirmed!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your reservation at <strong>{venue.name}</strong> ({activeResourceName}) is officially locked in.
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-brand-600">
                    ID: {confirmedBookingId}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        clearSelectedSlots();
                        router.push(`/booking/${confirmedBookingId}`);
                      }}
                      className="flex-1 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
                    >
                      View Booking Pass
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
