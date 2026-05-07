# Role Patch — Frontend Engineer

This patch extends the base rubric for frontend submissions. Read the base rubric first.

---

## Domain vocabulary examples

Generic (lower score) → domain-aligned (higher score):
- `DataList` → `TransactionFeed`, `PaymentActivity`, `OrderHistory`
- `ItemCard` → `TransactionRow`, `PaymentEntry`, `OrderSummary`
- `handleData` → `loadTransactions`, `fetchPaymentActivity`
- `status` as unconstrained string → typed with the domain's actual status values
- `updateStatus` → `markTransactionComplete`, `flagPaymentFailed`

---

## Edge case awareness — frontend-specific

Check these in addition to the universal edge cases:

- What happens when a field that should be present is null or undefined? Does the UI crash, display raw null, or handle it gracefully?
- What happens when a numeric field is zero? Is `0` treated as falsy and incorrectly hidden or replaced?
- What happens when an error occurs on a subsequent request, not just the initial load? Is error state only wired to mount?
- What happens when a filter combination returns an empty dataset? Is there a visible empty state?
- What happens when a text field contains special characters or an unusually long string?
- Does mock or seed data include edge case values — zero amounts, null descriptions, failed records?

---

## Git narrative — expected organic sequence

For a frontend submission: data layer and mock setup first, then core display, then interactivity (filters, pagination), then states (loading, error, empty), then polish. Deviation without explanation is a signal.

---

## Hard fails — frontend additions

These are added to the universal hard fails. Any one triggers REQUEST_CHANGES immediately.

- Loading and error states completely absent — UI assumes the happy path always succeeds
- Hardcoded data in the UI that should come from the data source
- Client-side pagination — fetching all records and slicing in the browser
- Client-side aggregation — computing summary totals by summing a fetched list instead of calling an aggregate source

---

## Scored deductions — frontend additions

Flag as inline comments, not hard fails:

- Bounded client-side aggregation (e.g. fetching a large limit to sum values) — deduct under 1.1 Constraint Fidelity
- Missing empty state — deduct under 2.4 Edge Case Awareness
- Dynamic values rendered via innerHTML with unsanitised data — deduct under 2.3 Proportional Complexity
- API base URL hardcoded instead of externalised — deduct under 1.2 Scope Judgment
- Inconsistent error handling shapes across fetch calls — deduct under 2.1 Seam Consistency
