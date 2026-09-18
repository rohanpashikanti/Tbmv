# TheBookMyVenues — Admin Command Center Architecture

## 1. Overview
The Admin Command Center (`/admin`) delivers superadmin observability and governance over platform vendors, venues, bookings, payments, and commission rates.

## 2. Governance Capabilities
- **Vendor Onboarding & KYC**: Verification workflow (`PENDING`, `APPROVED`, `SUSPENDED`, `REJECTED`).
- **Venue Moderation**: Platform-wide listing review, publishing, and pause actions.
- **Controlled Administrative Refunds**: Secure refund execution that atomically marks payments/bookings as `REFUNDED`, releases the underlying inventory intervals, and records ledger adjustments.
- **Platform Analytics**: Factual KPI metrics (GMV, booking volume, average transaction size, payment success rate) and an interactive Day $\times$ Hour slot utilization heatmap.
- **Audit Logging**: Mandatory immutable trail capturing actor, role, action, target, and timestamp for all sensitive administrative actions.
