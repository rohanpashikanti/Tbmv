-- PostgreSQL Range Overlap Exclusion Constraint Migration
-- Ensures TWO BOOKINGS CAN NEVER OVERLAP FOR THE SAME RESOURCE AT THE DATABASE ENGINE LEVEL

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Alter table to add exclusion constraint using half-open timestamp range [startUtc, endUtc)
-- If two rows have the same resourceId and their [startUtc, endUtc) intervals overlap (&&),
-- PostgreSQL rejects the insert/update with SQLSTATE 23P01 (exclusion_violation).

ALTER TABLE "BookingItem"
ADD CONSTRAINT "no_overlapping_resource_bookings"
EXCLUDE USING gist (
  "resourceId" WITH =,
  tsrange("startUtc", "endUtc", '[)') WITH &&
);
