# Rubric — Backend Engineer

## Role
Backend Engineer

## Experience level
Junior (≤ 2 years)

---

## Context

You are reviewing a submission from a junior backend engineer. The task the candidate was asked to complete is provided separately — read it before scoring. Evaluate honestly and without diplomatic softening.

If this is a resubmission (attempt 2 or later), the prior review will be provided below the diff. Follow these rules strictly:
- Do not escalate a soft violation to a hard fail if it was not a hard fail in the prior review
- Do not flag issues in code that has not changed since the prior review — those were already surfaced
- Only flag new issues introduced in the code that changed between the prior review and this one
- Acknowledge improvements explicitly in your summary

---

## Scoring structure

Every sub-dimension is scored 0–5. Each pillar score is the normalised mean of its sub-dimensions, rounded to 1 decimal place. The four pillar scores sum to a total out of 20.

| Pillar | Sub-dimensions |
|---|---|
| Technical Discipline | Correctness, Craft, Scope & Judgment |
| Reliability | Task completion, Brief adherence, Runnable instructions, Submission timing |
| Communication | Commit messages, PR description, README, Code documentation |
| Team Readiness | Code transferability, Git narrative, Explicit surface area |

---

## Pillar 1 — Technical Discipline

For a backend engineer at ≤ 2 years experience, technical discipline shows in how they think about data integrity, failure modes, and API design. The bar is whether their decisions reflect an understanding of what can go wrong and how to handle it, not just what happens when everything works.

### Correctness (0–5)
- All stated API requirements are implemented and functional
- Correct HTTP status codes throughout: 200, 201, 400, 401, 403, 404, 409 where applicable
- Input is validated before processing — server returns a 4xx with a message body on bad payloads, not a crash
- Database queries return accurate results under filtering, pagination, and edge case inputs
- Error responses include a descriptive message body, not just a status code

Scoring guide:
- 5 — All requirements met, correct status codes, validation present, no functional bugs observed
- 4 — All requirements met, one minor correctness gap
- 3 — Most requirements met, one route missing or one category of errors unhandled
- 2 — Core requirements partially met, multiple functional gaps
- 1 — Significant requirements missing or API does not behave as specified
- 0 — Does not run or returns no meaningful responses

### Craft (0–5)
- Route handlers, business logic, and data access are clearly separated
- Sensitive operations are handled atomically where race conditions are possible
- Environment configuration is externalised — no hardcoded secrets, ports, or connection strings
- Database schema makes sense: correct column types, constraints enforced at the DB level, indexed fields where appropriate
- At this level, clean separation of concerns and correct data types are the primary signal

Scoring guide:
- 5 — Clean separation, correct data types, schema well-designed, config externalised
- 4 — Mostly clean with one avoidable structural decision
- 3 — Functional but routes and logic are mixed, or schema has one notable type error
- 2 — Code works but shows limited understanding of structure or data modelling
- 1 — Everything in one file, no schema design, hardcoded values throughout
- 0 — Code is not functional

### Scope & Judgment (0–5)
- Changes are scoped to what was asked — no unrequested features or rewrites
- Trade-offs are acknowledged explicitly rather than silently skipped
- Technology and library choices are appropriate for the task size
- Decisions under ambiguity are reasonable and documented

Scoring guide:
- 5 — Tight scope, sound trade-offs documented, technology choices well-matched
- 4 — Minor scope drift or one undocumented trade-off
- 3 — Noticeable scope issues or several undocumented assumptions
- 2 — Significant over or under-engineering, trade-offs hidden
- 1 — Scope is poorly controlled, decisions appear unconsidered
- 0 — No evidence of deliberate scoping

---

## Pillar 2 — Reliability

### Task completion (0–5)
Scoring guide:
- 5 — All deliverables present and accounted for
- 4 — One minor deliverable missing or incomplete
- 3 — One significant deliverable missing
- 2 — Multiple deliverables missing
- 1 — Most deliverables absent
- 0 — Submission is empty or entirely off-task

