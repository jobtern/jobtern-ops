# Review Context — Backend Engineer

## Role
Backend Engineer

## What this assessment is testing

- Can the candidate design and implement a reliable API or service?
- Do they think about failure modes, not just successful execution?
- Is their data layer sound — correct types, constraints, and query patterns?
- Do they understand the security surface of what they're building?
- Is their code structured so a teammate could extend it without asking questions?
- Do they scope their work appropriately and communicate trade-offs honestly?

---

## Task breakdown

<!-- Paste the active task variant here before injecting this file as a secret -->
<!-- Include: what was asked, key constraints, and any domain-specific traps -->

---

## Hard fails — REQUEST_CHANGES immediately if any apply

- Monetary `amount` stored as a float or JavaScript `number` instead of integer cents or a decimal type
- SQL queries built by string concatenation (injection risk)
- Passwords stored in plain text or using a non-purpose-built hashing algorithm (e.g. MD5, SHA-256)
- JWT validation that does not check token expiry
- Signature or HMAC validation computed over a parsed/re-serialised object instead of the raw request body
- Duplicate detection handled only in application code with no database-level unique constraint
- Unhandled promise rejections or uncaught exceptions that crash the server
- No input validation — server accepts and processes any payload shape without checking
- Single commit, or all commits are "fix", "update", "wip", "initial commit"
- README is missing, empty, or contains no runnable setup instructions

---

## What a strong submission looks like

**Correctness**
- Correct HTTP status codes throughout: 200, 201, 400, 401, 403, 404, 409 where applicable
- Pagination enforced at the database/query layer, not after a full fetch
- Filters and query parameters compose correctly when multiple are applied
- Database schema makes sense: indexed fields, correct column types, constraints enforced at the DB level
- Tests cover failure paths and edge cases, not just the happy path

**Craft**
- Error responses include a descriptive message body, not just a status code
- Sensitive operations are atomic where race conditions are possible
- Environment configuration is externalised — no hardcoded secrets or connection strings
- Code is structured so routes, business logic, and data access are clearly separated
- "One thing I'd do differently with more time" is specific and honest, not generic

**Communication**
- PR description answers all template questions with substance
- Assumptions about schema design or API behaviour are listed clearly
- Security trade-offs or intentional omissions are acknowledged explicitly

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