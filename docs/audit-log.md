# TheBookMyVenues — Audit Trail Model

## 1. Audit Logging Invariant
Every sensitive administrative or operational mutation produces an immutable audit log entry containing:
- `actorId`: ID of the user triggering the action
- `actorRole`: `CUSTOMER`, `VENDOR`, `ADMIN`, or `SYSTEM`
- `action`: Specific operation performed (e.g. `SLOT_BLOCKED`, `VENUE_PUBLISHED`, `COMMISSION_RATE_UPDATED`, `ADMIN_REFUND_EXECUTED`)
- `targetId`: Entity identifier (e.g. resource, venue, booking)
- `targetType`: `VENUE`, `RESOURCE`, `BOOKING`, `PRICING`, `COMMISSION`, `VENDOR`, `SLOT_BLOCK`
- `metadata`: Relevant parameters (amounts, reasons, rates)
- `timestamp`: Canonical ISO-8601 UTC timestamp
