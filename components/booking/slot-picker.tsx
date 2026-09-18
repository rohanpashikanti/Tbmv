"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Sun, Sunset, Moon, Check, Lock, Ban, Clock, CheckCircle2, Radio, AlertCircle, ArrowRight } from "lucide-react";
import { Slot, Venue } from "@/types/venue";
import { SlotState, SLOT_STATE_CONFIG, SlotStateType } from "@/types/booking-state";
import { useBookingStore } from "@/stores/booking-store";
import { formatCurrency } from "@/lib/utils";
import { useAvailabilitySSE } from "@/lib/hooks/use-availability-sse";
import { SSEEventEnvelope } from "@/lib/services/event-bus";

interface SlotPickerProps {
  venue: Venue;
}

export function SlotPicker({ venue }: SlotPickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const { selectedDate, setSelectedDate, selectedSlots, toggleSlot, removeSlot, addSlot } = useBookingStore();
  
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    venue.resources[0]?.id || "res-turf-1"
  );
  
  // Real-time slot status overrides by slotId: { [slotId]: SlotStateType }
  const [liveSlotOverrides, setLiveSlotOverrides] = useState<Record<string, SlotStateType>>({});
  const [conflictNotice, setConflictNotice] = useState<{ message: string; suggestedSlot?: Slot } | null>(null);

  const dateOptions = [
    { dateString: "2026-09-18", dayName: "Today", dayNumber: "18 Sep" },
    { dateString: "2026-09-19", dayName: "Sat", dayNumber: "19 Sep" },
    { dateString: "2026-09-20", dayName: "Sun", dayNumber: "20 Sep" },
    { dateString: "2026-09-21", dayName: "Mon", dayNumber: "21 Sep" },
    { dateString: "2026-09-22", dayName: "Tue", dayNumber: "22 Sep" },
    { dateString: "2026-09-23", dayName: "Wed", dayNumber: "23 Sep" },
    { dateString: "2026-09-24", dayName: "Thu", dayNumber: "24 Sep" },
  ];

  // Derive initial slots for active resource & date
  const allVenueSlots = venue.slotsByDate[selectedDate] || [];
  const currentResourceSlots = allVenueSlots.filter(
    (s) => s.resourceId === selectedResourceId
  );

  // Fallback generator for realistic defaults
  const baseSlots: Slot[] = useMemo(() => {
    if (currentResourceSlots.length > 0) return currentResourceSlots;
    return [
      { id: `${selectedResourceId}-0700`, resourceId: selectedResourceId, startTime: "07:00", endTime: "08:00", timeOfDay: "morning", price: venue.startingPrice, status: SlotState.AVAILABLE },
      { id: `${selectedResourceId}-0800`, resourceId: selectedResourceId, startTime: "08:00", endTime: "09:00", timeOfDay: "morning", price: venue.startingPrice, status: SlotState.AVAILABLE },
      { id: `${selectedResourceId}-0900`, resourceId: selectedResourceId, startTime: "09:00", endTime: "10:00", timeOfDay: "morning", price: venue.startingPrice, status: SlotState.BOOKED },
      { id: `${selectedResourceId}-1000`, resourceId: selectedResourceId, startTime: "10:00", endTime: "11:00", timeOfDay: "morning", price: venue.startingPrice, status: SlotState.AVAILABLE },
      { id: `${selectedResourceId}-1300`, resourceId: selectedResourceId, startTime: "13:00", endTime: "14:00", timeOfDay: "afternoon", price: venue.startingPrice, status: SlotState.AVAILABLE },
      { id: `${selectedResourceId}-1400`, resourceId: selectedResourceId, startTime: "14:00", endTime: "15:00", timeOfDay: "afternoon", price: venue.startingPrice, status: SlotState.AVAILABLE },
      { id: `${selectedResourceId}-1500`, resourceId: selectedResourceId, startTime: "15:00", endTime: "16:00", timeOfDay: "afternoon", price: venue.startingPrice, status: SlotState.HELD },
      { id: `${selectedResourceId}-1700`, resourceId: selectedResourceId, startTime: "17:00", endTime: "18:00", timeOfDay: "evening", price: Math.round(venue.startingPrice * 1.2), status: SlotState.AVAILABLE },
      { id: `${selectedResourceId}-1800`, resourceId: selectedResourceId, startTime: "18:00", endTime: "19:00", timeOfDay: "evening", price: Math.round(venue.startingPrice * 1.2), status: SlotState.AVAILABLE },
      { id: `${selectedResourceId}-1900`, resourceId: selectedResourceId, startTime: "19:00", endTime: "20:00", timeOfDay: "evening", price: Math.round(venue.startingPrice * 1.2), status: SlotState.BOOKED },
      { id: `${selectedResourceId}-2000`, resourceId: selectedResourceId, startTime: "20:00", endTime: "21:00", timeOfDay: "evening", price: Math.round(venue.startingPrice * 1.2), status: SlotState.AVAILABLE },
      { id: `${selectedResourceId}-2100`, resourceId: selectedResourceId, startTime: "21:00", endTime: "22:00", timeOfDay: "evening", price: Math.round(venue.startingPrice * 1.2), status: SlotState.AVAILABLE },
    ];
  }, [currentResourceSlots, selectedResourceId, venue.startingPrice]);

  // Handle live incoming SSE events for realtime availability
  const handleSSEEvent = useCallback((event: SSEEventEnvelope) => {
    if (!event.slotId && !event.startTime) return;
    const targetSlotId = event.slotId || `${event.resourceId}-${event.startTime.replace(":", "")}`;

    let nextState: SlotStateType = SlotState.AVAILABLE;
    if (event.type === "slot.held") nextState = SlotState.HELD;
    if (event.type === "slot.booked") nextState = SlotState.BOOKED;
    if (event.type === "slot.blocked") nextState = SlotState.BLOCKED;
    if (event.type === "slot.released") nextState = SlotState.AVAILABLE;

    setLiveSlotOverrides((prev) => ({ ...prev, [targetSlotId]: nextState }));

    // If user currently has this slot selected and it becomes unavailable, alert and remove it
    const isSelected = selectedSlots.some((s) => s.id === targetSlotId);
    if (isSelected && (nextState === SlotState.HELD || nextState === SlotState.BOOKED || nextState === SlotState.BLOCKED)) {
      const removedSlot = selectedSlots.find((s) => s.id === targetSlotId);
      if (removedSlot) {
        removeSlot(targetSlotId);
        // Find next available slot for recommendation
        const nextAvailable = baseSlots.find((s) => s.id !== targetSlotId && s.status === SlotState.AVAILABLE && (!liveSlotOverrides[s.id] || liveSlotOverrides[s.id] === SlotState.AVAILABLE));
        setConflictNotice({
          message: `The ${removedSlot.startTime} - ${removedSlot.endTime} slot was just reserved by another customer.`,
          suggestedSlot: nextAvailable
        });
      }
    }
  }, [selectedSlots, removeSlot, baseSlots, liveSlotOverrides]);

  const { isConnected } = useAvailabilitySSE({
    venueId: venue.id,
    date: selectedDate,
    onEvent: handleSSEEvent,
  });

  // Calculate merged slot statuses
  const activeSlots: Slot[] = useMemo(() => {
    return baseSlots.map((slot) => {
      const liveState = liveSlotOverrides[slot.id];
      if (liveState) {
        return { ...slot, status: liveState };
      }
      return slot;
    });
  }, [baseSlots, liveSlotOverrides]);

  const morningSlots = activeSlots.filter((s) => s.timeOfDay === "morning");
  const afternoonSlots = activeSlots.filter((s) => s.timeOfDay === "afternoon");
  const eveningSlots = activeSlots.filter((s) => s.timeOfDay === "evening" || s.timeOfDay === "night");

  const renderSlotButton = (slot: Slot) => {
    const isSelected = selectedSlots.some((s) => s.id === slot.id);
    const effectiveState: SlotStateType = isSelected ? SlotState.SELECTED : slot.status;
    const meta = SLOT_STATE_CONFIG[effectiveState];

    const isSelectable = meta.isSelectable && slot.status !== SlotState.BOOKED && slot.status !== SlotState.BLOCKED && slot.status !== SlotState.HELD;

    return (
      <motion.button
        key={slot.id}
        whileTap={isSelectable && !shouldReduceMotion ? { scale: 0.95 } : undefined}
        disabled={!isSelectable}
        onClick={() => isSelectable && toggleSlot(slot)}
        aria-label={`${slot.startTime} to ${slot.endTime}, ${meta.label}, ${formatCurrency(slot.price)}`}
        aria-pressed={isSelected}
        aria-disabled={!isSelectable}
        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all focus-visible:ring-2 focus-visible:ring-brand-500 select-none ${
          isSelected
            ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25 ring-2 ring-brand-500/30"
            : slot.status === SlotState.BOOKED
            ? "bg-slate-100/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed opacity-75"
            : slot.status === SlotState.BLOCKED
            ? "bg-rose-50/50 dark:bg-rose-950/20 text-rose-400 border-rose-200/40 cursor-not-allowed opacity-70"
            : slot.status === SlotState.HELD
            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300/80 cursor-not-allowed"
            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-800 hover:border-brand-500/60 hover:bg-brand-50/20"
        }`}
      >
        {/* Time with high visual contrast */}
        <span className="text-xs font-extrabold tracking-tight">
          {slot.startTime}
        </span>

        {/* State label & Price */}
        <div className="flex items-center gap-1 mt-1">
          {slot.status === SlotState.BOOKED ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
              <Lock className="w-2.5 h-2.5" />
              <span>Booked</span>
            </span>
          ) : slot.status === SlotState.BLOCKED ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-500">
              <Ban className="w-2.5 h-2.5" />
              <span>Blocked</span>
            </span>
          ) : slot.status === SlotState.HELD ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <Clock className="w-2.5 h-2.5 animate-pulse" />
              <span>Held</span>
            </span>
          ) : isSelected ? (
            <span className="text-[10px] font-bold text-white flex items-center gap-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Selected</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {formatCurrency(slot.price)}
            </span>
          )}
        </div>
      </motion.button>
    );
  };

  const renderSlotGroup = (title: string, icon: React.ReactNode, slots: Slot[]) => {
    if (slots.length === 0) return null;

    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          {icon}
          <span>{title}</span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({slots.filter((s) => s.status === SlotState.AVAILABLE).length} available)
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {slots.map((slot) => renderSlotButton(slot))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Live sync indicator & Conflict Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
          <span>{isConnected ? "Live Availability Active" : "Connecting live sync..."}</span>
        </div>
      </div>

      <AnimatePresence>
        {conflictNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-medium">{conflictNotice.message}</p>
              {conflictNotice.suggestedSlot && (
                <button
                  onClick={() => {
                    if (conflictNotice.suggestedSlot) {
                      addSlot(conflictNotice.suggestedSlot);
                      setConflictNotice(null);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline pt-0.5"
                >
                  <span>Select recommended alternative ({conflictNotice.suggestedSlot.startTime} - {conflictNotice.suggestedSlot.endTime})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => setConflictNotice(null)}
              className="text-amber-600 hover:text-amber-800 text-xs font-bold px-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. RESOURCE SELECTOR (Multi-Resource Model) */}
      {venue.resources.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Resource / Court
          </label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {venue.resources.map((res) => {
              const isSelected = selectedResourceId === res.id;
              return (
                <button
                  key={res.id}
                  onClick={() => setSelectedResourceId(res.id)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{res.name}</span>
                    <span className="text-[10px] opacity-70">
                      ({formatCurrency(res.basePricePerHour)}/hr)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DATE SELECTOR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Date
          </label>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
            {selectedDate}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {dateOptions.map((item) => {
            const isSelected = selectedDate === item.dateString;

            return (
              <motion.button
                key={item.dateString}
                whileTap={!shouldReduceMotion ? { scale: 0.95 } : undefined}
                onClick={() => setSelectedDate(item.dateString)}
                className={`flex flex-col items-center justify-center min-w-[70px] py-2.5 px-2 rounded-2xl border text-center transition-all shrink-0 ${
                  isSelected
                    ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                  {item.dayName}
                </span>
                <span className="text-xs font-extrabold mt-0.5">
                  {item.dayNumber}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. TIME OF DAY SLOTS */}
      <div className="space-y-5">
        {renderSlotGroup("Morning", <Sun className="w-4 h-4 text-amber-500" />, morningSlots)}
        {renderSlotGroup("Afternoon", <Sunset className="w-4 h-4 text-orange-500" />, afternoonSlots)}
        {renderSlotGroup("Evening & Night", <Moon className="w-4 h-4 text-indigo-500" />, eveningSlots)}
      </div>

      {/* 4. ACCESSIBLE STATUS LEGEND */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-brand-600 flex items-center justify-center text-white text-[9px] font-bold">✓</div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Held (10m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}
