# Role patch — Frontend

The candidate consumed a real public API and built a rich UI around it. They did not build a backend. Score accordingly — the UI is the entire deliverable.


## Decision Quality — role-specific guidance

**Constraint fidelity:** Check that monetary values (if present) are treated as integers for arithmetic and converted for display in one place only. Verify the candidate read the actual API response shape and built against what the API returns, not an assumed shape.

**Scope judgment:** The candidate should not have built a backend. If a local server exists, check whether it was necessary. A public API was provided — any backend layer beyond what the framework requires is likely over-engineering.

**Trade-off response:** The candidate made one explicit product decision. Score whether the decision is implemented consistently across every relevant surface — not just the obvious one.


## Build Integrity — role-specific guidance

**Seam consistency:** API data transformations (field renaming, flattening, filtering) should happen in one place, not scattered across components.

**Domain vocabulary:** Component names, variable names, and function names should reflect the task domain — not generics like `Item`, `Card`, or `data`.

**Proportional complexity:** A frontend-only task should not have a custom server, a database, or unnecessary abstractions. Penalise over-engineering. Reward lean, readable code.

**Edge case awareness:** Loading, error, and empty states must be handled on every data-fetching surface. All interactive elements must be keyboard-navigable with visible focus indicators. Images must have meaningful alt text — not "image" or an empty string.


## Ownership — role-specific guidance

**README ownership:** Must document the data shape built against (what fields were used from the API response), the trade-off decision and reasoning, and exact run commands. A README that could describe any project is a signal failure.

**Git narrative:** Should show incremental UI work — layout before interactivity, interactivity before edge cases. A single commit containing everything is a red flag.

**Absence acknowledgment:** If the candidate excluded certain API fields or simplified the data model, they should say so and explain why.