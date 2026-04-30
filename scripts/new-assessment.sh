#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# new-assessment.sh
# Creates a new Jobtern assessment repo from the template, applies branch
# protection, and opens the review context for editing.
#
# Usage:
#   ./new-assessment.sh <repo-name>
#   ./new-assessment.sh jobtern-fullstack-2025-02
#
# Requirements:
#   - GitHub CLI (gh) installed and authenticated
#   - ANTHROPIC_API_KEY set as an org secret (one-time setup)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── CONFIG — edit these once ──────────────────────────────────────────────────
TEMPLATE_REPO="jobtern/jobtern-assessment-template"   # your template repo
TARGET_ORG="jobtern"                                  # org where new repos go
DEFAULT_BRANCH="main"
REVIEW_CONTEXT_PATH=".github/review-context.md"
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
if [[ $# -lt 1 ]]; then
  echo -e "${BOLD}Usage:${RESET} $0 <repo-name>"
  echo -e "  ${DIM}Example: $0 jobtern-fullstack-2025-02${RESET}"
  exit 1
fi

REPO_NAME="$1"
FULL_REPO="$TARGET_ORG/$REPO_NAME"

echo -e "\n${BOLD}Jobtern · New assessment repo${RESET}"
echo -e "${DIM}Template: $TEMPLATE_REPO${RESET}"
echo -e "${DIM}Target:   $FULL_REPO${RESET}"

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

# Check template repo exists
if ! gh repo view "$TEMPLATE_REPO" &> /dev/null; then
  fail "Template repo not found: $TEMPLATE_REPO\n  Update TEMPLATE_REPO in this script."
fi
ok "Template repo found"

# Check repo name doesn't already exist
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

# Wait for GitHub to finish initialising the repo contents
echo ""
dim "Waiting for repo initialisation..."
sleep 4

# Confirm default branch exists before applying protection
ATTEMPTS=0
until gh api "repos/$FULL_REPO/branches/$DEFAULT_BRANCH" &> /dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [[ $ATTEMPTS -ge 8 ]]; then
    fail "Timed out waiting for branch '$DEFAULT_BRANCH' to appear. Check the repo manually."
  fi
  dim "  branch not ready yet, retrying in 3s..."
  sleep 3
done
ok "Branch '$DEFAULT_BRANCH' is ready"

# ── Apply branch protection ───────────────────────────────────────────────────
step "Applying branch protection"

gh api \
  --method PUT \
  "repos/$FULL_REPO/branches/$DEFAULT_BRANCH/protection" \
  --input - <<EOF
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

# ── Verify org secret is accessible ──────────────────────────────────────────
step "Checking ANTHROPIC_API_KEY secret"

if gh secret list --org "$TARGET_ORG" 2>/dev/null | grep -q "ANTHROPIC_API_KEY"; then
  ok "Org secret ANTHROPIC_API_KEY found"
else
  warn "ANTHROPIC_API_KEY not found as an org secret."
  echo -e "  Add it at: https://github.com/organizations/$TARGET_ORG/settings/secrets/actions"
  echo -e "  ${DIM}Or add it at the repo level: https://github.com/$FULL_REPO/settings/secrets/actions${RESET}"
fi

# ── Open review context for editing ──────────────────────────────────────────
step "Opening review context"

REVIEW_CONTEXT_URL="https://github.com/$FULL_REPO/edit/$DEFAULT_BRANCH/$REVIEW_CONTEXT_PATH"
echo ""
echo -e "  Update the review context before sending to candidates:"
echo -e "  ${BOLD}${REVIEW_CONTEXT_URL}${RESET}"
echo ""
dim "  Fields to update: Role, Company, Task variant, Hard fails"
echo ""

# Try to open in browser if possible
if command -v open &> /dev/null; then
  open "$REVIEW_CONTEXT_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$REVIEW_CONTEXT_URL"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo -e "${GREEN}${BOLD}Done.${RESET}"
echo ""
echo -e "  Repo URL:     ${BOLD}https://github.com/$FULL_REPO${RESET}"
echo -e "  Send this to candidates — they fork it and open a PR."
echo ""
echo -e "  ${DIM}Review workflow fires automatically on every PR open or push.${RESET}"
echo ""
