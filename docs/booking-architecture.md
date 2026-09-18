# Booking Engine Architecture & Double-Booking Invariants

## Core Principle
**TWO CUSTOMERS CAN NEVER SUCCESSFULLY BOOK THE SAME RESOURCE + TIME RANGE.**

The Database is the authoritative final source of truth. Redis provides low-latency atomic temporary holds (10-minute TTL), and Server-Sent Events (SSE) propagate real-time inventory updates across connected clients.

---

## Architecture Diagram

```mermaid
sequenceDiagram
    autonumber
    actor CustomerA as Customer A
    actor CustomerB as Customer B
    participant Redis as Redis (SET NX EX)
    participant PG as PostgreSQL (ACID Tx)
    participant SSE as Real-time Event Bus
    actor OtherClients as Other Customers

    Note over CustomerA,CustomerB: Both attempt to hold Turf #01 at 09:00
    CustomerA->>Redis: POST /api/bookings/hold (res-1, 09:00)
    CustomerB->>Redis: POST /api/bookings/hold (res-1, 09:00)
    Redis-->>CustomerA: Lock Acquired (Hold created, 10m TTL)
    Redis-->>CustomerB: Lock Contested (409 SLOT_ALREADY_HELD)
    SSE-->>OtherClients: Broadcast slot.held (res-1, 09:00)

    CustomerA->>PG: POST /api/bookings/confirm (with Idempotency-Key)
    critical PostgreSQL Transaction
        PG->>PG: Verify Hold Not Expired (expiresAt > NOW())
        PG->>PG: Check Unique Overlap Constraint (resourceId + date + startTime)
        PG->>PG: Calculate Authoritative Server Price
        PG->>PG: Insert Booking & BookingItem
        PG->>PG: Mark Hold CONSUMED
    end
    PG-->>CustomerA: 200 OK (Booking Confirmed)
    SSE-->>OtherClients: Broadcast slot.booked (res-1, 09:00)
```

---

## The 10 Critical Database Invariants

1. **Overlap Exclusion:** One resource cannot have overlapping confirmed bookings (enforced via database unique constraint on `[resourceId, date, startTime, endTime]`).
2. **Hold Expiry Safety:** An expired hold cannot transition into a confirmed booking.
3. **Verified Payment:** A booking cannot be confirmed without a verified payment record or authorized webhook.
4. **Webhook Idempotency:** A payment webhook event cannot be processed twice (`ProcessedWebhookEvent` table).
5. **Idempotency Key Deduplication:** An `Idempotency-Key` prevents duplicate charges and replays the original confirmation result.
6. **Authoritative Pricing:** Client-submitted prices are never trusted. The backend computes prices from authoritative `Venue` & `VenueResource` rates.
7. **Redis Failure Resilience:** If Redis crashes or fails, PostgreSQL ACID locks still prevent double-booking.
8. **SSE Failure Resilience:** If SSE disconnects, database read queries reflect current authoritative state on next load.
9. **Multi-Slot Atomicity:** Multi-slot bookings are all-or-nothing transactions; either all slots succeed or none are booked.
10. **Multi-Resource Isolation:** Booking one resource (e.g. *Turf #01*) never blocks another resource (*Turf #02*) at the same venue.
