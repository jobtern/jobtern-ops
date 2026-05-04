# Rubric — Frontend Engineer

## Role
Frontend Engineer

## Experience level
Junior (≤ 2 years)

---

## Context

You are reviewing a submission from a junior frontend engineer. The task the candidate was asked to complete is provided separately — read it before scoring. Evaluate honestly and without diplomatic softening.

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

For a frontend engineer at ≤ 2 years experience, technical discipline shows in how they manage the browser environment: state, side effects, rendering behaviour, and component boundaries. The bar is whether their decisions reflect an understanding of how the frontend actually works, not just that it runs.

### Correctness (0–5)
- All stated UI requirements are implemented and functional
- Loading, error, and empty states are handled and visible — not just the happy path
- Data flow is unidirectional and predictable
- Forms validate input before submission and surface errors clearly
- UI behaves correctly across reasonable viewport sizes

Scoring guide:
- 5 — All requirements met, all states handled, no functional bugs observed
- 4 — All requirements met, minor state handling gaps
- 3 — Most requirements met, at least one state missing
- 2 — Core requirements partially met, multiple gaps
- 1 — Significant requirements missing or broken
- 0 — Does not function

### Craft (0–5)
- Components are small, focused, and named after what they do
- State is kept as close to where it is needed as possible
- CSS is structured and consistent — not a patchwork of overrides
- Interactive elements are keyboard navigable
- No direct DOM manipulation inside a component framework without justification
- Performance optimisation is a positive signal if present but absence does not penalise at this level

Scoring guide:
- 5 — Clean component boundaries, deliberate state management, consistent styling, accessible
- 4 — Mostly clean with one or two avoidable structural decisions
- 3 — Functional but component structure is flat or state is mismanaged in observable ways
- 2 — Code works but shows limited understanding of component design or CSS architecture
- 1 — Works in places but structure suggests trial-and-error, not design
- 0 — Code is not functional or is a single undivided block

### Scope & Judgment (0–5)
- Changes are scoped to what was asked — no unrequested rewrites or feature additions
- Trade-offs are acknowledged explicitly rather than silently skipped
- Technology choices are appropriate for the task size — no over-engineering
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

Reliability is behavioural, not technical. It answers one question: can this person be depended on to deliver what they said they would, when they said they would, in the form that was asked?

### Task completion (0–5)
- Every deliverable listed in the task is present
- Nothing is silently omitted

Scoring guide:
- 5 — All deliverables present and accounted for
- 4 — One minor deliverable missing or incomplete
- 3 — One significant deliverable missing
- 2 — Multiple deliverables missing
- 1 — Most deliverables absent
- 0 — Submission is empty or entirely off-task

### Brief adherence (0–5)
- The candidate followed the constraints specified in the task
- Any deviation is explicitly acknowledged and justified

Scoring guide:
- 5 — All constraints followed, deviations acknowledged where made
- 4 — Minor deviation, acknowledged
- 3 — Minor deviation unacknowledged — or major deviation acknowledged
- 2 — Multiple unacknowledged deviations
- 1 — Task largely ignored
- 0 — No evidence the task was read

### Runnable instructions (0–5)
- README setup instructions are present
- Instructions are complete enough to run the project from scratch without asking the author
- Commands are correct and in the right order

Scoring guide:
- 5 — Instructions are complete, ordered, and runnable as written
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

Communication is measured across four surfaces. The standard is the same across all four: is this written for a reader who was not in the room?

### Commit messages (0–5)
- Messages describe what changed and why, not just what file was touched
- History shows a deliberate sequence — not a single dump or trail of "fix" commits
- A teammate could reconstruct the build sequence from the git log alone

Scoring guide:
- 5 — Messages are specific, sequential, and tell a coherent story
- 4 — Mostly good with one or two vague messages
- 3 — Mix of meaningful and generic messages
- 2 — Mostly generic ("fix", "update", "wip") with occasional substance
- 1 — All messages are meaningless
- 0 — Single commit or no commits beyond the initial

### PR description (0–5)
- All template fields are answered with substance
- Assumptions are stated clearly
- "One thing I'd do differently" is specific — not "better error handling" or "more tests"

Scoring guide:
- 5 — All fields answered substantively, assumptions clear, reflection genuine
- 4 — All fields answered, one is thin or generic
- 3 — Most fields answered, one skipped or surface-level reflection
- 2 — Multiple fields skipped or all answers are surface level
- 1 — PR description is mostly template placeholders
- 0 — No PR description

### README (0–5)
- Written for a reader who was not present for the build
- Setup instructions are runnable (scored separately above — this covers the rest)
- Assumptions and architectural decisions are explained
- Scope limitations are honest

Scoring guide:
- 5 — Clear, complete, honest — a teammate could onboard from this alone
- 4 — Good coverage with one gap
- 3 — Present but thin — covers the minimum
- 2 — Mostly boilerplate or incomplete
- 1 — Exists but adds no information beyond the template
- 0 — No README

### Code documentation (0–5)
- Complex logic is commented where the code alone does not explain the why
- No over-commenting of obvious operations
- At this level, comments on non-obvious logic are the primary signal — formal JSDoc or typed interfaces are a bonus not a requirement

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
- Variable and function names explain intent, not mechanics
- No magic numbers or unexplained constants
- Any function can be read in isolation without holding the whole file in your head
- At this level, clear naming and readable structure are the primary signal

Scoring guide:
- 5 — Code is self-explanatory at the function level
- 4 — Mostly readable with one or two cryptic sections
- 3 — Readable in places but some sections require context from elsewhere
- 2 — Intent is often unclear without the author present
- 1 — Code is opaque throughout
- 0 — Code cannot be read without running it

### Git narrative (0–5)
- Commit history tells a story a teammate could follow without reading the code
- Commits are atomic — each one represents a single coherent change
- Branch and commit structure reflects deliberate progression, not trial and error

Scoring guide:
- 5 — History is a clean, readable narrative of how the solution was built
- 4 — Mostly clean with one or two commits that are too broad or too vague
- 3 — Some structure but includes dump commits or unrelated changes bundled together
- 2 — History is noisy — hard to follow without reading all the code
- 1 — History is a single commit or a trail of "fix" entries
- 0 — No meaningful commit history

### Explicit surface area (0–5)
- Component props and data expectations are reasonably clear from naming and structure
- At this level, self-evident naming is sufficient — formal type definitions are a bonus
- Implicit assumptions that would break a teammate's integration are surfaced

Scoring guide:
- 5 — Any teammate could integrate a component without asking questions
- 4 — Mostly clear with one implicit expectation a teammate would have to infer
- 3 — Some components are clear, others rely on shared context
- 2 — Most component contracts are implicit
- 1 — No clarity on what any component expects or exposes
- 0 — Component boundaries are undefined

---

## Hard fails — REQUEST_CHANGES immediately if any apply

- Loading and error states are completely absent — UI assumes the happy path always succeeds
- Hardcoded data in the UI that should be driven by props, state, or an API response
- useEffect with a missing dependency array causing infinite loops or stale closures (React)
- Single commit, or all commits are "fix", "update", "wip", "initial commit"
- README is missing, empty, or contains no runnable setup instructions

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
      "note": "Specific observation. Reference the exact line or pattern."
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
