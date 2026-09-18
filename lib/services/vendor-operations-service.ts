import { postgresBookingService, TimeInterval, parseVenueTimeToUtc, doIntervalsOverlap } from "./postgres-booking-service";
import { realtimeEventBus } from "./event-bus";
import { VENUES } from "@/lib/mock-data";
import { SlotState, SlotStateType } from "@/types/booking-state";
import { prisma } from "@/lib/prisma";

export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

export interface AuthContext {
  userId: string;
  role: UserRole;
  vendorId?: string;
  email?: string;
}

export type VenueStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "PAUSED" | "REJECTED";
export type ResourceType = "TURF" | "COURT" | "PRIVATE_THEATRE" | "GAMING_STATION" | "PARTY_HALL" | "ROOM" | "POOL" | "OTHER";
export type PricingRuleType = "SPECIAL_DATE" | "SEASONAL" | "WEEKEND" | "PEAK_OFFPEAK" | "BASE_RATE";

export interface PricingRule {
  id: string;
  venueId: string;
  resourceId: string;
  ruleType: PricingRuleType;
  priority: number; // SPECIAL_DATE: 50, SEASONAL: 40, WEEKEND: 30, PEAK_OFFPEAK: 20, BASE_RATE: 10
  name: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string;   // YYYY-MM-DD
  dayOfWeek?: number[];  // 0 = Sunday, 1 = Monday...
  startTime?: string;    // HH:mm
  endTime?: string;      // HH:mm
  amount: number;        // Rate in INR per hour
  active: boolean;
  createdAt: string;
}

