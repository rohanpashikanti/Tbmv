import { EventEmitter } from "events";
import { SlotStateType } from "@/types/booking-state";

export type SSEEventType =
  | "availability.updated"
  | "slot.held"
  | "slot.released"
  | "slot.booked"
  | "slot.blocked"
  | "booking.confirmed";

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
}

class RealtimeEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(500);
  }

  /**
   * Broadcast an inventory state change event across all active SSE streams.
   */
  publishAvailabilityEvent(event: Omit<SSEEventEnvelope, "id" | "timestamp">): void {
    const envelope: SSEEventEnvelope = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    // Scoped channel e.g. "venue-1:2026-09-18" and global channel
    this.emit("availability", envelope);
    this.emit(`venue:${envelope.venueId}:${envelope.date}`, envelope);
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
}

export const realtimeEventBus = new RealtimeEventBus();
