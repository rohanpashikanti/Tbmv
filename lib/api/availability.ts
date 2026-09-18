import { Slot } from "@/types/venue";
import { availabilityProvider } from "@/lib/services/availability-provider";
import { AvailabilityQuerySchema } from "@/lib/validation/booking";

export async function getAvailability(
  venueId: string,
  date: string,
  resourceId?: string
): Promise<Slot[]> {
  AvailabilityQuerySchema.parse({ venueId, date, resourceId });
  return availabilityProvider.getAvailability(venueId, date, resourceId);
}

export function subscribeToAvailabilityEvents(
  venueId: string,
  date: string,
  onUpdate: (event: { slotId: string; status: Slot["status"] }) => void
): () => void {
  return availabilityProvider.subscribeToUpdates(venueId, date, onUpdate);
}
