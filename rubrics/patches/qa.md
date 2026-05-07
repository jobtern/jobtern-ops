# Role Patch — QA / Test Engineer

This patch extends the base rubric for QA submissions. Read the base rubric first.

A QA submission is a test suite written against a provided or candidate-defined codebase. The primary deliverable is not working software — it is a test suite that reveals how the candidate thinks about quality, coverage, and failure.

The key signal inversion for QA: absence of tests is the equivalent of absence of features for other roles. What the candidate chose to test — and what they chose not to test — is the primary scoring surface.

---

## Domain vocabulary examples

Generic (lower score) → domain-aligned (higher score):
- `testCreate` → `testTransactionIsRecordedWithCorrectAmount`, `testPaymentFailsWhenAmountIsNegative`
- `handleError` → `assertInvalidStatusRejected`, `verifyDuplicateTransactionBlocked`
- `testData` → `pendingTransaction`, `failedPaymentWithZeroAmount`, `completedCreditWithNullDescription`
- `it('works')` → `it('returns 404 when transaction does not exist')`
- `mockData` → domain-specific fixtures named after the scenario they represent

---

## Edge case awareness — QA-specific

Check these in addition to the universal edge cases:

- Do the tests cover the explicitly stated constraints from the task — not just the happy path?
- Do the tests cover at least one boundary value — zero, null, maximum, minimum?
- Do the tests cover failure cases — not just success cases?
- Is the test data representative — does it include edge case values, or is every fixture clean and complete?
- Do the tests verify behaviour, not implementation — are they testing what the system does, not how it does it?
- Are there tests that would catch the discipline traps specified in the task?

---

## Git narrative — expected organic sequence

For a QA submission: setup and fixture design first, then tests for core behaviour, then tests for constraints and edge cases, then tests for failure modes. A history where all edge case tests appear in the first commit is suspicious.

---

## Hard fails — QA additions

These are added to the universal hard fails. Any one triggers REQUEST_CHANGES immediately.

- Test suite does not run or has failing tests that are not acknowledged
- No tests cover the explicitly stated constraints from the task
- All tests use identical, clean fixture data with no edge case values
- Tests verify implementation details (internal function calls, private state) rather than observable behaviour
- No failure case tests — every test assumes the system works correctly

---

## Scored deductions — QA additions

Flag as inline comments, not hard fails:

- Tests named after implementation rather than behaviour — `testInsertFunction` vs `testTransactionIsPersistedCorrectly` — deduct under 2.2 Domain Vocabulary
- Test data that mirrors the happy path only — no nulls, no zeros, no boundary values — deduct under 2.4 Edge Case Awareness
- Tests that duplicate coverage without adding new scenarios — deduct under 1.2 Scope Judgment
- Assertions that are too broad — `assert response is not None` instead of asserting the specific expected value — deduct under 2.1 Seam Consistency
- Setup or teardown logic duplicated across test files instead of extracted to fixtures — deduct under 2.3 Proportional Complexity
