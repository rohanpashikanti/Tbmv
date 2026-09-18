import { bookingService, BookingHoldResult, BookingConfirmResult } from "@/lib/services/booking-service";
import { SlotHoldInput, BookingConfirmInput, SlotHoldSchema, BookingConfirmSchema } from "@/lib/validation/booking";

export async function createBookingHold(input: SlotHoldInput): Promise<BookingHoldResult> {
  const validated = SlotHoldSchema.parse(input);
  return bookingService.createHold(validated);
}

export async function confirmBooking(input: BookingConfirmInput): Promise<BookingConfirmResult> {
  const validated = BookingConfirmSchema.parse(input);
  return bookingService.confirmBooking(validated);
}
