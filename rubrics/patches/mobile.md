# Role patch — Mobile

The candidate designed and built a native or cross-platform mobile experience. They chose the platform and documented their approach. Score the mobile experience — platform conventions, data layer decisions, and state handling.

## Decision Quality — role-specific guidance

**Constraint fidelity:** Verify platform conventions are respected — navigation patterns, touch target sizes, back behaviour, and lifecycle handling appropriate to the chosen platform. Verify monetary values are treated as integers if present.

**Scope judgment:** The candidate chose a platform and justified it in the README. Penalise candidates who chose a platform without documenting the reasoning, or who built complexity beyond what the task requires. A working, platform-appropriate experience is the goal.

**Trade-off response:** The candidate made one explicit decision. Score whether it is implemented consistently throughout the mobile experience.

## Build Integrity — role-specific guidance

**Seam consistency:** Data fetching, state management, and UI rendering should be appropriately separated. Business logic should not live in view components or screen files.

**Proportional complexity:** No unnecessary navigation stacks, local databases, or authentication layers unless the task required them. Penalise over-engineering. Reward a lean, well-structured mobile experience.

**Edge case awareness:** Loading states, error states, empty states, and network failure states must all be handled. Touch targets must be large enough to be usable. The experience must be functional without a physical keyboard.

## Ownership — role-specific guidance

**README ownership:** Must document the platform choice and the reasoning behind it, exact run commands (including any simulator or device requirements), and the trade-off decision with reasoning specific to this submission.

**Git narrative:** Should show incremental feature work — navigation structure before content, content before edge cases. A single commit is a red flag.

**Absence acknowledgment:** If the candidate scoped out any planned screens or features, they should document the decision.
