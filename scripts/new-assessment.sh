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
#   ./scripts/new-assessment.sh ambidexters-fullstack-2026-05 fullstack
#
# Roles: fullstack | frontend | backend
#
# Requirements:
#   - GitHub CLI (gh) installed and authenticated
#   - ANTHROPIC_API_KEY set as an org secret (one-time setup)
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
if ! command -v git &> /dev/null; then
  fail "git not found."
fi
if ! command -v code &> /dev/null; then
  fail "VS Code CLI (code) not found. Install it from VS Code: Shell Command → Install 'code' in PATH"
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

# ── Clone template into temp directory ───────────────────────────────────────
step "Cloning template"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Get default branch SHA and tree of template repo
TEMPLATE_TREE=$(gh api "repos/$TEMPLATE_REPO/git/trees/HEAD?recursive=1" --jq '.tree[]')

# Clone via git
git clone --quiet "https://github.com/$TEMPLATE_REPO.git" "$TEMP_DIR"
rm -rf "$TEMP_DIR/.git"
ok "Template cloned to temp directory"

# ── Open in VS Code for editing ───────────────────────────────────────────────
step "Edit README.md and TASK.md"

echo ""
echo -e "  ${BOLD}VS Code will open. Fill in:${RESET}"
echo -e "  ${DIM}• README.md — replace {{ company_name }} with the client name${RESET}"
echo -e "  ${DIM}• TASK.md   — paste the task brief${RESET}"
echo -e "  ${DIM}Close the VS Code window when done to continue.${RESET}"
echo ""

code --new-window --wait "$TEMP_DIR"

ok "VS Code closed — continuing"

# ── Verify files were edited ──────────────────────────────────────────────────
if grep -q '{{ company_name }}' "$TEMP_DIR/README.md" 2>/dev/null; then
  warn "README.md still contains {{ company_name }} — you may have forgotten to fill it in."
fi

TASK_CONTENT=$(cat "$TEMP_DIR/TASK.md" 2>/dev/null || echo "")
if echo "$TASK_CONTENT" | grep -q 'Jobtern: replace this file'; then
  warn "TASK.md appears to still be the placeholder — you may have forgotten to fill it in."
fi

# ── Create empty GitHub repo and push ────────────────────────────────────────
step "Creating GitHub repo"

gh repo create "$FULL_REPO" \
  --public \
  --description "Jobtern assessment — $(date +%Y-%m-%d)" > /dev/null

ok "Repo created: https://github.com/$FULL_REPO"

step "Pushing initial commit"

cd "$TEMP_DIR"
git init --quiet
git checkout -b main
git config user.name "jobtern-admin"
git config user.email "admin@jobtern.com"
git add .
git commit --quiet -m "chore: initialise assessment repo"
git remote add origin "https://github.com/$FULL_REPO.git"
git push --quiet -u origin main

ok "Initial commit pushed"

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
REPO_URL="https://github.com/$FULL_REPO"

echo -e "\n${GREEN}${BOLD}Done.${RESET}"
echo ""
echo -e "  Send this to the candidate — they fork it and open a PR."
echo -e "  ${BOLD}$REPO_URL${RESET}"
echo ""

if command -v open &> /dev/null; then
  open "$REPO_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$REPO_URL"
fi