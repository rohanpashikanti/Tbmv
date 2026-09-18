# Concurrency & Invariant Testing Suite

## Test Execution
To run the automated concurrency test suite:
```bash
npx tsx tests/concurrency-test.ts
```

## Test Cases Covered

1. **20 Concurrent Slot Holds (Race Condition):** 20 parallel async requests attempting to hold the same slot at the same second.
   - **Result:** Exactly 1 user acquires the hold; 19 competing users are rejected with `SLOT_ALREADY_HELD` / `SLOT_UNAVAILABLE`.
2. **Double-Booking Rejection:** Subsequent hold/confirmation attempts on an already confirmed slot are blocked by database exclusion constraints.
3. **Idempotency Key Deduplication:** Repeated requests with the same `Idempotency-Key` return identical booking metadata without creating duplicate records.
4. **Multi-Resource Independence:** Locking `Turf #01` at 09:00 leaves `Turf #02` open for concurrent reservation.
5. **Decoupled Payment Webhook Idempotency:** Duplicate webhook events are safely ignored without re-triggering transactions.
6. **Expired Hold Rejection:** Holds that exceed their 10-minute TTL are rejected on confirmation attempts with `HOLD_EXPIRED`.
