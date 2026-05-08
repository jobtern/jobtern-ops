#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# new-assessment.sh
# Creates a new Jobtern assessment repo from the template, sets the role
# as a repo variable, and applies branch protection.
#
# Usage:
#   ./scripts/new-assessment.sh <repo-name> <role> [timezone]
#
# Example:
#   ./scripts/new-assessment.sh google-fullstack-2026-05 fullstack America/New_York
#
# Roles:     fullstack | frontend | backend | mobile | qa | data-engineer
# Timezone:  Any valid IANA timezone identifier. Defaults to America/New_York.
#
# Requirements:
#   - GitHub CLI (gh) installed and authenticated
#   - Node.js installed (used for deadline computation)
#   - ANTHROPIC_API_KEY set as an org secret (one-time setup)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── CONFIG — edit these once ──────────────────────────────────────────────────
TEMPLATE_REPO="jobtern/jobtern-assessment-template"
TARGET_ORG="jobtern"
DEFAULT_BRANCH="main"
DEFAULT_TZ="America/New_York"
VALID_ROLES=("fullstack" "frontend" "backend" "mobile" "qa" "data-engineer")
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
  echo -e "${BOLD}Usage:${RESET} $0 <repo-name> <role> [timezone]"
  echo -e "  ${DIM}Example: $0 ambidexters-fullstack-2026-05 fullstack America/New_York${RESET}"
  echo -e "  ${DIM}Roles: fullstack | frontend | backend | mobile | qa | data-engineer${RESET}"
  echo -e "  ${DIM}Timezone: any IANA identifier — defaults to America/New_York${RESET}"
  exit 1
fi

REPO_NAME="$1"
ROLE="$2"
CANDIDATE_TZ="${3:-$DEFAULT_TZ}"
FULL_REPO="$TARGET_ORG/$REPO_NAME"

# ── Validate role ─────────────────────────────────────────────────────────────
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
echo -e "${DIM}Timezone: $CANDIDATE_TZ${RESET}"

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
if ! command -v node &> /dev/null; then
  fail "Node.js not found. Required for deadline computation."
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

# ── Validate timezone and compute deadline ────────────────────────────────────
step "Computing deadline"

DEADLINE_DATA=$(node -e "
const tz = process.argv[1];

// Validate timezone
try {
  new Intl.DateTimeFormat('en-US', { timeZone: tz });
} catch (e) {
  process.stderr.write('INVALID_TZ');
  process.exit(1);
}

const now = new Date();

// Today's date in candidate timezone (YYYY-MM-DD)
const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
const [y, m, d] = todayStr.split('-').map(Number);

// +2 calendar days — JS Date handles month/year boundaries
const dlDate = new Date(y, m - 1, d + 2);
const dlYear  = dlDate.getFullYear();
const dlMonth = String(dlDate.getMonth() + 1).padStart(2, '0');
const dlDay   = String(dlDate.getDate()).padStart(2, '0');
const dlDateStr = dlYear + '-' + dlMonth + '-' + dlDay;

// Human-readable date in target timezone
const displayDate = new Intl.DateTimeFormat('en-US', {
  timeZone: tz,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(dlDateStr + 'T12:00:00Z'));

// Timezone abbreviation on that date
const tzAbbr = new Intl.DateTimeFormat('en-US', {
  timeZone: tz,
  timeZoneName: 'short',
}).formatToParts(new Date(dlDateStr + 'T12:00:00Z'))
  .find(p => p.type === 'timeZoneName').value;

// ISO deadline string (no offset — stored alongside CANDIDATE_TZ)
const isoDeadline = dlDateStr + 'T20:00';

// Full human-readable deadline for TASK.md
const humanDeadline = displayDate + ' at 8:00pm ' + tzAbbr;

process.stdout.write([isoDeadline, humanDeadline].join('|'));
" "$CANDIDATE_TZ" 2>&1)

if [[ "$DEADLINE_DATA" == *"INVALID_TZ"* ]]; then
  fail "Invalid timezone: $CANDIDATE_TZ. Use a valid IANA identifier (e.g. America/New_York, Africa/Lagos, Europe/London)"
fi

ISO_DEADLINE="${DEADLINE_DATA%%|*}"
HUMAN_DEADLINE="${DEADLINE_DATA#*|}"

ok "Deadline: $HUMAN_DEADLINE"

# ── Clone template into temp directory ────────────────────────────────────────
step "Cloning template"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

git clone --quiet "https://github.com/$TEMPLATE_REPO.git" "$TEMP_DIR"
rm -rf "$TEMP_DIR/.git"
ok "Template cloned to temp directory"

# ── Inject deadline into TASK.md ──────────────────────────────────────────────
step "Injecting deadline"

if grep -q '{{ deadline }}' "$TEMP_DIR/TASK.md" 2>/dev/null; then
  # macOS and Linux compatible sed
  sed -i.bak "s|{{ deadline }}|$HUMAN_DEADLINE|g" "$TEMP_DIR/TASK.md"
  rm -f "$TEMP_DIR/TASK.md.bak"
  ok "Deadline injected: $HUMAN_DEADLINE"
else
  warn "No {{ deadline }} placeholder found in TASK.md — skipping injection"
fi

# ── Open in VS Code for editing ───────────────────────────────────────────────
step "Edit README.md and TASK.md"

echo ""
echo -e "  ${BOLD}VS Code will open. Fill in:${RESET}"
echo -e "  ${DIM}• README.md — replace {{ company_name }} with the client name${RESET}"
echo -e "  ${DIM}• TASK.md   — paste the task brief (deadline already injected)${RESET}"
echo -e "  ${DIM}Close the VS Code window when done to continue.${RESET}"
echo ""

code --new-window --wait "$TEMP_DIR"

ok "VS Code closed — continuing"

# ── Verify files were edited ──────────────────────────────────────────────────
if grep -q '{{ company_name }}' "$TEMP_DIR/README.md" 2>/dev/null; then
  fail "README.md still contains {{ company_name }} — fill it in before continuing."
fi

TASK_CONTENT=$(cat "$TEMP_DIR/TASK.md" 2>/dev/null || echo "")
if echo "$TASK_CONTENT" | grep -q 'Update this file'; then
  fail "TASK.md appears to still be the placeholder — fill it in before continuing."
fi

# ── Create GitHub repo and push ───────────────────────────────────────────────
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

# ── Set repo variables ────────────────────────────────────────────────────────
step "Setting repo variables"

gh api --method POST "repos/$FULL_REPO/actions/variables" \
  -f name="ROLE" -f value="$ROLE" > /dev/null
ok "ROLE set to: $ROLE"

gh api --method POST "repos/$FULL_REPO/actions/variables" \
  -f name="DEADLINE" -f value="$ISO_DEADLINE" > /dev/null
ok "DEADLINE set to: $ISO_DEADLINE"

gh api --method POST "repos/$FULL_REPO/actions/variables" \
  -f name="CANDIDATE_TZ" -f value="$CANDIDATE_TZ" > /dev/null
ok "CANDIDATE_TZ set to: $CANDIDATE_TZ"

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
echo -e "  ${BOLD}Repo:${RESET}     $REPO_URL"
echo -e "  ${BOLD}Deadline:${RESET} $HUMAN_DEADLINE"
echo ""
echo -e "  Send the repo URL to the candidate — they fork it and open a PR."
echo ""

if command -v open &> /dev/null; then
  open "$REPO_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$REPO_URL"
fi