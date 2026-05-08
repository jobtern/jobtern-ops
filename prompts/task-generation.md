# Task Generation Prompt

Use this prompt to generate a Jobtern assessment task from a client's job description.
Paste the prompt below into Claude, followed by the job description and optionally context about the company's domain.

---

## Prompt

You are helping design a technical screening task for Jobtern, a junior engineer screening service.

Jobtern's assessment philosophy:

- Tasks screen for judgment, not execution. A candidate who reads the task and immediately knows what to build has already demonstrated more than one who needs every decision made for them.
- Tasks must feel like real work — a problem worth solving, not a test worth passing.
- Tasks must be completable in under 48 hours by a junior engineer (≤ 2 years experience).
- Tasks must be framework-agnostic — the candidate chooses their stack and justifies it.
- Tasks must surface three signals: decision quality, build integrity, and ownership.
- The process behind the output matters as much as the output itself — commit history, README decisions, and scope calls are evaluated alongside the code.
- All candidate work goes inside a `solution/` directory in the assessment repo.

---

## What a strong task looks like

A strong task:

- Describes the **business problem and user context** — not the technical solution. The candidate figures out the solution.
- Describes the **data available** in domain terms, not as a schema or API contract. Fields are named, their meaning explained, their constraints stated. The candidate designs the contract.
- Embeds **discipline traps** as natural constraints that feel like real engineering requirements — not as a checklist of things to implement. A discipline trap is a constraint that a careful engineer handles correctly and a careless one gets wrong without realising.
- Contains **one deliberate ambiguity** — something the task mentions but does not resolve. The candidate must make a call and document it. The call itself matters less than the fact that they made one and owned it.
- Contains **one optional extension** — mentioned explicitly as out of scope for this sprint but on the roadmap. A candidate who builds it before completing the core experience is showing poor judgment. A candidate who scopes it out explicitly in their README is showing the right instincts.
- Leaves enough **undefined** that two thoughtful engineers would produce meaningfully different solutions. If the task can be completed by reading it once and prompting an AI — it is too specific.
- Does not specify component names, endpoint shapes, UI layout, or implementation approach.
- Does not suggest tools or libraries.

---

## What to avoid

- Specifying the API contract — endpoint names, query params, response shapes, JSON examples. Describe the data, not the interface.
- Listing UI components to build — summary bar, filter controls, pagination. Describe what the user needs to accomplish, not how to accomplish it.
- Suggesting implementation tools — json-server, msw, React, Express. The candidate chooses.
- Tasks that can be completed correctly by reading the brief once and prompting an AI without additional thought.
- Tasks so open-ended that there is no consistent baseline for evaluation.
- Generic CRUD tasks with no domain context.
- Tasks that require expensive third-party APIs or cloud accounts.
- Generic tone-setting lines that could apply to any task — phrases like "this is a hands-on role where your work ships and is seen" belong to templates, not real briefs. Context must be specific to this domain and this team.

---

## Role tracks

**Frontend** — The candidate builds a UI that consumes data from a source they define and mock themselves. Describe what the user needs to see and do. Do not describe what components to build or what the API looks like. The candidate designs the data contract, documents it in their README, and is scored on whether that contract makes sense for the problem.

**Backend** — The candidate designs and builds an API for a described business problem. Describe the domain and the operations the system needs to support. Do not specify endpoints, response shapes, or database schema. The candidate designs all of these and is scored on the quality of those decisions.

**Fullstack** — Both halves. The candidate owns the entire vertical — API design, data modelling, and UI. The task should have a natural integration point that reveals how they think across the stack.

**Mobile** — The candidate designs and builds a native or cross-platform mobile experience. Describe the user context and the data. The candidate chooses the platform, designs the data layer, and documents their approach.

---

## Discipline traps

Every task must embed two or three discipline traps. These are constraints that:

- Feel like real engineering requirements, not test conditions
- Are stated explicitly in the Constraints section
- Have a clearly wrong implementation that a careless engineer would produce
- Are verifiable from the code diff alone

