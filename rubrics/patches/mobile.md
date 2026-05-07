# Role Patch — Mobile Engineer

This patch extends the base rubric for mobile submissions. Read the base rubric first.

Applies to: React Native, Flutter, Swift (iOS), Kotlin/Java (Android), and any other mobile stack.

---

## Domain vocabulary examples

Generic (lower score) → domain-aligned (higher score):
- `DataScreen` → `TransactionHistoryScreen`, `PaymentActivityView`
- `ItemCell` → `TransactionCell`, `PaymentRow`
- `handleTap` → `selectTransaction`, `openPaymentDetail`
- `status` as unconstrained string → typed with the domain's actual status values
- `getData` → `loadTransactionHistory`, `fetchPaymentActivity`

---

## Edge case awareness — mobile-specific

Check these in addition to the universal edge cases:

- What happens when the device loses network connectivity mid-session? Is there a visible offline state or does the app silently fail?
- What happens when the list is empty after filtering? Is there a visible empty state?
- What happens when a numeric value is zero — is it rendered correctly or treated as falsy and hidden?
- What happens when a text field contains an unusually long string — does it overflow or truncate gracefully?
- Does the submission handle loading state on the initial fetch and on subsequent fetches (e.g. pagination, pull-to-refresh)?
- Does mock or seed data include edge case values?

---

## Git narrative — expected organic sequence

For a mobile submission: data layer and service/repository setup first, then core screen, then state management, then edge states (loading, error, empty), then navigation and polish. Deviation without explanation is a signal.

---

## Hard fails — mobile additions

These are added to the universal hard fails. Any one triggers REQUEST_CHANGES immediately.

- Loading and error states completely absent — app assumes the happy path always succeeds
- Hardcoded API base URL or credentials in source code
- Client-side pagination — fetching all records and slicing locally
- Monetary amounts stored or computed as floats (if the task involves monetary values)
- Network request made on the main/UI thread without async handling (where applicable to the stack)

---

## Scored deductions — mobile additions

Flag as inline comments, not hard fails:

- Missing empty state — deduct under 2.4 Edge Case Awareness
- No offline or connectivity error handling — deduct under 2.4 Edge Case Awareness
- API base URL or environment config hardcoded — deduct under 1.2 Scope Judgment
- Inconsistent error handling across different network calls — deduct under 2.1 Seam Consistency
- UI state not reset when navigating back and forth — deduct under 2.4 Edge Case Awareness
