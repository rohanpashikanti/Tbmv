# TheBookMyVenues — Deterministic Dynamic Pricing Engine

## 1. Pricing Hierarchy & Precedence
When determining the authoritative hourly rate for a resource at a given date and time, the backend evaluates active rules matching the time window and selects the highest-priority rule according to this strict deterministic hierarchy:

1. **SPECIAL_DATE** (Priority 50): Specific date holidays or local tournament days.
2. **SEASONAL** (Priority 40): Multi-week or multi-month seasonal adjustments (e.g. Monsoon or Summer discounts).
3. **WEEKEND** (Priority 30): Saturday and Sunday prime rates (`dayOfWeek: [0, 6]`).
4. **PEAK_OFFPEAK** (Priority 20): Daily time-of-day surge (e.g. Evening Floodlight Prime `18:00 - 23:00`).
5. **BASE_RATE** (Priority 10): Standard weekday resource hourly baseline.

## 2. Immutability of Historical Transactions
When a vendor adds or updates a pricing rule:
- Future customer slot queries and availability calculations immediately reflect the new rate.
- Historical confirmed bookings store the authoritative snapshot amount computed at the time of reservation and are never retroactively recalculated.
