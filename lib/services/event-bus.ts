import { EventEmitter } from "events";
import { SlotStateType } from "@/types/booking-state";

export type SSEEventType =
  | "availability.updated"
  | "slot.held"
  | "slot.released"
  | "slot.booked"
  | "slot.blocked"
  | "booking.confirmed"
  | "booking.cancelled"
  | "vendor.payout_update"
  | "vendor.check_in";

export interface SSEEventEnvelope {
  id: string;
  type: SSEEventType;
  venueId: string;
  resourceId: string;
  date: string;
  slotId?: string;
  startTime: string;
  endTime: string;
  status: SlotStateType;
  timestamp: string;
  vendorId?: string;
  userId?: string;
  payload?: any;
}

class RealtimeEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000);
  }

  /**
   * Broadcast an inventory state change event across active scoped streams.
   */
  publishAvailabilityEvent(event: Omit<SSEEventEnvelope, "id" | "timestamp">): void {
    const envelope: SSEEventEnvelope = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    // Scoped channel e.g. "venue-1:2026-09-18" and general availability channel
    this.emit("availability", envelope);
    this.emit(`venue:${envelope.venueId}:${envelope.date}`, envelope);
    if (envelope.vendorId) {
      this.emit(`vendor:${envelope.vendorId}`, envelope);
    }
  }

  /**
   * Broadcast a vendor-scoped event (e.g. check-in, payout)
   */
  publishVendorEvent(vendorId: string, event: Omit<SSEEventEnvelope, "id" | "timestamp" | "vendorId">): void {
    const envelope: SSEEventEnvelope = {
      ...event,
      vendorId,
      id: `evt_ven_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.emit(`vendor:${vendorId}`, envelope);
  }

  /**
   * Broadcast a customer-scoped event (e.g. personal booking confirmed/cancelled)
   */
  publishUserEvent(userId: string, event: Omit<SSEEventEnvelope, "id" | "timestamp" | "userId">): void {
    const envelope: SSEEventEnvelope = {
      ...event,
      userId,
      id: `evt_usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.emit(`user:${userId}`, envelope);
  }

  /**
   * Subscribe to live updates for a specific venue and date
   */
  subscribe(
    venueId: string,
    date: string,
    listener: (event: SSEEventEnvelope) => void
  ): () => void {
    const channel = `venue:${venueId}:${date}`;
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }

  /**
   * Subscribe to live updates for a specific vendor
   */
  subscribeVendor(
    vendorId: string,
    listener: (event: SSEEventEnvelope) => void
  ): () => void {
    const channel = `vendor:${vendorId}`;
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }

  /**
   * Subscribe to customer private events
   */
  subscribeUser(
    userId: string,
    listener: (event: SSEEventEnvelope) => void
  ): () => void {
    const channel = `user:${userId}`;
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }
}

export const realtimeEventBus = new RealtimeEventBus();
