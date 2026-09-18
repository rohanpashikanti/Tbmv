# TheBookMyVenues — Financial & Payout Ledger Model

## 1. Versioned Commission Calculation
- Platform commissions are recorded as an explicit percentage against each booking transaction at confirmation time:
  $$\text{Platform Fee} = \text{round}(\text{Gross Amount} \times \text{Commission Rate})$$
  $$\text{Taxes (GST 18\%)} = \text{round}(\text{Platform Fee} \times 0.18)$$
  $$\text{Net Vendor Payable} = \text{Gross Amount} - \text{Platform Fee}$$

## 2. Ledger Immutability
- Updating the global platform commission (e.g. from 5.0% to 10.0%) only affects future bookings.
- Existing ledger entries are immutable.
- Refunds create explicit `REFUND_ADJUSTED` ledger records rather than mutating original transaction rows.
