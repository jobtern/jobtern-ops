#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# new-assessment.sh
# Creates a new Jobtern assessment repo from the template, sets the role
# as a repo variable, and applies branch protection.
#
# Usage:
#   ./scripts/new-assessment.sh <repo-name> <role>
#
# Example:
#   ./scripts/new-assessment.sh jobtern-fullstack-2026-05 fullstack
#
# Roles: fullstack | frontend | backend
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
DEFAULT_BRANCH="main"
VALID_ROLES=("fullstack" "frontend" "backend")
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
  echo -e "${BOLD}Usage:${RESET} $0 <repo-name> <role>"
  echo -e "  ${DIM}Example: $0 ambidexters-fullstack-2026-05 fullstack${RESET}"
  echo -e "  ${DIM}Roles: fullstack | frontend | backend${RESET}"
  exit 1
fi

REPO_NAME="$1"
ROLE="$2"
FULL_REPO="$TARGET_ORG/$REPO_NAME"

# Validate role
VALID=false
for r in "${VALID_ROLES[@]}"; do
  [[ "$ROLE" == "$r" ]] && VALID=true && break
done
if [[ "$VALID" == false ]]; then
  fail "Invalid role: $ROLE. Must be one of: ${VALID_ROLES[*]}"
fi

echo -e "\n${BOLD}Jobtern · New assessment repo${RESET}"
echo -e "${DIM}Template: $TEMPLATE_REPO${RESET}"
echo -e "${DIM}Target:   $FULL_REPO${RESET}"
echo -e "${DIM}Role:     $ROLE${RESET}"

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

# ── Set role as repo variable ─────────────────────────────────────────────────
step "Setting role"

gh api --method POST "repos/$FULL_REPO/actions/variables" \
  -f name="ROLE" -f value="$ROLE" > /dev/null
ok "ROLE set to: $ROLE"

# ── Create labels ─────────────────────────────────────────────────────────────
step "Creating labels"

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
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "lock_branch": true
}
EOF

ok "Branch protection applied"
ok "Branch locked — PRs only"

# ── Done ──────────────────────────────────────────────────────────────────────
TASK_URL="https://github.com/$FULL_REPO/edit/main/TASK.md"

echo -e "\n${GREEN}${BOLD}Done.${RESET}"
echo ""
echo -e "  Fill in ${BOLD}TASK.md${RESET} before sending to candidates."
echo -e "  ${DIM}$TASK_URL${RESET}"
echo ""

if command -v open &> /dev/null; then
  open "$TASK_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$TASK_URL"
fi
