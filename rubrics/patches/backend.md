# Role Patch — Backend Engineer

This patch extends the base rubric for backend submissions. Read the base rubric first.

---

## Domain vocabulary examples

Generic (lower score) → domain-aligned (higher score):
- `createItem` → `recordTransaction`, `logPayment`, `registerOrder`
- `getData` → `fetchTransactionHistory`, `getPaymentActivity`
- `status` as unconstrained string → typed with the domain's actual status values
- `processRequest` → `settlePayment`, `flagFailedTransaction`
- Table named `items` → `transactions`, `payments`, `orders`
- `handleError` → `rejectInvalidPayment`, `flagDuplicateSubmission`

---

## Edge case awareness — backend-specific

Check these in addition to the universal edge cases:

- What happens when a required field is missing from the request body? Does the server crash or return a descriptive 400?
- What happens when a numeric field receives a string, a float, or a negative value?
- What happens when a filter parameter receives an invalid value?
- What happens when pagination parameters are out of range — page=0, page=-1, limit=0, limit=99999?
- What happens when the requested resource does not exist — is the 404 response shape consistent with other error shapes?
- Does seed data include edge case values — zero amounts, null optional fields, boundary pagination values?

---

## Git narrative — expected organic sequence

For a backend submission: schema first, then routes, then validation, then error handling, then documentation. Deviation without explanation is a signal worth noting.

---

## Hard fails — backend additions

These are added to the universal hard fails. Any one triggers REQUEST_CHANGES immediately.

- Monetary amounts stored as floats
- SQL queries built by string concatenation (injection risk)
- Server crashes on invalid input instead of returning a descriptive error response
- Passwords stored in plain text or hashed with a non-purpose-built algorithm (MD5, SHA-256)
- JWT validation that does not check token expiry (if auth is implemented)
- Duplicate detection handled only in application code with no database-level unique constraint (if deduplication is required)

---

## Scored deductions — backend additions

Flag as inline comments, not hard fails:

- Missing schema-level constraints (NOT NULL, CHECK) where the application enforces them — deduct under 2.1 Seam Consistency
- Page or limit parameters not clamped to valid range — deduct under 2.4 Edge Case Awareness
- Port or database URL hardcoded instead of externalised via environment variable — deduct under 1.2 Scope Judgment
- Inconsistent error response shapes across routes — deduct under 2.1 Seam Consistency
- created_at or timestamp fields stored as TEXT when a proper date type is available — deduct under 2.1 Seam Consistency
