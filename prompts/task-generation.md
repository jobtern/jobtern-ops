# Task Generation Prompt

Use this prompt to generate a Jobtern assessment task from a client's job description.
Paste the prompt below into Claude, followed by the job description and optionally an example task.

---

## Prompt

You are helping design a technical screening task for Jobtern, a junior engineer screening service.

Jobtern's assessment philosophy:

- Tasks must feel specific to a real job description, not generic
- Tasks must be completable in under 48 hours by a junior engineer (≤ 2 years experience)
- Tasks must be framework-agnostic — the candidate chooses their stack
- Tasks must naturally surface four signals: technical discipline, reliability, communication, and team readiness
- Tasks must be ungameable — the process and the work behind the output matter as much as the output itself
- All candidate work goes inside a `solution/` directory in the assessment repo

The task file will live in the assessment repo as `TASK.md`. Candidates read it when they fork the repo. It is the only brief they receive.

---

## What a strong task looks like

A strong task:

- Is grounded in the domain of the job description (fintech, SaaS, enterprise, etc.)
- Has a clear, realistic scenario that explains _why_ this work matters
- Specifies deliverables precisely — what to build, what endpoints or UI to include
- Embeds discipline traps naturally — constraints that separate careful engineers from careless ones (e.g. amount must be stored as integer cents, pagination must be enforced server-side)
- Requires a README inside `solution/` covering: how to run it, assumptions made, one thing they'd do differently with more time
- States a deadline (48 hours from receiving the task)
- Closes with a tone-setting note about what Jobtern is evaluating — not the output alone, but the process

---

## What to avoid

- Generic CRUD tasks with no domain context
- Tasks that can be completed by copying a tutorial
- Tasks that require expensive third-party APIs or cloud accounts
- Tasks that are so open-ended that there is no clear baseline for evaluation
- Tasks that only test one layer (backend only, frontend only) for a fullstack role

---

## Role tracks

Generate the task for the appropriate track based on the job description:

**Fullstack** — two parts: a REST API backend and a frontend UI that consumes it. Both halves must connect. The task should have integration points that reveal how the candidate thinks across the stack.

**Backend** — API design, data modelling, validation, error handling. No frontend required, but the API must be documented clearly enough for a teammate to integrate against.

**Frontend** — UI that consumes a defined mock or real API. Must include loading, error, and empty states. No backend required, but the candidate must define the data contract they're working against.

---

## Output format

Generate exactly one task. Return it as raw markdown only — no preamble, no explanation, no code fences wrapping the entire output. The markdown should be ready to paste directly into `TASK.md` without any editing.

The task must follow this structure exactly:

# Task — [Short descriptive title]

## Context

[Two to three sentences. What company or product context is this candidate stepping into? What problem are they solving? Make it feel like a real handoff from a real team.]

## What to build

[Structured breakdown of what to build. Use subheadings for Part A (backend) and Part B (frontend) for fullstack roles. Be specific about endpoints, data shapes, UI requirements.]

## Deliverables

- All your work goes inside the `solution/` directory in this repo
- A `README.md` inside `solution/` covering:
  - How to run it locally (exact commands)
  - [Role-specific addition — e.g. database choice and why, or API contract]
  - Assumptions you made
  - One thing you'd do differently with more time
- [Any additional deliverables specific to the task]

## Constraints

[List the non-negotiable constraints that embed discipline traps. Be explicit. These are scored hard fails if violated.]

## Deadline

48 hours from when you receive this task.

## What we're looking for

We are not looking for perfection. We are looking for how you think, how you build, and how you communicate your decisions. The README and commit history are as much a part of this submission as the code itself.

---

## Instructions

1. Read the job description carefully — identify the domain, the stack signals, and the seniority level
2. Identify two or three discipline traps relevant to the domain (e.g. for fintech: float money, client-side pagination; for SaaS: hardcoded config, missing error states)
3. Generate one task that feels like real work this company would actually assign
4. Do not generate multiple variants — generate the single strongest task for this role

---

## Input

**Job description:**
[paste job description here]

**Example task for reference**
# Task — Transaction Activity Feed

## Context

You are joining Microsoft's frontend engineering team. The backend team has just shipped a transactions API for the business banking dashboard. Your job is to build the activity feed UI that ops staff and business owners use to monitor their payment activity in real time.

This is a hands-on role where your work ships and is seen — this task reflects that.

---

## What to build

A single-page transaction activity feed that consumes the API defined below.

### The API contract

Base URL: `http://localhost:3001`

**`GET /transactions`**
Returns a paginated list of transactions.

Query params: `?status=pending|completed|failed`, `?type=debit|credit`, `?page=1`, `?limit=20`

Response shape:
```json
{
  "data": [
    {
      "id": "txn_001",
      "amount": 250000,
      "currency": "NGN",
      "type": "debit",
      "status": "completed",
      "description": "POS withdrawal — Ikeja branch",
      "created_at": "2026-04-01T14:23:00Z"
    }
  ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "pages": 6
  }
}
```

`amount` is always in kobo (integer). Never a float.

**`GET /transactions/summary`**
Returns aggregate totals.

```json
{
  "data": {
    "total_credits": 5000000,
    "total_debits": 3200000,
    "by_status": {
      "pending": 4,
      "completed": 112,
      "failed": 4
    }
  }
}
```

### The UI

**Mock the API** — use `json-server`, `msw`, hardcoded fetch responses, or any approach you prefer. The API contract above is fixed — your mock must match it exactly.

**Build the following:**
- Summary bar showing total credits, total debits, and count by status — sourced from `/transactions/summary`
- Transaction list with filter controls for status and type
- Pagination — server-driven, not client-side slice
- Loading state while data is fetching
- Error state if the request fails
- Empty state when filters return no results
- Amount displayed in naira (divide kobo by 100, format as currency)

No design system required. Any framework or plain HTML/CSS/JS is fine. React is welcome but not required.

---

## Deliverables

- All your work goes inside the `solution/` directory in this repo
- A `README.md` inside `solution/` covering:
  - How to run it locally (exact commands, including how to start the mock API)
  - The data contract you built against — confirm or note any deviations from the spec above
  - Assumptions you made
  - One thing you'd do differently with more time

---

## Constraints

- `amount` must be treated as integer kobo throughout — never convert to a float at any point in your code
- Pagination must be driven by the API `meta` — do not fetch all records and slice client-side
- The summary bar must call `/transactions/summary` — do not compute totals by summing the transaction list
- Loading, error, and empty states must all be visible — not just the happy path
- Your mock API must return data that matches the contract above — do not hardcode UI values directly

---

## Deadline

48 hours from when you receive this task.

---

## What we're looking for

We are not looking for perfection. We are looking for how you think, how you build, and how you communicate your decisions. The README, your component structure, and your commit history are as much a part of this submission as the UI itself.
