# Role patch — Fullstack (Frontend-heavy)

The candidate built a real API that consumes a public API, transforms or extends the data, and exposes it to their own UI. The backend is lean — a transformation layer. The UI is the primary deliverable. Score both halves, but weight the UI more heavily.


## Decision Quality — role-specific guidance

**Constraint fidelity:** Verify the backend API layer is real — not a passthrough proxy and not a client-side fetch with a thin wrapper. The candidate should make at least one meaningful transformation decision at the API layer. Verify monetary values are treated as integers if present.

**Scope judgment:** The backend should be lean. A full database with complex schema and multiple data models is over-engineering for this track — the public API is the data source. A rich, accessible UI is expected. A basic HTML list for the UI is under-delivering.

**Trade-off response:** The candidate made one explicit decision. Score whether it is implemented consistently across both the API layer and the UI — not just one side.


## Build Integrity — role-specific guidance

**Seam consistency:** Data transformations should happen at the backend layer, not in UI components. The boundary between the public API, the candidate's backend, and the UI should be coherent and intentional.

**Edge case awareness:** Both layers must handle edge cases. The API layer must handle upstream failures and empty responses. The UI must handle loading, error, and empty states — plus keyboard accessibility and meaningful image alt text where applicable. Penalise candidates who handle one layer but not the other.

**Proportional complexity:** Backend should be lean — a transformation layer, not a platform. UI should be rich — not a list of text. Both halves must be proportional to their role.


## Ownership — role-specific guidance

**README ownership:** Must document the backend API contract (endpoints, params, responses) and note which public API fields were used and which were ignored. The trade-off decision must be explained. Run commands must start both the backend and the frontend.

**Git narrative:** Should show layer-by-layer progression — backend transformation layer before UI, UI structure before interactivity and edge cases.

**Absence acknowledgment:** If the candidate chose to ignore certain upstream API fields, they should document that decision and explain why.