export interface SlotBlockRecord {
  id: string;
  venueId: string;
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: "MAINTENANCE" | "PRIVATE_EVENT" | "OFFLINE_RESERVATION" | "OTHER";
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface PayoutLedgerEntry {
  id: string;
  bookingId: string;
  venueId: string;
  vendorId: string;
  grossAmount: number;
  platformFeeRate: number; // e.g. 0.05 for 5%
  platformFeeAmount: number;
  taxAmount: number;
  netVendorAmount: number;
  status: "PENDING_SETTLEMENT" | "SETTLED" | "REFUND_ADJUSTED";
  settlementDate?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetId: string;
  targetType: "VENUE" | "RESOURCE" | "BOOKING" | "PRICING" | "COMMISSION" | "VENDOR" | "SLOT_BLOCK";
  metadata: Record<string, any>;
  timestamp: string;
}

export interface VendorAccount {
  id: string;
  userId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  kycStatus: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
  commissionRate: number; // Default 0.05
  venueIds: string[];
  createdAt: string;
}

export class VendorOperationsService {
  private vendorAccounts = new Map<string, VendorAccount>();
  private pricingRules = new Map<string, PricingRule[]>(); // resourceId -> rules
  private blockedSlots = new Map<string, SlotBlockRecord[]>(); // resourceId -> blocks
  private ledgerEntries = new Map<string, PayoutLedgerEntry>();
  private auditLogs: AuditLogEntry[] = [];
  private venueStatuses = new Map<string, VenueStatus>();
  private globalCommissionRate = 0.05; // 5% default platform take-rate

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed default vendors
    const defaultVendor1: VendorAccount = {
      id: "vendor-1",
      userId: "user-vendor-1",
      businessName: "CGI Sports & Entertainment Ltd",
      contactName: "Rohan Sharma",
      email: "partner@cgisports.in",
      phone: "+91 98765 00001",
      kycStatus: "APPROVED",
      commissionRate: 0.05,
      venueIds: ["venue-1", "venue-2"],
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    this.vendorAccounts.set(defaultVendor1.id, defaultVendor1);

    const defaultVendor2: VendorAccount = {
      id: "vendor-2",
      userId: "user-vendor-2",
      businessName: "Skyline Entertainment Ltd",
      contactName: "Suresh Pillai",
      email: "partner@skyline.in",
      phone: "+91 98765 00002",
      kycStatus: "APPROVED",
      commissionRate: 0.05,
      venueIds: ["venue-3"],
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    this.vendorAccounts.set(defaultVendor2.id, defaultVendor2);

    // Initial venue statuses
    this.venueStatuses.set("venue-1", "PUBLISHED");
    this.venueStatuses.set("venue-2", "PUBLISHED");
    this.venueStatuses.set("venue-3", "PUBLISHED");

    // Base pricing rules
    this.pricingRules.set("res-turf-1", [
      {
        id: "rule-base-1",
        venueId: "venue-1",
        resourceId: "res-turf-1",
        ruleType: "BASE_RATE",
        priority: 10,
        name: "Standard Weekday Hourly Rate",
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-12-31",
        amount: 1200,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "rule-peak-1",
        venueId: "venue-1",
        resourceId: "res-turf-1",
        ruleType: "PEAK_OFFPEAK",
        priority: 20,
        name: "Evening Floodlight Prime Hours",
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-12-31",
        startTime: "18:00",
        endTime: "23:00",
        amount: 1500,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "rule-weekend-1",
        venueId: "venue-1",
        resourceId: "res-turf-1",
        ruleType: "WEEKEND",
        priority: 30,
        name: "Weekend Tournament Prime",
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-12-31",
        dayOfWeek: [0, 6], // Sunday, Saturday
        amount: 1600,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  }

  // =========================================================================
  // 1. AUTHORIZATION & OWNERSHIP GUARDS
  // =========================================================================
  validateVendorOwnership(auth: AuthContext, venueId: string): boolean {
    if (auth.role === "ADMIN") return true;
    if (auth.role !== "VENDOR") return false;
    
    // Check internal map
    const vendor = this.vendorAccounts.get(auth.vendorId || "");
    if (vendor && vendor.kycStatus === "APPROVED" && vendor.venueIds.includes(venueId)) {
      return true;
    }

    // Direct user lookup
    const vendorByUser = this.getVendorByUserId(auth.userId);
    if (vendorByUser && vendorByUser.kycStatus === "APPROVED" && vendorByUser.venueIds.includes(venueId)) {
      return true;
    }

    return false;
  }

  validateAdminRole(auth: AuthContext): boolean {
    return auth.role === "ADMIN";
  }

  // =========================================================================
  // 2. VENDOR LIFECYCLE & ONBOARDING
  // =========================================================================
  getVendorByUserId(userId: string): VendorAccount | null {
    for (const v of this.vendorAccounts.values()) {
      if (v.userId === userId) return v;
    }
    return null;
  }

  getVendorById(vendorId: string): VendorAccount | null {
    return this.vendorAccounts.get(vendorId) || null;
  }

  async applyForVendorAccount(
    userId: string,
    data: {
      businessName: string;
      contactName: string;
      email: string;
      phone: string;
      venueName?: string;
    }
  ): Promise<VendorAccount> {
    const existing = this.getVendorByUserId(userId);
    if (existing) {
      return existing;
    }

    const vendorId = `ven_${Math.random().toString(36).substring(2, 9)}`;
    const newVendor: VendorAccount = {
      id: vendorId,
      userId,
      businessName: data.businessName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      kycStatus: "PENDING", // Initial state is always PENDING review
      commissionRate: 0.05,
      venueIds: [],
      createdAt: new Date().toISOString(),
    };

    this.vendorAccounts.set(vendorId, newVendor);

    this.logAudit({
      actorId: userId,
      actorRole: "CUSTOMER",
      action: "VENDOR_APPLICATION_SUBMITTED",
      targetId: vendorId,
      targetType: "VENDOR",
      metadata: { businessName: data.businessName, phone: data.phone },
    });

    return newVendor;
  }

  approveVendor(auth: AuthContext, vendorId: string, assignedVenueIds: string[] = []): { success: boolean; message: string } {
    if (!this.validateAdminRole(auth)) {
      return { success: false, message: "Unauthorized: Superadmin privileges required." };
    }

    const vendor = this.vendorAccounts.get(vendorId);
    if (!vendor) {
      return { success: false, message: "Vendor not found." };
    }

    vendor.kycStatus = "APPROVED";
    if (assignedVenueIds.length > 0) {
      vendor.venueIds = [...assignedVenueIds];
    }

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: "VENDOR_APPROVED",
      targetId: vendorId,
      targetType: "VENDOR",
      metadata: { businessName: vendor.businessName, assignedVenues: vendor.venueIds },
    });

    return { success: true, message: `Vendor ${vendor.businessName} approved successfully.` };
  }

  suspendVendor(auth: AuthContext, vendorId: string, reason?: string): { success: boolean; message: string } {
    if (!this.validateAdminRole(auth)) {
      return { success: false, message: "Unauthorized: Superadmin privileges required." };
    }

    const vendor = this.vendorAccounts.get(vendorId);
    if (!vendor) {
      return { success: false, message: "Vendor not found." };
    }

    vendor.kycStatus = "SUSPENDED";

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: "VENDOR_SUSPENDED",
      targetId: vendorId,
      targetType: "VENDOR",
      metadata: { businessName: vendor.businessName, reason },
    });

    return { success: true, message: `Vendor ${vendor.businessName} has been suspended.` };
  }

