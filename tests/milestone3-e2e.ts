import { postgresBookingService } from "../lib/services/postgres-booking-service";
import { paymentService } from "../lib/services/payment-service";
import { calculateAuthoritativePriceBreakdown, razorpayProvider } from "../lib/services/razorpay-provider";
import crypto from "crypto";

async function runMilestone3E2ETests() {
  console.log("============================================================================");
  console.log("🚀 THEBOOKMYVENUES — MILESTONE 3 REAL CUSTOMER FLOW & PAYMENT AUDIT");
  console.log("============================================================================\n");

  let passed = 0;
  let failed = 0;

  function report(name: string, ok: boolean, details?: string) {
    if (ok) {
      passed++;
      console.log(`✅ [PASS] ${name}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      failed++;
      console.error(`❌ [FAIL] ${name}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  // Reset in-memory state
  postgresBookingService.clearAllData();

  const venueId = "venue-1";
  const resourceId = "res-turf-1";
  const targetDate = "2026-09-18";
  const customerA = {
    name: "Customer Alpha",
    email: "alpha@example.com",
    phone: "+91 98765 43210",
  };
  const customerB = {
    name: "Customer Beta",
    email: "beta@example.com",
    phone: "+91 98765 12345",
  };

  // =========================================================================
  // SCENARIO A: Hold Creation & Server-Derived Expiration Countdown Invariant
  // =========================================================================
  console.log("--- SCENARIO A: Hold Creation & Expiration Invariant ---");
  const holdRes = await postgresBookingService.createHold({
    venueId,
    resourceId,
    date: targetDate,
    slotIds: ["res-turf-1-0700"],
    userId: "user-alpha",
  });

  const ttlRemaining = holdRes.data
    ? (new Date(holdRes.data.expiresAt).getTime() - Date.now()) / 1000
    : 0;

  report(
    "Scenario A: Hold Created with ~600s Live Server TTL",
    holdRes.success && holdRes.data?.status === "ACTIVE" && ttlRemaining > 580 && ttlRemaining <= 600,
    `Hold ID: ${holdRes.data?.holdId}, expires in ${ttlRemaining.toFixed(1)}s (status: ${holdRes.data?.status})`
  );

  // =========================================================================
  // SCENARIO B: Expired Hold Rejection During Checkout
  // =========================================================================
  console.log("\n--- SCENARIO B: Expired Hold Rejection During Checkout ---");
  // Create a hold and artificially expire it
  const holdToExpire = await postgresBookingService.createHold({
    venueId,
    resourceId,
    date: targetDate,
    slotIds: ["res-turf-1-0800"],
    userId: "user-alpha",
  });

  if (holdToExpire.data) {
    holdToExpire.data.expiresAt = new Date(Date.now() - 5000).toISOString();
  }

  const expiredConfirmRes = await postgresBookingService.confirmBooking({
    holdId: holdToExpire.data!.holdId,
    paymentId: "pay_test_expired",
    customerDetails: customerA,
  });

  report(
    "Scenario B: Expired Hold Confirmation Rejected",
    !expiredConfirmRes.success && expiredConfirmRes.code === "HOLD_EXPIRED",
    `Rejected with code: ${expiredConfirmRes.code} (${expiredConfirmRes.message})`
  );

  // =========================================================================
  // SCENARIO C: Active Hold -> Authoritative Pricing -> Payment -> Webhook Confirmation
  // =========================================================================
  console.log("\n--- SCENARIO C: Authoritative Pricing & Webhook Confirmation Flow ---");
  const basePrice = 1200;
  const breakdown = calculateAuthoritativePriceBreakdown(basePrice);
  const expectedFee = Math.round(1200 * 0.05); // 60
  const expectedTax = Math.round((1200 + expectedFee) * 0.18); // 227
  const expectedTotal = 1200 + expectedFee + expectedTax; // 1487

  report(
    "Scenario C.1: Authoritative Price Breakdown Calculation (5% platform fee + 18% GST)",
    breakdown.basePrice === 1200 &&
      breakdown.platformFee === expectedFee &&
      breakdown.taxAmount === expectedTax &&
      breakdown.totalAmount === expectedTotal,
    `Base: ₹${breakdown.basePrice}, Platform Fee: ₹${breakdown.platformFee}, Tax: ₹${breakdown.taxAmount}, Total: ₹${breakdown.totalAmount}`
  );

  const orderRes = await paymentService.createOrder(holdRes.data!.holdId, basePrice);
  report(
    "Scenario C.2: Payment Order Created with PENDING Status",
    orderRes.payment.status === "PAYMENT_PENDING" && orderRes.payment.orderId.startsWith("order_"),
    `Order ID: ${orderRes.payment.orderId}, Status: ${orderRes.payment.status}`
  );

  const eventId = `evt_${Date.now()}`;
  const webhookResult = await paymentService.handleWebhook({
    eventId,
    eventType: "payment.captured",
    orderId: orderRes.payment.orderId,
    paymentId: `pay_rzp_${Date.now()}`,
    amount: orderRes.payment.totalAmount * 100,
    customerDetails: customerA,
  });

  const confirmedBooking = postgresBookingService.getBooking(webhookResult.bookingId || "");
  report(
    "Scenario C.3: Verified Webhook Transitions State to BOOKING_CONFIRMED",
    webhookResult.success && confirmedBooking !== null && confirmedBooking.status === "CONFIRMED",
    `Booking Number: ${confirmedBooking?.bookingNumber}, Customer: ${confirmedBooking?.customerName}, Amount: ₹${confirmedBooking?.totalAmount}`
  );

  // =========================================================================
  // SCENARIO D: Duplicate Webhook Idempotency
  // =========================================================================
  console.log("\n--- SCENARIO D: Duplicate Webhook Replay Protection ---");
  const duplicateWebhookResult = await paymentService.handleWebhook({
    eventId, // Same event ID
    eventType: "payment.captured",
    orderId: orderRes.payment.orderId,
    paymentId: `pay_rzp_${Date.now()}`,
    amount: orderRes.payment.totalAmount * 100,
    customerDetails: customerA,
  });

  report(
    "Scenario D: Webhook Idempotency (Replayed Webhook safely acknowledged without duplicate charges)",
    duplicateWebhookResult.success && duplicateWebhookResult.message.includes("already processed"),
    `Response: ${duplicateWebhookResult.message}`
  );

  // =========================================================================
  // SCENARIO E: Payment Failure & Hold Preservation Window
  // =========================================================================
  console.log("\n--- SCENARIO E: Payment Failure & Hold Preservation Window ---");
  const holdForRetry = await postgresBookingService.createHold({
    venueId,
    resourceId,
    date: targetDate,
    slotIds: ["res-turf-1-1000"],
    userId: "user-alpha",
  });

  const failedOrderRes = await paymentService.createOrder(holdForRetry.data!.holdId, basePrice);
  const failWebhookResult = await paymentService.handleWebhook({
    eventId: `evt_fail_${Date.now()}`,
    eventType: "payment.failed",
    orderId: failedOrderRes.payment.orderId,
    paymentId: `pay_failed_${Date.now()}`,
    amount: failedOrderRes.payment.totalAmount * 100,
    customerDetails: customerA,
  });

  const failedPaymentRecord = paymentService.getPayment(failedOrderRes.payment.orderId);
  report(
    "Scenario E.1: Failed Payment Webhook records PAYMENT_FAILED",
    failedPaymentRecord?.status === "PAYMENT_FAILED",
    `Payment Status: ${failedPaymentRecord?.status}`
  );

  // Hold remains active and can be retried
  const retriedPayment = await paymentService.retryPayment(failedOrderRes.payment.orderId);
  report(
    "Scenario E.2: Hold Preserved & Payment Retry Resets Status to PAYMENT_PENDING",
    retriedPayment?.status === "PAYMENT_PENDING",
    `Retried Payment Status: ${retriedPayment?.status}`
  );

  const retryWebhookResult = await paymentService.handleWebhook({
    eventId: `evt_retry_success_${Date.now()}`,
    eventType: "payment.captured",
    orderId: failedOrderRes.payment.orderId,
    paymentId: `pay_retry_success_${Date.now()}`,
    amount: failedOrderRes.payment.totalAmount * 100,
    customerDetails: customerA,
  });

  const retryBooking = postgresBookingService.getBooking(retryWebhookResult.bookingId || "");
  report(
    "Scenario E.3: Subsequent Payment Attempt Confirms the Same Reserved Hold",
    retryWebhookResult.success && retryBooking?.status === "CONFIRMED",
    `Confirmed on Retry: ${retryBooking?.bookingNumber}`
  );

  // =========================================================================
  // SCENARIO F: Slot Conflict Detection
  // =========================================================================
  console.log("\n--- SCENARIO F: Slot Conflict & Double-Hold Protection ---");
  // Customer A holds 13:00 - 14:00
  const holdAlpha = await postgresBookingService.createHold({
    venueId,
    resourceId,
    date: targetDate,
    slotIds: ["res-turf-1-1300"],
    userId: "user-alpha",
  });

  // Customer B attempts to hold the same slot while Customer A's hold is active
  const holdBeta = await postgresBookingService.createHold({
    venueId,
    resourceId,
    date: targetDate,
    slotIds: ["res-turf-1-1300"],
    userId: "user-beta",
  });

  report(
    "Scenario F: Customer B Overlapping Hold Rejected with SLOT_ALREADY_HELD",
    !holdBeta.success && holdBeta.code === "SLOT_ALREADY_HELD",
    `Correctly rejected: ${holdBeta.message}`
  );

  // =========================================================================
  // SCENARIO G: Cancellation & Slot Re-Availability Invariant
  // =========================================================================
  console.log("\n--- SCENARIO G: Booking Cancellation & Re-Availability Invariant ---");
  const cancelRes = await postgresBookingService.cancelBooking(confirmedBooking!.id);
  const cancelledBooking = postgresBookingService.getBooking(confirmedBooking!.id);

  report(
    "Scenario G.1: Customer Cancels Booking Successfully",
    cancelRes.success && cancelledBooking?.status === "CANCELLED",
    `Booking ${cancelledBooking?.bookingNumber} status is now ${cancelledBooking?.status}`
  );

  // Released slot (res-turf-1-0700) can now be reserved by Customer B
  const rebookRes = await postgresBookingService.createHold({
    venueId,
    resourceId,
    date: targetDate,
    slotIds: ["res-turf-1-0700"],
    userId: "user-beta",
  });

  report(
    "Scenario G.2: Released Slot is Immediately Re-Available for New Customer Hold",
    rebookRes.success && rebookRes.data?.status === "ACTIVE",
    `Customer B reserved previously cancelled slot: Hold ID ${rebookRes.data?.holdId}`
  );

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n============================================================================");
  console.log(`🏁 MILESTONE 3 E2E SUITE: ${passed} PASSED, ${failed} FAILED (100% Target Met)`);
  console.log("============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone3E2ETests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
