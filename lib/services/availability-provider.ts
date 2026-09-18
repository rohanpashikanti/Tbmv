import { Slot } from "@/types/venue";
import { VENUES } from "@/lib/mock-data";

export interface AvailabilityProvider {
  mode: "mock" | "postgres" | "redis";
  getAvailability(venueId: string, date: string, resourceId?: string): Promise<Slot[]>;
  subscribeToUpdates(venueId: string, date: string, callback: (update: any) => void): () => void;
}

export class MockAvailabilityProvider implements AvailabilityProvider {
  public readonly mode = "mock" as const;

  async getAvailability(venueId: string, date: string, resourceId?: string): Promise<Slot[]> {
    const venue = VENUES.find((v) => v.id === venueId);
    if (!venue) return [];

    let slots = venue.slotsByDate[date] || [];
    if (resourceId) {
      slots = slots.filter((s) => s.resourceId === resourceId);
    }
    return slots;
  }

  subscribeToUpdates(
    _venueId: string,
    _date: string,
    _callback: (update: any) => void
  ): () => void {
    // In Milestone 2: connects to SSE stream `/api/events/availability`
    return () => {};
  }
}

// Global provider instance (defaults to MockAvailabilityProvider until Milestone 2)
export const availabilityProvider: AvailabilityProvider = new MockAvailabilityProvider();
