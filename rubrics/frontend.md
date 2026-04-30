# Review Context — Frontend Engineer

## Role
Frontend Engineer

## What this assessment is testing

- Can the candidate translate a requirement into a working, usable interface?
- Do they handle loading, error, and empty states — not just the happy path?
- Is their component structure logical and easy for a teammate to navigate?
- Do they make sound decisions about state, side effects, and data flow?
- Does their code reflect an understanding of how the browser actually works?
- Is their work accessible and resilient, not just visually correct?

---

## Task breakdown

<!-- Paste the active task variant here before injecting this file as a secret -->
<!-- Include: what was asked, key constraints, and any domain-specific traps -->

---

## Hard fails — REQUEST_CHANGES immediately if any apply

- Loading and error states are completely absent — UI assumes the happy path always succeeds
- Direct DOM manipulation inside a component framework without justification
- Hardcoded data in the UI that should be driven by props, state, or an API response
- `useEffect` with a missing or incorrect dependency array causing infinite loops or stale closures
- Inline styles used wholesale instead of a consistent styling approach
- No keyboard navigability on interactive elements (buttons, inputs, modals)
- Single commit, or all commits are "fix", "update", "wip", "initial commit"
- README is missing, empty, or contains no runnable setup instructions

---

## What a strong submission looks like

**Correctness**
- All stated UI requirements are implemented and functional
- Loading, error, and empty states are handled and visible to the user
- Data flow is unidirectional and predictable — no hidden side effects
- Forms validate input before submission and communicate errors clearly
- Component renders correctly across reasonable viewport sizes

**Craft**
- Components are small, focused, and named after what they do
- State is kept as close to where it's needed as possible — not hoisted unnecessarily
- No unnecessary re-renders from poorly scoped state or missing memoisation
- CSS is structured and consistent — not a patchwork of overrides
- "One thing I'd do differently with more time" is specific and honest, not generic

**Communication**
- PR description answers all template questions with substance
- Assumptions about design or behaviour are listed clearly
- The "anything else" field is used when genuinely relevant, left blank when not

---

## Scoring output format

Return only a JSON object. No prose, no markdown fences, nothing outside the JSON.

{
  "verdict": "APPROVE" or "REQUEST_CHANGES",
  "score": {
    "correctness": 0 to 5,
    "craft": 0 to 5,
    "communication": 0 to 5
  },
  "summary": "Two to four sentences. Direct. No diplomatic softening. State what works, what doesn't, and why.",
  "hard_fails": ["list each hard fail triggered, empty array if none"],
  "inline_comments": [
    {
      "file": "relative/path/to/file.ext",
      "note": "Specific observation. Quote the relevant line or pattern if it helps."
    }
  ],
  "hire_signal": "strong" or "moderate" or "weak" or "no"
}

Verdict rules:
- APPROVE only if: no hard fails, correctness >= 3, craft >= 3, communication >= 3
- REQUEST_CHANGES for anything else