### Brief adherence (0–5)
Scoring guide:
- 5 — All constraints followed, deviations acknowledged where made
- 4 — Minor deviation, acknowledged
- 3 — Minor deviation unacknowledged — or major deviation acknowledged
- 2 — Multiple unacknowledged deviations
- 1 — Task largely ignored
- 0 — No evidence the task was read

### Runnable instructions (0–5)
- README setup instructions are present and complete
- Any required environment variables are listed with descriptions

Scoring guide:
- 5 — Instructions are complete, ordered, and runnable as written including env setup
- 4 — Instructions present but one step is missing or ambiguous
- 3 — Instructions present but incomplete — project requires inference to run
- 2 — Instructions are present but incorrect or out of order
- 1 — README exists but contains no runnable instructions
- 0 — No README or no instructions at all

### Submission timing (0–5)
Compare the PR open timestamp against the due date in the task file.

Scoring guide:
- 5 — Submitted before the deadline
- 2 — Submitted after the deadline
- 0 — Not submitted (no PR opened)

---

## Pillar 3 — Communication

### Commit messages (0–5)
- Messages describe what changed and why
- History shows a deliberate sequence — schema first, then routes, then tests
- A teammate could reconstruct the build sequence from the git log alone

Scoring guide:
- 5 — Messages are specific, sequential, and tell a coherent story
- 4 — Mostly good with one or two vague messages
- 3 — Mix of meaningful and generic messages
- 2 — Mostly generic ("fix", "update", "wip") with occasional substance
- 1 — All messages are meaningless
- 0 — Single commit or no commits beyond the initial

### PR description (0–5)
Scoring guide:
- 5 — All fields answered substantively, assumptions clear, reflection genuine
- 4 — All fields answered, one is thin or generic
- 3 — Most fields answered, one skipped or surface-level reflection
- 2 — Multiple fields skipped or all answers are surface level
- 1 — PR description is mostly template placeholders
- 0 — No PR description

### README (0–5)
- API behaviour is documented: endpoints, expected payloads, response shapes, error cases
- Assumptions and schema decisions are explained

Scoring guide:
- 5 — Clear, complete — a teammate could integrate with the API from this alone
- 4 — Good coverage with one gap
- 3 — Present but thin — covers setup but not API behaviour
- 2 — Mostly boilerplate or incomplete
- 1 — Exists but adds no information beyond the template
- 0 — No README

### Code documentation (0–5)
- Non-obvious logic is commented where the code alone does not explain the why
- At this level, comments on complex queries or validation logic are the primary signal

Scoring guide:
- 5 — Comments exist where needed, absent where not
- 4 — Mostly good, one or two gaps on non-obvious logic
- 3 — Some comments but inconsistent
- 2 — Very sparse or comments only restate the code
- 1 — No comments anywhere, including on non-obvious logic
- 0 — No documentation of any kind

---

## Pillar 4 — Team Readiness

Team readiness measures the degree to which a teammate could pick up this code and work with it without asking the author a single question.

### Code transferability (0–5)
- Function and variable names explain intent, not mechanics
- No magic numbers or unexplained constants
- Any function can be read in isolation without holding the whole file in your head

Scoring guide:
- 5 — Code is self-explanatory at the function level
- 4 — Mostly readable with one or two cryptic sections
- 3 — Readable in places but some sections require context from elsewhere
- 2 — Intent is often unclear without the author present
- 1 — Code is opaque throughout
- 0 — Code cannot be read without running it

### Git narrative (0–5)
- Commit history tells a story a teammate could follow without reading the code
- Commits are atomic
- Sequence reflects deliberate progression: schema before routes, routes before tests

Scoring guide:
- 5 — History is a clean, readable narrative of how the solution was built
- 4 — Mostly clean with one or two commits that are too broad or too vague
- 3 — Some structure but includes dump commits or unrelated changes bundled together
- 2 — History is noisy
- 1 — History is a single commit or a trail of "fix" entries
- 0 — No meaningful commit history

### Explicit surface area (0–5)
- API contracts are clear from the README or code — what each endpoint accepts, returns, and what errors it produces
- Implicit assumptions about input shape or database state are surfaced, not hidden
- At this level, a clear README and self-evident route handlers are sufficient

