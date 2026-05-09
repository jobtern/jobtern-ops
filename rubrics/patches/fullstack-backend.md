# Role patch — Fullstack (Backend-heavy)

The candidate designed and built an API from scratch and a basic UI that consumes it. Both halves are present. The backend is the primary deliverable — score it with the same rigour as a backend-only task. The UI is not evaluated beyond "does it consume the API correctly and function."


## Decision Quality — role-specific guidance

**Constraint fidelity:** Apply all backend constraint checks — monetary integers at the database level, server-side pagination at the query level, aggregations at the data layer. These are hard requirements regardless of UI quality.

**Scope judgment:** The backend must have full rigour. The UI should be functional — not polished. Significant UI investment at the expense of backend depth is a scope failure. Strong backend with a basic but correct UI is the expected shape.

**Trade-off response:** The candidate made one explicit decision. Score whether it is implemented consistently throughout both the API and the UI that consumes it.


## Build Integrity — role-specific guidance

Apply all backend Build Integrity checks. Additionally:

**Seam consistency:** The UI must consume the candidate's own API — not bypass it with direct database access or hardcoded data. The integration between frontend and backend must be real.

**Proportional complexity:** Backend should have full rigour — schema, validation, error handling, pagination. UI should be proportional to "basic" — enough to demonstrate the API, not a full product. Penalise a polished UI built at the expense of backend depth.


## Ownership — role-specific guidance

**README ownership:** Must document every API endpoint with full detail. Frontend run instructions must reference the backend — they should not be independently runnable. The trade-off decision must be explained with reasoning specific to this domain.

**Git narrative:** Should show backend-first progression — schema and routes before UI. UI commits appearing before the backend is stable is a scope judgment signal.

**Absence acknowledgment:** If the candidate left any planned endpoint unimplemented or simplified the UI beyond "basic," they should document it.