  getAllVendors(auth: AuthContext): VendorAccount[] {
    if (!this.validateAdminRole(auth)) {
      throw new Error("UNAUTHORIZED: Admin privileges required");
    }
    return Array.from(this.vendorAccounts.values());
  }

  // =========================================================================
  // 3. DETERMINISTIC DYNAMIC PRICING ENGINE
  // =========================================================================
  calculateEffectiveHourlyRate(
    venueId: string,
    resourceId: string,
    dateStr: string,
    timeStr: string
  ): { rate: number; matchedRule: PricingRule | null } {
    const rules = this.pricingRules.get(resourceId) || [];
    const activeRules = rules.filter((r) => r.active && dateStr >= r.effectiveFrom && dateStr <= r.effectiveTo);

    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dateObj.getUTCDay();

    const sortedRules = [...activeRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.dayOfWeek && rule.dayOfWeek.length > 0 && !rule.dayOfWeek.includes(dayOfWeek)) {
        continue;
      }
      if (rule.startTime && rule.endTime) {
        if (timeStr < rule.startTime || timeStr >= rule.endTime) {
          continue;
        }
      }
      return { rate: rule.amount, matchedRule: rule };
    }

    const venue = VENUES.find((v) => v.id === venueId);
    const res = venue?.resources.find((r) => r.id === resourceId);
    return { rate: res?.basePricePerHour || 1200, matchedRule: null };
  }