Examples by domain:

- **Fintech** — monetary amounts stored as integer smallest-unit (kobo, cents) never as floats; pagination enforced server-side never client-side; aggregation computed server-side never by summing a fetched list
- **SaaS** — environment config externalised never hardcoded; auth token validated including expiry; duplicate detection enforced at database level not application level only
- **Enterprise** — input validated server-side with descriptive error responses; sensitive operations atomic to prevent race conditions; schema constraints enforced at database level

---

## Deliberate ambiguity

Every task must contain one thing that the brief mentions but does not resolve. It should be something a real engineer would encounter and need to make a call on. Examples:

- Whether a feature should reflect real-time data or periodic snapshots
- Whether a filter should be additive or exclusive
- Whether an empty result set should show an empty state or hide the component entirely
- Whether a monetary total should reflect the current filtered view or always the full dataset

State the ambiguity explicitly in the task. Tell the candidate a decision is needed. Do not tell them which decision to make.

---

## Optional extension

Every task must mention one feature that is explicitly out of scope for this sprint. It should be something that naturally follows from the core work — something a candidate might reach for if they finish early. The task should name it and explicitly say it is not required.

This tests scope judgment. A candidate who builds it before completing the core experience is showing poor priorities. A candidate who scopes it out in their README is showing the right instincts.

---

## Output format

Generate exactly one task. Return it as raw markdown only — no preamble, no explanation, no code fences wrapping the entire output. Deliver the output as a `TASK.md` file — not as inline text.

The task must follow this structure:

# Task — [Short descriptive title]

## Context

[Two to three sentences. The business situation. Who uses this. What problem it solves. Written as a real handoff from a real team — not as a test brief.]

## The data

[Describe the data available to the candidate in domain terms. Name the fields, explain what they mean, state any constraints on their values. Do not specify the API contract — describe what the data represents, not how it is exposed. This is what the candidate has to work with. They decide how to expose it.]

## What the user needs

[Describe what the end user needs to be able to do — in user terms, not technical terms. No component names, no endpoint names, no implementation approach. Two to four user needs, stated as outcomes. The candidate decides how to meet them.]

## The open question

[State the deliberate ambiguity. Name it explicitly. Tell the candidate a decision is required. Do not resolve it.]

## Deliverables

- All your work goes inside the `solution/` directory in this repo
- A `README.md` inside `solution/` covering:
  - How to run it locally (exact commands)
  - The data contract you designed — document every endpoint, what it accepts, and what it returns
  - The decision you made on the open question, and why
  - Assumptions you made
  - One thing you'd do differently with more time

## Constraints

[Two to three discipline traps stated as engineering requirements. Each one should feel like a real constraint, not a test condition. Be explicit — a candidate who violates these is immediately flagged.]

Note: [name of optional extension] is on the roadmap but out of scope for this sprint. Complete the core experience first. If you have capacity after that, explore it — but a polished core beats a half-built extension.

## Deadline

{{ deadline }}

## What we're looking for

We are not looking for how much you built. We are looking for how deliberately you built it — the decisions you made, the ones you didn't make and why, and whether the engineer behind the code is visible in the commit history and README.

---

## Instructions

1. Read the job description carefully — identify the domain, the business context, and the type of data the company works with.
2. Design the business problem the candidate will solve — specific enough to feel real, open enough that the solution is not predetermined.
3. Identify two or three discipline traps relevant to the domain. State them as natural constraints.
4. Identify one deliberate ambiguity — something a real engineer on this team would need to decide.
5. Identify one optional extension — something that naturally follows from the core work but is explicitly out of scope.
6. Verify: can this task be completed correctly by reading it once and prompting an AI without additional thought? If yes, it is too specific. Remove more.
7. Generate the task in the output format above. Raw markdown only.
8. Leave the Deadline section exactly as `{{ deadline }}` — it will be injected automatically by the assessment script.

---

## Input

**Job description:**
[paste job description here]

**Domain context** (optional — any additional context about the company's product, users, or technical environment):
[paste here or leave blank]
