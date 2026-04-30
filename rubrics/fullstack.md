# Review Context — Fullstack Engineer

## Role
Fullstack Engineer

## What this assessment is testing

- Can the candidate own a feature end-to-end without hand-holding?
- Do they handle error states, not just happy paths?
- Is their code written to be read by a teammate, not just to run?
- Does their README communicate clearly to someone who wasn't in the room?
- Does their commit history show deliberate, incremental progress?
- Do they make sound judgment calls on data types, constraints, and scope?

---

## Task breakdown

<!-- Paste the active task variant here before injecting this file as a secret -->
<!-- Include: what was asked, key constraints, and any domain-specific traps -->

---

## Hard fails — REQUEST_CHANGES immediately if any apply

- Monetary `amount` stored as a float or JavaScript `number` instead of integer cents or a decimal type
- Filtering or pagination implemented on the frontend after fetching all records from the API
- Server crashes on a bad payload instead of returning a 4xx with a message body
- SQL queries built by string concatenation
- Single commit, or all commits are "fix", "update", "wip", "initial commit"
- README is missing, empty, or contains no runnable setup instructions

---

## What a strong submission looks like

**Correctness**
- Correct HTTP status codes throughout: 200, 201, 400, 401, 404, 409 where applicable
- Pagination enforced at the database/query layer, not after a full fetch
- Filters compose correctly when multiple are applied simultaneously
- Tests cover edge cases and failure paths, not just the happy path
- Database schema makes sense: indexed fields, correct column types

**Craft**
- README is written for a reader who wasn't in the room — instructions are runnable as written
- "One thing I'd do differently with more time" is specific and honest, not generic
- Commit history tells a deliberate story
- Error responses include a descriptive message body, not just a status code
- Trade-offs are acknowledged explicitly rather than silently skipped

**Communication**
- PR description answers all template questions with substance
- Assumptions are listed clearly
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