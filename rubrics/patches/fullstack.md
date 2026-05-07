# Role Patch — Fullstack Engineer

This patch extends the base rubric for fullstack submissions. Read the base rubric first.

---

## Additional reviewer instruction

For a fullstack submission, the seam between the candidate's own frontend and backend is the primary signal in Pillar 2. The candidate designed both sides — there is no excuse for the contract to be inconsistent. Check this boundary rigorously.

---

## Domain vocabulary examples

Check consistency across both layers. The same business concept must be named the same way in the schema, API routes, response shapes, frontend state, and UI layer.

Generic (lower score) → domain-aligned (higher score):
- `items` table → `transactions`, `payments`, `orders`
- `getData` → `fetchTransactionHistory`, `getPaymentActivity`
- `ItemCard` component → `TransactionRow`, `PaymentEntry`
- Same concept named differently across layers → consistent naming throughout

---

## Edge case awareness — fullstack-specific

Check these in addition to the universal edge cases:

Backend side:
- What happens when a required field is missing from the request body?
- What happens when a numeric field receives a float or negative value?
- What happens when pagination parameters are out of range?

Frontend side:
- What happens when a field that should be present is null?
- What happens when a numeric field is zero?
- What happens when a request fails mid-session, not just on initial load?
- What happens when a filter combination returns an empty dataset?

Cross-layer:
- Does the frontend gracefully handle every error shape the backend can produce?
- Do the type definitions on both sides agree on the same fields and value constraints?
- Does seed data include edge case values?

---

## Git narrative — expected organic sequence

For a fullstack submission: schema first, then backend routes, then frontend consuming the API. Frontend commits appearing before the backend they depend on is a signal worth noting.

---

## Hard fails — fullstack additions

These are added to the universal hard fails. Any one triggers REQUEST_CHANGES immediately.

Backend layer:
- Monetary amounts stored as floats
- SQL queries built by string concatenation
- Server crashes on invalid input instead of returning a descriptive error response
- Passwords stored in plain text or hashed with a non-purpose-built algorithm (if auth implemented)
- JWT validation that does not check token expiry (if auth implemented)

Frontend layer:
- Loading and error states completely absent
- Hardcoded data in the UI that should come from the API
- Client-side pagination — fetching all records and slicing in the browser
- Client-side aggregation — computing totals by summing a fetched list

---

## Scored deductions — fullstack additions

Flag as inline comments, not hard fails:

- Missing schema-level constraints — deduct under 2.1 Seam Consistency
- Bounded client-side aggregation — deduct under 1.1 Constraint Fidelity
- Missing empty state on the frontend — deduct under 2.4 Edge Case Awareness
- Inconsistent error shapes across fetch calls — deduct under 2.1 Seam Consistency
- Port, database URL, or API base URL hardcoded — deduct under 1.2 Scope Judgment
- Type definitions on frontend and backend that disagree on the same field — deduct under 2.1 Seam Consistency
