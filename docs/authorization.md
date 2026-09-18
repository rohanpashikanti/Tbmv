# TheBookMyVenues — Authorization & Security Model

## 1. Roles & Permissions
- **CUSTOMER**: Access restricted strictly to own profile, own bookings, own payments, and own cancellations.
- **VENDOR**: Access restricted to vendor-owned venues, resources, availability, bookings, pricing, and revenue.
- **ADMIN**: Platform-wide permissions for venue moderation, vendor KYC, commission updates, dispute refunds, and global analytics.

## 2. Server-Side Enforcement
- Every mutation endpoint (`/api/vendor/*`, `/api/admin/*`, `/api/bookings/*`) verifies caller identity and role context server-side.
- Client-submitted IDs (`venueId`, `resourceId`, `bookingId`) are checked against vendor ownership records before processing.