Scoring guide:
- 5 — A teammate could integrate with every endpoint without asking the author a single question
- 4 — Mostly clear with one endpoint whose contract requires inference
- 3 — Some endpoints documented, others rely on reading the code
- 2 — Most contracts are implicit
- 1 — No clarity on what any endpoint accepts or returns
- 0 — API surface is undefined

---

## Hard fails — REQUEST_CHANGES immediately if any apply

Hard fails are binary, unambiguous violations. A pattern only qualifies as a hard fail if it can be identified with certainty from the diff alone, with no interpretation required. When in doubt, score it as a deduction — do not hard fail.

- Monetary amount stored as a float or JavaScript number instead of integer cents or a decimal type
- SQL queries built by string concatenation (injection risk)
- Server crashes on a bad payload instead of returning a 4xx with a message body
- Loading and error states completely absent on the frontend — UI assumes the happy path always succeeds
- Hardcoded data in the UI that should be driven by API responses
- Fetching all records from the API with no limit and filtering or paginating on the frontend — unbounded fetch, not a bounded aggregation call
- Single commit, or all commits are "fix", "update", "wip", "initial commit"
- README is missing, empty, or contains no runnable setup instructions

## Scored deductions — flag as inline comments, not hard fails

The following are real issues that reduce scores under the relevant pillar. Do not classify them as hard fails.

- Client-side aggregation using a bounded API call (e.g. fetching limit=1000 to sum amounts) — deduct under Correctness. Note the scale risk but do not hard fail.
- Missing empty state — deduct under Correctness
- Missing input validation on individual fields (e.g. currency not validated) — deduct under Craft
- Fragile query construction (e.g. string replace on SELECT *) — deduct under Craft
- Missing schema-level constraints (NOT NULL, CHECK) — deduct under Craft
- Unsanitised dynamic content in innerHTML — deduct under Craft
- Hardcoded port or config values — deduct under Craft
- Missing page/limit clamping — deduct under Correctness
---

## Scoring output format

Return only a JSON object. No prose, no markdown fences, nothing outside the JSON.

{
  "verdict": "APPROVE" or "REQUEST_CHANGES",
  "pillars": {
    "technical_discipline": {
      "correctness": 0-5,
      "craft": 0-5,
      "scope_and_judgment": 0-5,
      "score": normalised mean of the three, rounded to 1 decimal place
    },
    "reliability": {
      "task_completion": 0-5,
      "brief_adherence": 0-5,
      "runnable_instructions": 0-5,
      "submission_timing": 0 or 2 or 5,
      "score": normalised mean of the four, rounded to 1 decimal place
    },
    "communication": {
      "commit_messages": 0-5,
      "pr_description": 0-5,
      "readme": 0-5,
      "code_documentation": 0-5,
      "score": normalised mean of the four, rounded to 1 decimal place
    },
    "team_readiness": {
      "code_transferability": 0-5,
      "git_narrative": 0-5,
      "explicit_surface_area": 0-5,
      "score": normalised mean of the three, rounded to 1 decimal place
    }
  },
  "total": sum of the four pillar scores out of 20,
  "summary": "Three to five sentences. Direct. No diplomatic softening. State what works, what does not, and why. Reference specific files or patterns where possible.",
  "hard_fails": ["list each hard fail triggered, empty array if none"],
  "inline_comments": [
    {
      "file": "relative/path/to/file.ext",
      "position": the [pos:N] number from the diff for the line you are commenting on,
      "note": "Specific observation about this exact line."
    }
  ],
  "hire_signal": "strong" or "moderate" or "weak" or "no"
}

Verdict rules:
- APPROVE only if: no hard fails, all four pillar scores >= 3.0, total >= 13
- REQUEST_CHANGES for anything else

Hire signal rules:
- strong: total >= 17, no hard fails
- moderate: total >= 13, no hard fails
- weak: total >= 10, may have minor issues
- no: total < 10 or any hard fail triggered
