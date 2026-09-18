# Database Schema & Data Models

## Prisma Schema Overview

The database is designed around **Venue Resources as the unit of inventory**, not the Venue itself.

### Key Models & Relationships

* **`Venue`**: Contains physical address, neighborhood, city, rating, photos, and timezone (`Asia/Kolkata`).
* **`VenueResource`**: The bookable entity (e.g. `Turf #01`, `Platinum 4K Screen`, `PS5 Pod #03`).
* **`ResourceSlot`**: Pre-generated or dynamic time interval with pricing.
* **`BookingHold`**: Durable 10-minute hold record synchronized with Redis locks.
* **`Booking`**: Authoritative reservation header with customer details, total amount, and status.
* **`BookingItem`**: Child item enforcing `@@unique([resourceId, date, startTime, endTime])` constraint.
* **`Payment`**: Financial transaction record decoupled from booking status (`CREATED`, `PENDING`, `AUTHORIZED`, `CAPTURED`, `FAILED`).
* **`IdempotencyRecord`**: Caches responses for client-generated `Idempotency-Key` headers.
* **`ProcessedWebhookEvent`**: Prevents duplicate webhook execution.

---

### Overlap Exclusion Constraint

```prisma
model BookingItem {
  id          String        @id @default(uuid())
  bookingId   String
  resourceId  String
  date        String        // YYYY-MM-DD
  startTime   String        // HH:mm
  endTime     String        // HH:mm
  price       Decimal       @db.Decimal(10, 2)

  // CRITICAL DATABASE EXCLUSION CONSTRAINT
  @@unique([resourceId, date, startTime, endTime])
}
```
