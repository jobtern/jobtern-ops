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

**Example task for reference** (optional — shows the tone and depth expected):
[paste example task here, or leave blank]
