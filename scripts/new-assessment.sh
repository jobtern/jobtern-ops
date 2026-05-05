#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# new-assessment.sh
# Creates a new Jobtern assessment repo from the template, sets the rubric URL
# as a repo variable, and applies branch protection.
#
# Usage:
#   ./scripts/new-assessment.sh <repo-name> <path-to-rubric>
#
# Example:
#   ./scripts/new-assessment.sh jobtern-fullstack-2026-05 rubrics/fullstack.md
#
# Requirements:
#   - GitHub CLI (gh) installed and authenticated
#   - ANTHROPIC_API_KEY set as an org secret (one-time setup)
#   - TASK.md filled in on the assessment repo before sending to candidates
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── CONFIG — edit these once ──────────────────────────────────────────────────
TEMPLATE_REPO="jobtern/jobtern-assessment-template"
TARGET_ORG="jobtern"
OPS_REPO="jobtern-ops"
DEFAULT_BRANCH="main"
# ─────────────────────────────────────────────────────────────────────────────

# ── Colors ────────────────────────────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
RESET='\033[0m'

step()  { echo -e "\n${BOLD}→ $1${RESET}"; }
ok()    { echo -e "  ${GREEN}✓${RESET} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
fail()  { echo -e "\n${RED}✗ $1${RESET}"; exit 1; }
dim()   { echo -e "  ${DIM}$1${RESET}"; }

# ── Args ──────────────────────────────────────────────────────────────────────
if [[ $# -lt 2 ]]; then
  echo -e "${BOLD}Usage:${RESET} $0 <repo-name> <path-to-rubric>"
  echo -e "  ${DIM}Example: $0 jobtern-fullstack-2026-05 rubrics/fullstack.md${RESET}"
  exit 1
fi

REPO_NAME="$1"
RUBRIC_FILE="$2"
FULL_REPO="$TARGET_ORG/$REPO_NAME"

echo -e "\n${BOLD}Jobtern · New assessment repo${RESET}"
echo -e "${DIM}Template: $TEMPLATE_REPO${RESET}"
echo -e "${DIM}Target:   $FULL_REPO${RESET}"
echo -e "${DIM}Rubric:   $RUBRIC_FILE${RESET}"

# ── Preflight checks ──────────────────────────────────────────────────────────
step "Preflight checks"

if ! command -v gh &> /dev/null; then
  fail "GitHub CLI (gh) not found. Install it: https://cli.github.com"
fi
if ! gh auth status &> /dev/null; then
  fail "Not authenticated with GitHub CLI. Run: gh auth login"
fi

GH_USER=$(gh api user --jq '.login')
ok "Authenticated as $GH_USER"

if ! gh repo view "$TEMPLATE_REPO" &> /dev/null; then
  fail "Template repo not found: $TEMPLATE_REPO"
fi
ok "Template repo found"

if [[ ! -f "$RUBRIC_FILE" ]]; then
  fail "Rubric file not found: $RUBRIC_FILE"
fi
if [[ ! -s "$RUBRIC_FILE" ]]; then
  fail "Rubric file is empty: $RUBRIC_FILE"
fi
ok "Rubric file found"

if gh repo view "$FULL_REPO" &> /dev/null 2>&1; then
  fail "Repo already exists: $FULL_REPO"
fi

# ── Create repo from template ─────────────────────────────────────────────────
step "Creating repo from template"

gh repo create "$FULL_REPO" \
  --template "$TEMPLATE_REPO" \
  --public \
  --description "Jobtern assessment — $(date +%Y-%m-%d)"

ok "Repo created: https://github.com/$FULL_REPO"

echo ""
dim "Waiting for repo initialisation..."
sleep 4

ATTEMPTS=0
until gh api "repos/$FULL_REPO/branches/$DEFAULT_BRANCH" &> /dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [[ $ATTEMPTS -ge 8 ]]; then
    fail "Timed out waiting for branch '$DEFAULT_BRANCH'."
  fi
  dim "  branch not ready yet, retrying in 3s..."
  sleep 3
done
ok "Branch '$DEFAULT_BRANCH' is ready"

# ── Set rubric and task URLs as repo variables ────────────────────────────────
step "Setting rubric and task URLs"

RUBRIC_REL_PATH="${RUBRIC_FILE#./}"
RUBRIC_URL="https://raw.githubusercontent.com/$TARGET_ORG/$OPS_REPO/main/$RUBRIC_REL_PATH"

gh api --method POST "repos/$FULL_REPO/actions/variables" \
  -f name="RUBRIC_URL" -f value="$RUBRIC_URL" > /dev/null
ok "RUBRIC_URL set"

# ── Create ready-for-review label ────────────────────────────────────────────
step "Creating ready-for-review label"

gh label create "ready-for-review" \
  --repo "$FULL_REPO" \
  --color "0075ca" \
  --description "Add this label when your submission is ready for review" 2>/dev/null || \
gh label edit "ready-for-review" \
  --repo "$FULL_REPO" \
  --color "0075ca" \
  --description "Add this label when your submission is ready for review" 2>/dev/null

gh label create "changes-requested" \
  --repo "$FULL_REPO" \
  --color "e4e669" \
  --description "Changes were requested on this submission" 2>/dev/null || true

gh label create "approved" \
  --repo "$FULL_REPO" \
  --color "0e8a16" \
  --description "This submission has been approved" 2>/dev/null || true

gh label create "submission-closed" \
  --repo "$FULL_REPO" \
  --color "b60205" \
  --description "Maximum submissions reached — no further reviews will run" 2>/dev/null || true

ok "Labels created: ready-for-review, changes-requested, approved, submission-closed"

# ── Apply branch protection ───────────────────────────────────────────────────
step "Applying branch protection"

gh api \
  --method PUT \
  "repos/$FULL_REPO/branches/$DEFAULT_BRANCH/protection" \
  --input - <<EOF > /dev/null
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Review PR"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null
}
EOF

ok "Branch protection applied"
ok "Merge blocked until Claude approves"

# ── Done ──────────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/$FULL_REPO"

echo -e "\n${GREEN}${BOLD}Done.${RESET}"
echo ""
echo -e "  Send this to the candidate — they fork it and open a PR."
echo -e "  ${DIM}Review workflow fires automatically on every PR open or push.${RESET}"
echo ""

if command -v open &> /dev/null; then
  open "$REPO_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$REPO_URL"
fi
