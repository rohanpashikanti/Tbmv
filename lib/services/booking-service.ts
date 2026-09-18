import { SlotHoldInput, BookingConfirmInput } from "@/lib/validation/booking";
import { SlotStateType } from "@/types/booking-state";

export interface BookingHoldResult {
  success: boolean;
  mode: "mock" | "production";
  state: "MOCK_HELD" | "HELD" | "FAILED";
  holdId: string;
  expiresAt: string;
  message: string;
}

export interface BookingConfirmResult {
  success: boolean;
  mode: "mock" | "production";
  state: "MOCK_CONFIRMED" | "CONFIRMED" | "FAILED";
  bookingId: string;
  timestamp: string;
  message: string;
  isSimulatedMock: boolean;
}

export interface BookingService {
  mode: "mock" | "production";
  createHold(input: SlotHoldInput): Promise<BookingHoldResult>;
  confirmBooking(input: BookingConfirmInput): Promise<BookingConfirmResult>;
  cancelHold(holdId: string): Promise<boolean>;
}

export class MockBookingService implements BookingService {
  public readonly mode = "mock" as const;

  async createHold(input: SlotHoldInput): Promise<BookingHoldResult> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    return {
      success: true,
      mode: "mock",
      state: "MOCK_HELD",
      holdId: `mock_hold_${Math.random().toString(36).substring(2, 9)}`,
      expiresAt,
      message: "Temporary 10-minute hold created in mock sandbox mode.",
    };
  }

  async confirmBooking(input: BookingConfirmInput): Promise<BookingConfirmResult> {
    const bookingId = `TBV-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      mode: "mock",
      state: "MOCK_CONFIRMED",
      bookingId,
      timestamp: new Date().toISOString(),
      message: "Mock reservation created. No actual transaction or database write occurred.",
      isSimulatedMock: true,
    };
  }

  async cancelHold(_holdId: string): Promise<boolean> {
    return true;
  }
}

// Global service instance (defaults to MockBookingService until Milestone 2)
export const bookingService: BookingService = new MockBookingService();