  setPricingRule(auth: AuthContext, rule: Omit<PricingRule, "id" | "createdAt">): { success: boolean; ruleId?: string; message?: string } {
    if (!this.validateVendorOwnership(auth, rule.venueId)) {
      return { success: false, message: "Unauthorized: You do not have permission to edit pricing for this venue." };
    }

    const ruleId = `rule_${Math.random().toString(36).substring(2, 9)}`;
    const fullRule: PricingRule = {
      ...rule,
      id: ruleId,
      createdAt: new Date().toISOString(),
    };

    const existing = this.pricingRules.get(rule.resourceId) || [];
    this.pricingRules.set(rule.resourceId, [...existing, fullRule]);

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: "PRICING_RULE_ADDED",
      targetId: rule.resourceId,
      targetType: "PRICING",
      metadata: { ruleId, name: rule.name, amount: rule.amount, priority: rule.priority },
    });

    realtimeEventBus.publishAvailabilityEvent({
      type: "availability.updated",
      venueId: rule.venueId,
      resourceId: rule.resourceId,
      date: rule.effectiveFrom,
      startTime: rule.startTime || "00:00",
      endTime: rule.endTime || "23:59",
      status: SlotState.AVAILABLE,
    });

    return { success: true, ruleId };
  }

  getPricingRules(resourceId: string): PricingRule[] {
    return this.pricingRules.get(resourceId) || [];
  }

  // =========================================================================
  // 4. UNIFIED INVENTORY BLOCKING (PostgreSQL Enforced)
  // =========================================================================
  async blockSlot(
    auth: AuthContext,
    params: {
      venueId: string;
      resourceId: string;
      date: string;
      startTime: string;
      endTime: string;
      reason: "MAINTENANCE" | "PRIVATE_EVENT" | "OFFLINE_RESERVATION" | "OTHER";
      note?: string;
    }
  ): Promise<{ success: boolean; blockId?: string; message: string }> {
    if (!this.validateVendorOwnership(auth, params.venueId)) {
      return { success: false, message: "Unauthorized: You do not own this venue." };
    }

    const timezone = "Asia/Kolkata";

    // Atomically register the blocked interval in the central PostgreSQL engine
    const blockEngineRes = await postgresBookingService.addBlockedInterval(
      params.resourceId,
      params.date,
      params.startTime,
      params.endTime,
      timezone
    );

    if (!blockEngineRes.success) {
      return {
        success: false,
        message: blockEngineRes.message || `Cannot block slot: Overlaps with existing confirmed booking or active hold.`,
      };
    }

    const existingBlocks = this.blockedSlots.get(params.resourceId) || [];

    const blockId = `block_${Math.random().toString(36).substring(2, 9)}`;
    const blockRecord: SlotBlockRecord = {
      id: blockId,
      venueId: params.venueId,
      resourceId: params.resourceId,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      reason: params.reason,
      note: params.note,
      createdBy: auth.userId,
      createdAt: new Date().toISOString(),
    };

    this.blockedSlots.set(params.resourceId, [...existingBlocks, blockRecord]);

    // Broadcast realtime SSE event
    realtimeEventBus.publishAvailabilityEvent({
      type: "slot.blocked",
      venueId: params.venueId,
      resourceId: params.resourceId,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      status: SlotState.BLOCKED,
    });

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: "SLOT_BLOCKED",
      targetId: params.resourceId,
      targetType: "SLOT_BLOCK",
      metadata: { blockId, date: params.date, time: `${params.startTime}-${params.endTime}`, reason: params.reason },
    });

    return { success: true, blockId, message: `Successfully blocked ${params.startTime} - ${params.endTime}.` };
  }

  getBlockedSlots(resourceId: string, date?: string): SlotBlockRecord[] {
    const blocks = this.blockedSlots.get(resourceId) || [];
    if (date) {
      return blocks.filter((b) => b.date === date);
    }
    return blocks;
  }

  // =========================================================================
  // 5. VENDOR MANUAL / OFFLINE BOOKINGS
  // =========================================================================
  async createManualBooking(
    auth: AuthContext,
    params: {
      venueId: string;
      resourceId: string;
      date: string;
      startTime: string;
      endTime: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      amount: number;
      paymentMode: "CASH" | "OFFLINE_UPI" | "POS_CARD" | "COMPLIMENTARY";
      notes?: string;
    }
  ): Promise<{ success: boolean; bookingId?: string; message: string }> {
    if (!this.validateVendorOwnership(auth, params.venueId)) {
      return { success: false, message: "Unauthorized: You do not own this venue." };
    }

    const holdRes = await postgresBookingService.createHold(
      {
        venueId: params.venueId,
        resourceId: params.resourceId,
        date: params.date,
        slotIds: [`${params.resourceId}-${params.startTime.replace(":", "")}`],
        userId: auth.userId,
      },
      [{ startTime: params.startTime, endTime: params.endTime }]
    );

    if (!holdRes.success || !holdRes.data) {
      return {
        success: false,
        message: holdRes.message || "Manual booking conflict: Slot is unavailable.",
      };
    }

    const confirmRes = await postgresBookingService.confirmBooking(
      {
        holdId: holdRes.data.holdId,
        paymentId: `manual_${params.paymentMode.toLowerCase()}_${Date.now()}`,
        customerDetails: {
          name: params.customerName,
          phone: params.customerPhone,
          email: params.customerEmail || "walkin@guest.local",
        },
      },
      `manual_booking_${holdRes.data.holdId}`
    );

    if (!confirmRes.success || !confirmRes.data) {
      return { success: false, message: confirmRes.message || "Could not confirm manual booking." };
    }

    this.recordLedgerEntry({
      bookingId: confirmRes.data.id,
      venueId: params.venueId,
      vendorId: auth.vendorId || "vendor-1",
      grossAmount: params.amount,
      platformFeeRate: this.globalCommissionRate,
    });

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: "MANUAL_BOOKING_CREATED",
      targetId: confirmRes.data.id,
      targetType: "BOOKING",
      metadata: { customer: params.customerName, time: `${params.startTime}-${params.endTime}`, amount: params.amount },
    });

    return {
      success: true,
      bookingId: confirmRes.data.bookingNumber,
      message: `Manual reservation created for ${params.customerName}.`,
    };
  }

  // =========================================================================
  // 6. CHECK-IN STATE MACHINE (CONFIRMED -> CHECKED_IN -> COMPLETED)
  // =========================================================================
  checkInBooking(
    auth: AuthContext,
    bookingRefOrId: string
  ): { success: boolean; status?: string; message: string } {
    const booking = postgresBookingService.getBooking(bookingRefOrId);
    if (!booking) {
      return { success: false, message: "Booking pass not found." };
    }

    if (!this.validateVendorOwnership(auth, booking.venueId)) {
      return { success: false, message: "Unauthorized: This booking belongs to a different vendor." };
    }

    if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
      return { success: false, message: `Cannot check in: Booking has been ${booking.status}.` };
    }

    if ((booking as any).checkInState === "CHECKED_IN") {
      return { success: false, message: "Duplicate check-in rejected: Customer has already checked in." };
    }

    (booking as any).checkInState = "CHECKED_IN";
    (booking as any).checkedInAt = new Date().toISOString();

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: "BOOKING_CHECKED_IN",
      targetId: booking.id,
      targetType: "BOOKING",
      metadata: { bookingNumber: booking.bookingNumber, customer: booking.customerName },
    });

    return { success: true, status: "CHECKED_IN", message: `Customer ${booking.customerName} successfully checked in.` };
  }

  // =========================================================================
  // 7. FINANCIAL & PAYOUT LEDGER
  // =========================================================================
  recordLedgerEntry(params: {
    bookingId: string;
    venueId: string;
    vendorId: string;
    grossAmount: number;
    platformFeeRate: number;
  }): PayoutLedgerEntry {
    const platformFeeAmount = Math.round(params.grossAmount * params.platformFeeRate);
    const taxAmount = Math.round(platformFeeAmount * 0.18);
    const netVendorAmount = params.grossAmount - platformFeeAmount;

    const entry: PayoutLedgerEntry = {
      id: `ledg_${Math.random().toString(36).substring(2, 9)}`,
      bookingId: params.bookingId,
      venueId: params.venueId,
      vendorId: params.vendorId,
      grossAmount: params.grossAmount,
      platformFeeRate: params.platformFeeRate,
      platformFeeAmount,
      taxAmount,
      netVendorAmount,
      status: "PENDING_SETTLEMENT",
      createdAt: new Date().toISOString(),
    };

    this.ledgerEntries.set(entry.id, entry);
    return entry;
  }

  getVendorLedger(vendorId: string): PayoutLedgerEntry[] {
    return Array.from(this.ledgerEntries.values()).filter((l) => l.vendorId === vendorId);
  }

  getAllLedgerEntries(): PayoutLedgerEntry[] {
    return Array.from(this.ledgerEntries.values());
  }

  // =========================================================================
  // 8. ADMIN MODERATION, COMMISSION & REFUNDS
  // =========================================================================
  moderateVenue(
    auth: AuthContext,
    venueId: string,
    status: VenueStatus,
    reason?: string
  ): { success: boolean; message: string } {
    if (!this.validateAdminRole(auth)) {
      return { success: false, message: "Unauthorized: Superadmin privileges required." };
    }

    this.venueStatuses.set(venueId, status);

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: `VENUE_${status}`,
      targetId: venueId,
      targetType: "VENUE",
      metadata: { status, reason },
    });

    return { success: true, message: `Venue status changed to ${status}.` };
  }

  getVenueStatus(venueId: string): VenueStatus {
    return this.venueStatuses.get(venueId) || "PUBLISHED";
  }

  async adminProcessRefund(
    auth: AuthContext,
    bookingId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.validateAdminRole(auth)) {
      return { success: false, message: "Unauthorized: Superadmin privileges required." };
    }

    const booking = postgresBookingService.getBooking(bookingId);
    if (!booking) {
      return { success: false, message: "Booking not found." };
    }

    if (booking.status === "REFUNDED" || booking.status === "CANCELLED") {
      return { success: false, message: `Booking is already ${booking.status}.` };
    }

    await postgresBookingService.cancelBooking(booking.id);
    booking.status = "REFUNDED";

    const existingLedger = Array.from(this.ledgerEntries.values()).find((l) => l.bookingId === booking.id);
    if (existingLedger) {
      existingLedger.status = "REFUND_ADJUSTED";
    }

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: "ADMIN_REFUND_EXECUTED",
      targetId: booking.id,
      targetType: "BOOKING",
      metadata: { bookingNumber: booking.bookingNumber, refundAmount: booking.totalAmount, reason },
    });

    return { success: true, message: `Booking ${booking.bookingNumber} refunded and inventory released.` };
  }

  updateGlobalCommission(auth: AuthContext, rate: number): { success: boolean; message: string } {
    if (!this.validateAdminRole(auth)) {
      return { success: false, message: "Unauthorized: Superadmin privileges required." };
    }

    const oldRate = this.globalCommissionRate;
    this.globalCommissionRate = rate;

    this.logAudit({
      actorId: auth.userId,
      actorRole: auth.role,
      action: "COMMISSION_RATE_UPDATED",
      targetId: "GLOBAL",
      targetType: "COMMISSION",
      metadata: { oldRate, newRate: rate },
    });

    return { success: true, message: `Platform commission updated to ${(rate * 100).toFixed(1)}%.` };
  }

  getGlobalCommissionRate(): number {
    return this.globalCommissionRate;
  }

  // =========================================================================
  // 9. AUDIT LOGGING
  // =========================================================================
  logAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `aud_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(fullEntry);
  }

  getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }
}

export const vendorOperationsService = new VendorOperationsService();
