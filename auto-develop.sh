#!/usr/bin/env bash
set -uo pipefail

# Auto-develop: picks open GitHub issues from the wahlumfragen repo one by one
# and solves them with Claude Code. Loops until no assignable issues remain
# (3x empty) or MAX_ITERATIONS is hit.

MAX_ITERATIONS="${MAX_ITERATIONS:-50}"

die()  { echo "ERROR: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

usage() {
  cat <<EOF
Usage: $(basename "$0")

Auto-solve GitHub issues in the wahlumfragen repo with Claude Code.

Runs in the repo this script lives in (must be a git repo with a GitHub
remote).

Env:
  MAX_ITERATIONS  default 50
  MAIN_BRANCH     default: auto-detected from 'gh repo view'
EOF
}

[[ $# -eq 0 ]] || { usage; exit 1; }
[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && { usage; exit 0; }

command -v git    >/dev/null 2>&1 || die "git not found"
command -v gh     >/dev/null 2>&1 || die "gh not found"
command -v jq     >/dev/null 2>&1 || die "jq not found"
command -v claude >/dev/null 2>&1 || die "claude not found"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ -d "$repo_root/.git" ]] || die "'$repo_root' is not a git repo"
cd "$repo_root" || die "cd $repo_root failed"
gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run 'gh auth login'."

# Auto-detect default branch unless caller pinned one
if [[ -z "${MAIN_BRANCH:-}" ]]; then
  MAIN_BRANCH="$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || echo main)"
fi

log_dir="$repo_root/logs/auto-develop"
mkdir -p "$log_dir"

# Refuse to run on a dirty worktree — the checkout -B below would trample changes.
if ! git diff --quiet || ! git diff --cached --quiet; then
  die "wahlumfragen has uncommitted changes. Commit or stash before running."
fi

# Oldest open issue NOT labeled wip/blocked. jq-side filter is more robust than
# --search flag combinations across gh versions.
pick_next_issue() {
  # Older `gh` versions don't support `--sort`; use a search query instead.
  gh issue list \
    --state open \
    --search "sort:created-asc" \
    --limit 20 \
    --json number,title,body,labels \
    --jq '[.[] | select((.labels // []) | map(.name) | (index("wip") | not) and (index("blocked") | not))][0] // empty'
}

iteration=0
done_streak=0

while (( iteration < MAX_ITERATIONS )); do
  iteration=$((iteration + 1))
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  output_file="$log_dir/iter-${iteration}-${timestamp}.txt"

  echo ""
  echo "=== [wahlumfragen] Iteration $iteration / $MAX_ITERATIONS ==="

  issue_json="$(pick_next_issue)" || issue_json=""
  if [[ -z "$issue_json" ]]; then
    done_streak=$((done_streak + 1))
    echo "No eligible open issues ($done_streak/3)."
    (( done_streak >= 3 )) && { echo "3x empty — finished."; exit 0; }
    echo "Waiting 30s before retry..."
    sleep 30
    continue
  fi
  done_streak=0

  issue_number="$(printf '%s' "$issue_json" | jq -r '.number')"
  issue_title="$(printf '%s' "$issue_json"  | jq -r '.title')"
  echo "Working on #${issue_number}: ${issue_title}"

  # Fresh branch off up-to-date default
  branch_name="issue-${issue_number}"
  git fetch origin "$MAIN_BRANCH" || warn "git fetch origin $MAIN_BRANCH failed"
  if ! git checkout -B "$branch_name" "origin/$MAIN_BRANCH"; then
    warn "checkout $branch_name from origin/$MAIN_BRANCH failed. Skipping #${issue_number}."
    continue
  fi

  PROMPT=$(cat <<PROMPT_EOF
You are the Development Agent for the \`wahlumfragen\` repo — an aggregator for
Bundestag/Landtag polling data from dawum.de (Next.js, Drizzle, Postgres,
Vitest, Playwright).

Task: solve GitHub issue #${issue_number}.

Issue title: ${issue_title}
Issue body (JSON): ${issue_json}

Project context:
- You are running inside the repo. \`gh\` targets this repo's GitHub project.
- \`./AGENTS.md\` (included by \`./CLAUDE.md\`) is the source of truth. Read it
  before planning your fix — it documents the data-flow model (ingest write
  path vs. DB read path), the ISR/\`unstable_cache\` model with on-demand
  \`revalidateTag('surveys')\` invalidation, the Drizzle data layer, and the
  Postgres parameter-limit chunking rule. It may already warn you that the
  obvious approach will break something.

Workflow:
1. Read the issue. Read \`./AGENTS.md\`, \`./CLAUDE.md\`, \`./README.md\`, and
   any relevant area under \`src/\`.
2. Explore the relevant code before editing.
3. Implement the change following existing style.
4. Run the repo's checks and fix what breaks. Typically:
   - \`npm run lint\` and \`npm run typecheck\` (or \`tsc\`) if present
   - \`npm test\` / \`npx vitest run\` for unit tests
   - \`npx playwright test\` for e2e if the change is UI-facing
   - For schema changes: edit \`src/db/schema.ts\` → \`npm run db:generate\` →
     inspect the generated SQL in \`drizzle/\` → \`npm run db:migrate\`. Commit
     schema AND the generated migration together. NEVER use \`db:push\`.
5. Commit with a message referencing #${issue_number} (conventional commits:
   \`fix:\`, \`feat:\`, …).
6. Push the branch and open a PR:
   \`gh pr create --title "<title>" --body "Closes #${issue_number}\\n\\n<details>" --base ${MAIN_BRANCH}\`

Rules:
- Do everything via Bash yourself — don't ask the caller.
- Small focused commits, no unrelated changes.
- Do NOT make page routes \`force-dynamic\` if that defeats the caching, do NOT
  add a live-dawum fallback to the frontend, and do NOT use the live dawum
  client outside the ingest path — these are explicit AGENTS.md constraints.
- If the issue is unclear or blocked, comment on it via \`gh issue comment\` and
  output SKIP as the first and last word.
- On success: include the PR URL.
- On unrecoverable failure: output FAIL as the first and last word.
PROMPT_EOF
  )

  echo "Running Claude on #${issue_number}..."
  if ! claude --dangerously-skip-permissions -p "$PROMPT" >"$output_file" 2>&1; then
    warn "Claude exited non-zero on iteration $iteration."
  fi

  echo "Output: $output_file"

  first_word=""
  [[ -s "$output_file" ]] && first_word="$(awk '{ print $1; exit }' "$output_file" | tr '[:lower:]' '[:upper:]' | tr -cd '[:alnum:]_')"

  case "$first_word" in
    SKIP) echo "Issue #${issue_number} skipped (unclear/blocked)." ;;
    FAIL) warn "Issue #${issue_number} failed. See $output_file." ;;
    *)    echo "Issue #${issue_number} processed." ;;
  esac

  git checkout "$MAIN_BRANCH" 2>/dev/null || warn "could not return to $MAIN_BRANCH"
done

echo "Reached max iterations ($MAX_ITERATIONS). Stopping."
