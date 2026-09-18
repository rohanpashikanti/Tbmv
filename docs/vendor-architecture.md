# TheBookMyVenues — Vendor Operations Architecture

## 1. System Overview
The Vendor Operations Hub (`/vendor`) provides facility partners with a high-density, real-time operating interface. It shares the same underlying PostgreSQL inventory and Redis hold system as the customer platform to prevent double-booking.

## 2. Key Modules
- **Live Calendar**: Vertical hourly matrix (06:00 to 23:00) showing real-time resource occupancy (`Available`, `Booked`, `Held`, `Blocked`) synced via Server-Sent Events (`useAvailabilitySSE`).
- **Unified Slot Blocker**: Enables maintenance blackouts, offline bookings, or private event blocks. Every block enforces the database GiST range exclusion constraint against competing customer bookings.
- **Manual Bookings**: Allows counter staff to input phone/walk-in reservations while enforcing identical inventory overlap protections.
- **Check-In Verification**: Scan or input booking reference passes (`TBV-XXXXXX`) to transition bookings from `CONFIRMED` $\to$ `CHECKED_IN` $\to$ `COMPLETED` with duplicate check-in prevention.
- **Dynamic Pricing Engine**: Configure seasonal, weekend, or prime-time pricing rules with deterministic precedence.
