import { z } from "zod";

export const VenueCategoryEnum = z.enum([
  "all",
  "cricket",
  "football",
  "private-theatre",
  "party-hall",
  "resort",
  "gaming",
  "swimming",
  "badminton",
  "tennis",
  "pickleball",
]);

export const SlotHoldSchema = z.object({
  venueId: z.string().min(1, "Venue ID is required"),
  resourceId: z.string().min(1, "Resource ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  slotIds: z.array(z.string()).min(1, "At least one slot must be selected"),
  userId: z.string().optional(),
});

export const BookingConfirmSchema = z.object({
  holdId: z.string().min(1, "Hold ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  customerDetails: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Valid 10-digit phone required"),
    email: z.string().email("Valid email address required"),
  }),
});

export const AvailabilityQuerySchema = z.object({
  venueId: z.string().min(1, "Venue ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  resourceId: z.string().optional(),
});

export const TypedSearchSchema = z.object({
  category: VenueCategoryEnum.optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  partySize: z.number().int().positive().optional(),
  budget: z.number().positive().optional(),
  rawQuery: z.string().optional(),
});

export type SlotHoldInput = z.infer<typeof SlotHoldSchema>;
export type BookingConfirmInput = z.infer<typeof BookingConfirmSchema>;
export type AvailabilityQueryInput = z.infer<typeof AvailabilityQuerySchema>;
export type TypedSearchInput = z.infer<typeof TypedSearchSchema>;
