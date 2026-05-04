# Task — Transaction Feed

## Context

You are joining the Ambidexters engineering team as a fullstack developer. The backend team has just stood up a raw transactions endpoint. Your job is to wire it up to a minimal dashboard so ops staff can monitor payment activity.

This is the kind of task you will own end-to-end on this team — no handholding, no design spec. Read the requirements, make reasonable calls where things are ambiguous, and document what you decided and why.

---

## What to build

### Part A — REST API

Stand up a simple HTTP server with the following endpoints:

**`POST /transactions`**
Creates a new transaction. Accepts:
```json
{
  "amount": 4999,
  "currency": "NGN",
  "status": "pending",
  "type": "debit",
  "description": "Vendor payment — AWS"
}
```
- `amount` must be a positive integer representing value in the smallest currency unit (kobo, cents, etc). Reject floats.
- `status` must be one of: `pending`, `completed`, `failed`
- `type` must be one of: `debit`, `credit`
- Return `201` on success, `400` with a descriptive message on invalid input

**`GET /transactions`**
Returns a paginated list of transactions. Must support:
- Filter by `status`
- Filter by `type`
- Both filters applied simultaneously
- Query params: `page`, `limit` (default 20, max 100)
- Pagination enforced at the database layer — not by slicing an in-memory array

Response shape:
```json
{
  "data": [...],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "pages": 6
  }
}
```

**`GET /transactions/:id`**
Returns a single transaction or `404` if not found.

Each transaction must have at minimum: `id`, `amount`, `currency`, `status`, `type`, `description`, `created_at`.

**Database**
Use SQLite, PostgreSQL, or MongoDB — your choice. Justify it briefly in your README.

---

### Part B — Frontend UI

A single-page interface that:
- Fetches and displays the transaction list from your API
- Lets the user filter by `status` and `type`
- Shows a summary bar: total debits, total credits, count by status
- Handles loading, error, and empty states visibly

No design system required. Any framework or plain HTML/CSS/JS is fine.

---

## Deliverables

- Working code in a Git repo (this one — fork it, open a PR)
- A `README.md` inside your submission covering:
  - How to run it locally (exact commands)
  - Database choice and why
  - Assumptions you made
  - One thing you'd do differently with more time
- At least three meaningful commits — not "initial commit" plus "fix"

---

## Constraints

- No auth required — but note in your README where you'd add it and why
- No external payment APIs — use mock or seeded data
- `amount` stored as an integer — floats will be flagged
- Pagination must be enforced server-side

---

## Deadline

48 hours from when you receive this task.

---

## What we're looking for

We are not looking for perfection. We are looking for how you think, how you build, and how you communicate your decisions. The README and commit history are as much a part of this submission as the code itself.
