# Role patch — Backend

The candidate designed and built an API from scratch — schema, data model, business logic, and contract. They included a minimal frontend to demonstrate the API works. Score the API. The frontend is not evaluated beyond "does it demonstrate the API."


## Decision Quality — role-specific guidance

**Constraint fidelity:** Check that monetary values are stored as integers at the database level — not just handled correctly in application code. Verify server-side pagination is enforced at the query level. Verify financial aggregations are computed at the data layer, not in application memory or on the client.

**Scope judgment:** The frontend should be minimal — enough to show the API works, no more. Significant UI investment at the expense of API depth is a scope failure. A polished frontend with a shallow API is penalised.

**Trade-off response:** The candidate made one explicit architectural or data decision. Score whether the decision is implemented consistently throughout the API — not just at one endpoint.


## Build Integrity — role-specific guidance

**Seam consistency:** Request validation, business logic, and data access should be appropriately separated. An endpoint that mixes SQL queries with response formatting in the same function is a seam failure.

**Domain vocabulary:** Table names, column names, endpoint paths, and variable names should reflect the task domain consistently. Inconsistency between the schema and the API contract is penalised.

**Proportional complexity:** No full frontend framework, CSS animations, or UI components beyond basic HTML. Penalise scope creep into the UI layer. Reward a lean, well-structured API.

**Edge case awareness:** Invalid input must return descriptive error responses with appropriate status codes. Missing or null fields must be handled gracefully. Pagination edge cases (page beyond total, zero limit) must be handled.


## Ownership — role-specific guidance

**README ownership:** Must document every endpoint — path, method, accepted parameters, and response shape. Run commands must include database setup and seeding. The trade-off decision must be explained with reasoning specific to this submission.

**Git narrative:** Should show schema-first progression — schema before routes, routes before business logic, business logic before edge cases. A single commit is a red flag.

**Absence acknowledgment:** If the candidate simplified the schema or left an endpoint unimplemented, they should document it and explain the scope decision.
