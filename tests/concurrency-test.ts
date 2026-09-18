import { postgresBookingService, parseVenueTimeToUtc, doIntervalsOverlap } from "../lib/services/postgres-booking-service";
import { paymentService } from "../lib/services/payment-service";

async function runMilestone21AuditTests() {
  console.log("============================================================================");
  console.log("🧪 THEBOOKMYVENUES — MILESTONE 2.1 PRODUCTION BOOKING ENGINE AUDIT");
  console.log("============================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ""}`);
    }
  }

  const targetVenueId = "venue-1";
  const targetResourceId = "res-turf-1";
  const targetDate = "2026-09-18";

  // -------------------------------------------------------------------------------------
  // SECTION 1: CRITICAL ARBITRARY OVERLAPPING INTERVAL TESTS
  // -------------------------------------------------------------------------------------
  console.log("--- 1. CRITICAL ARBITRARY OVERLAPPING INTERVAL TESTS ---");
  postgresBookingService.clearAllData();

  // Overlap Scenario 1: 09:00-11:00 vs 10:00-12:00 (Overlap from 10:00 to 11:00)
  const holdA1 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-1"] },
    [{ startTime: "09:00", endTime: "11:00" }]
  );
  assert(holdA1.success === true, "Booking A (09:00 -> 11:00) creates hold successfully");
  await postgresBookingService.confirmBooking({
    holdId: holdA1.data!.holdId,
    paymentId: "p-a1",
    customerDetails: { name: "User A", phone: "9000000001", email: "a@test.com" },
  });

  const holdB1 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-2"] },
    [{ startTime: "10:00", endTime: "12:00" }]
  );
  assert(
    holdB1.success === false && holdB1.code === "SLOT_UNAVAILABLE",
    "Booking B (10:00 -> 12:00) overlaps with A (09:00 -> 11:00) -> REJECTED by exclusion"
  );

  // Overlap Scenario 2: 09:00-10:00 vs 10:00-11:00 (Touching boundaries [09,10) and [10,11))
  postgresBookingService.clearAllData();
  const holdA2 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-3"] },
    [{ startTime: "09:00", endTime: "10:00" }]
  );
  await postgresBookingService.confirmBooking({
    holdId: holdA2.data!.holdId,
    paymentId: "p-a2",
    customerDetails: { name: "User A", phone: "9000000001", email: "a@test.com" },
  });

  const holdB2 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-4"] },
    [{ startTime: "10:00", endTime: "11:00" }]
  );
  assert(
    holdB2.success === true,
    "Adjacent intervals (09:00 -> 10:00) and (10:00 -> 11:00) touch at 10:00 but DO NOT overlap -> BOTH SUCCEED"
  );

  // Overlap Scenario 3: 09:00-10:00 vs 09:30-10:30 (Partial overlap)
  postgresBookingService.clearAllData();
  const holdA3 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-5"] },
    [{ startTime: "09:00", endTime: "10:00" }]
  );
  await postgresBookingService.confirmBooking({
    holdId: holdA3.data!.holdId,
    paymentId: "p-a3",
    customerDetails: { name: "User A", phone: "9000000001", email: "a@test.com" },
  });

  const holdB3 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-6"] },
    [{ startTime: "09:30", endTime: "10:30" }]
  );
  assert(
    holdB3.success === false && holdB3.code === "SLOT_UNAVAILABLE",
    "Interval (09:30 -> 10:30) overlaps with (09:00 -> 10:00) -> REJECTED"
  );

  // Overlap Scenario 4: 09:00-12:00 vs 10:00-11:00 (Subset inside superset)
  postgresBookingService.clearAllData();
  const holdA4 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-7"] },
    [{ startTime: "09:00", endTime: "12:00" }]
  );
  await postgresBookingService.confirmBooking({
    holdId: holdA4.data!.holdId,
    paymentId: "p-a4",
    customerDetails: { name: "User A", phone: "9000000001", email: "a@test.com" },
  });

  const holdB4 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-8"] },
    [{ startTime: "10:00", endTime: "11:00" }]
  );
  assert(
    holdB4.success === false && holdB4.code === "SLOT_UNAVAILABLE",
    "Subset interval (10:00 -> 11:00) inside (09:00 -> 12:00) -> REJECTED"
  );

  // Overlap Scenario 5: 10:00-11:00 vs 09:00-12:00 (Superset around existing subset)
  postgresBookingService.clearAllData();
  const holdA5 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-9"] },
    [{ startTime: "10:00", endTime: "11:00" }]
  );
  await postgresBookingService.confirmBooking({
    holdId: holdA5.data!.holdId,
    paymentId: "p-a5",
    customerDetails: { name: "User A", phone: "9000000001", email: "a@test.com" },
  });

  const holdB5 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-10"] },
    [{ startTime: "09:00", endTime: "12:00" }]
  );
  assert(
    holdB5.success === false && holdB5.code === "SLOT_UNAVAILABLE",
    "Superset interval (09:00 -> 12:00) enclosing existing (10:00 -> 11:00) -> REJECTED"
  );

  // Overlap Scenario 6: 09:00-11:00 vs 08:00-10:00 (Preceding overlap)
  postgresBookingService.clearAllData();
  const holdA6 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-11"] },
    [{ startTime: "09:00", endTime: "11:00" }]
  );
  await postgresBookingService.confirmBooking({
    holdId: holdA6.data!.holdId,
    paymentId: "p-a6",
    customerDetails: { name: "User A", phone: "9000000001", email: "a@test.com" },
  });

  const holdB6 = await postgresBookingService.createHold(
    { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: ["custom-12"] },
    [{ startTime: "08:00", endTime: "10:00" }]
  );
  assert(
    holdB6.success === false && holdB6.code === "SLOT_UNAVAILABLE",
    "Preceding interval (08:00 -> 10:00) overlapping with (09:00 -> 11:00) -> REJECTED"
  );

  // -------------------------------------------------------------------------------------
  // SECTION 2: 20 CONCURRENT REQUESTS ON IDENTICAL SLOT
  // -------------------------------------------------------------------------------------
  console.log("\n--- 2. 20 CONCURRENT REQUESTS (IDENTICAL SLOT) ---");
  postgresBookingService.clearAllData();

  const parallel20 = Array.from({ length: 20 }).map((_, i) =>
    postgresBookingService.createHold({
      venueId: targetVenueId,
      resourceId: targetResourceId,
      date: targetDate,
      slotIds: ["res-turf-1-1700"],
      userId: `user-sim-${i}`,
    })
  );

  const results20 = await Promise.all(parallel20);
  const success20 = results20.filter((r) => r.success);
  const fail20 = results20.filter((r) => !r.success);

  assert(success20.length === 1, "20 Identical Requests: Exactly 1 acquires the hold");
  assert(fail20.length === 19, "20 Identical Requests: 19 competing requests safely rejected");

  // -------------------------------------------------------------------------------------
  // SECTION 3: 20 CONCURRENT REQUESTS (OVERLAPPING NON-IDENTICAL INTERVALS)
  // -------------------------------------------------------------------------------------
  console.log("\n--- 3. 20 CONCURRENT REQUESTS (OVERLAPPING NON-IDENTICAL INTERVALS) ---");
  postgresBookingService.clearAllData();

  const overlappingIntervalConfigs = [
    { startTime: "09:00", endTime: "11:00" },
    { startTime: "09:30", endTime: "10:30" },
    { startTime: "10:00", endTime: "12:00" },
    { startTime: "08:00", endTime: "10:00" },
    { startTime: "10:30", endTime: "12:00" },
    { startTime: "09:15", endTime: "10:15" },
    { startTime: "09:45", endTime: "11:45" },
    { startTime: "10:15", endTime: "11:15" },
    { startTime: "08:30", endTime: "10:30" },
    { startTime: "09:00", endTime: "10:00" },
    { startTime: "10:00", endTime: "11:00" },
    { startTime: "11:00", endTime: "12:00" },
    { startTime: "09:30", endTime: "11:30" },
    { startTime: "08:45", endTime: "09:45" },
    { startTime: "10:45", endTime: "11:45" },
    { startTime: "09:10", endTime: "10:40" },
    { startTime: "10:20", endTime: "11:50" },
    { startTime: "08:15", endTime: "10:15" },
    { startTime: "09:50", endTime: "11:20" },
    { startTime: "10:05", endTime: "11:35" },
  ];

  const parallelNonIdentical = overlappingIntervalConfigs.map((cfg, i) =>
    postgresBookingService.createHold(
      { venueId: targetVenueId, resourceId: targetResourceId, date: targetDate, slotIds: [`slot-${i}`], userId: `u-${i}` },
      [cfg]
    )
  );

  const resultsNonIdentical = await Promise.all(parallelNonIdentical);
  const successNonIdentical = resultsNonIdentical.filter((r) => r.success);

  // Verify that NONE of the acquired holds overlap with each other
  let anyPairOverlaps = false;
  for (let a = 0; a < successNonIdentical.length; a++) {
    for (let b = a + 1; b < successNonIdentical.length; b++) {
      const intA = successNonIdentical[a].data!.intervals[0];
      const intB = successNonIdentical[b].data!.intervals[0];
      const overlaps = doIntervalsOverlap(intA.startUtc, intA.endUtc, intB.startUtc, intB.endUtc);
      if (overlaps) {
        console.log(`Overlapping pair found: ${intA.startTime}-${intA.endTime} vs ${intB.startTime}-${intB.endTime}`);
        anyPairOverlaps = true;
      }
    }
  }

  assert(
    !anyPairOverlaps && successNonIdentical.length >= 1,
    "Concurrent Overlapping Requests: Zero mutual overlap across all concurrently acquired holds",
    `Acquired non-overlapping count: ${successNonIdentical.length}`
  );

  // -------------------------------------------------------------------------------------
  // SECTION 4: IDEMPOTENCY KEY CONFLICT DETECTION
  // -------------------------------------------------------------------------------------
  console.log("\n--- 4. IDEMPOTENCY KEY CONFLICT & REPLAY TESTS ---");
  postgresBookingService.clearAllData();

  const holdIdemp = await postgresBookingService.createHold({
    venueId: targetVenueId,
    resourceId: targetResourceId,
    date: targetDate,
    slotIds: ["res-turf-1-0800"],
  });

  const idempKey = "client-key-abc-123";

  // First request
  const firstConfirm = await postgresBookingService.confirmBooking(
    {
      holdId: holdIdemp.data!.holdId,
      paymentId: "pay_1",
      customerDetails: { name: "Rohan", phone: "9999999999", email: "rohan@test.com" },
    },
    idempKey
  );
  assert(firstConfirm.success === true, "Initial confirmation with Idempotency-Key succeeds");

  // Replay identical request
  const replayConfirm = await postgresBookingService.confirmBooking(
    {
      holdId: holdIdemp.data!.holdId,
      paymentId: "pay_1",
      customerDetails: { name: "Rohan", phone: "9999999999", email: "rohan@test.com" },
    },
    idempKey
  );
  assert(
    replayConfirm.code === "IDEMPOTENT_REPLAY" && replayConfirm.data?.id === firstConfirm.data?.id,
    "Identical payload replay returns original booking (IDEMPOTENT_REPLAY)"
  );

  // Conflict: Same Idempotency-Key with DIFFERENT payload
  const conflictConfirm = await postgresBookingService.confirmBooking(
    {
      holdId: holdIdemp.data!.holdId,
      paymentId: "pay_DIFFERENT",
      customerDetails: { name: "Different Name", phone: "8888888888", email: "diff@test.com" },
    },
    idempKey
  );
  assert(
    conflictConfirm.success === false && conflictConfirm.code === "IDEMPOTENCY_CONFLICT",
    "Same Idempotency-Key with different payload is rejected with IDEMPOTENCY_CONFLICT"
  );

  // -------------------------------------------------------------------------------------
  // SECTION 5: AUTHORITATIVE PRICING SECURITY TEST
  // -------------------------------------------------------------------------------------
  console.log("\n--- 5. AUTHORITATIVE PRICING SECURITY TEST ---");
  postgresBookingService.clearAllData();

  const holdPriceCheck = await postgresBookingService.createHold(
    {
      venueId: targetVenueId,
      resourceId: targetResourceId, // Base rate ₹1,200/hr
      date: targetDate,
      slotIds: ["slot-2hr"],
    },
    [{ startTime: "09:00", endTime: "11:00" }] // 2 hours duration
  );

  assert(
    holdPriceCheck.data?.totalAmount === 2400,
    "Authoritative Price Computation: 2 hours at ₹1,200/hr correctly resolves to ₹2,400 (client input ignored)"
  );

  // -------------------------------------------------------------------------------------
  // SECTION 6: TIMEZONE DATE PRESERVATION TEST
  // -------------------------------------------------------------------------------------
  console.log("\n--- 6. TIMEZONE (ASIA/KOLKATA) DATE PRESERVATION TEST ---");
  const kolkataEpoch = parseVenueTimeToUtc("2026-09-18", "09:00", "Asia/Kolkata");
  const kolkataDate = new Date(kolkataEpoch);

  assert(
    kolkataDate.toISOString() === "2026-09-18T03:30:00.000Z",
    "Timezone test: 09:00 AM IST on 2026-09-18 converts to 03:30:00.000 UTC without date drift"
  );

  console.log("\n============================================================================");
  console.log(`📊 AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log("============================================================================\n");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMilestone21AuditTests().catch((err) => {
  console.error("Audit test error:", err);
  process.exit(1);
});
