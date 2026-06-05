#!/usr/bin/env bash
set -uo pipefail

# Auto-create GitHub issues in the wahlumfragen repo via Claude Code.
# Loops until Claude signals DONE 3 times in a row.

die()  { echo "ERROR: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

usage() {
  cat <<EOF
Usage: $(basename "$0")

Create GitHub issues in the wahlumfragen repo via Claude Code.

Runs in the repo this script lives in (must be a git repo with a GitHub
remote). Loops until Claude outputs DONE three times in a row.

Env (token/cost tuning):
  CLAUDE_MODEL   model alias passed to claude (default: sonnet; use 'opus' for
                 harder reasoning at higher cost)
  CLAUDE_EFFORT  effort level low|medium|high|xhigh|max (default: low)
EOF
}

[[ $# -eq 0 ]] || { usage; exit 1; }
[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && { usage; exit 0; }

normalize_word() { printf "%s" "${1:-}" | tr -cd '[:alnum:]_' | tr '[:lower:]' '[:upper:]'; }
first_word() { [[ -s "$1" ]] || return 0; awk '{ print $1; exit }' "$1"; }
last_word()  { [[ -s "$1" ]] || return 0; awk '{ for (i=1;i<=NF;i++) last=$i } END { print last }' "$1"; }

command -v git    >/dev/null 2>&1 || die "git not found"
command -v gh     >/dev/null 2>&1 || die "gh not found"
command -v claude >/dev/null 2>&1 || die "claude not found"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ -d "$repo_root/.git" ]] || die "'$repo_root' has no .git — not a git repo"

cd "$repo_root" || die "cd $repo_root failed"
gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run 'gh auth login'."

log_dir="$repo_root/logs/issue-creation"
mkdir -p "$log_dir"

# Token/cost tuning. Sonnet + low effort is plenty for issue triage; override
# CLAUDE_MODEL=opus / CLAUDE_EFFORT=medium when you want deeper reasoning.
MODEL="${CLAUDE_MODEL:-sonnet}"
EFFORT="${CLAUDE_EFFORT:-low}"
CLAUDE_FLAGS=(
  --dangerously-skip-permissions
  --model "$MODEL"
  --effort "$EFFORT"
  --exclude-dynamic-system-prompt-sections
)

# Pre-fetch the cheap repo state in bash so Claude doesn't burn agentic turns
# (each turn re-sends the whole context) re-running these gh queries itself.
repo_state() {
  echo "Open issues (number / title / labels):"
  gh issue list --state open  --limit 50 2>/dev/null || true
  echo
  echo "Recently closed issues:"
  gh issue list --state closed --limit 15 2>/dev/null || true
  echo
  echo "Available labels:"
  gh label list 2>/dev/null || true
}

PROMPT=$(cat <<'EOF'
You are the Issue Planning Agent for the `wahlumfragen` repo — an aggregator
for Bundestag/Landtag polling data from dawum.de (Next.js, Drizzle, Postgres,
Vitest, Playwright).

Context:
- You are running INSIDE the repo. `gh` targets this repo's GitHub project.
- `./AGENTS.md` (and `./CLAUDE.md`, which includes it) is the source of truth
  for the data-flow model (ingest vs. DB read path), the caching/ISR model,
  the Drizzle data layer, and the test layout. Read it before deciding —
  it describes hidden constraints that turn many "obvious" issues into
  non-issues.

Goal:
- Find exactly ONE actionable improvement or bug in the repo and create exactly
  ONE GitHub issue via `gh` yourself — do not ask the caller.

Required reading before deciding (in this order):
- ./AGENTS.md and ./CLAUDE.md (data flow, caching model, data layer, gotchas)
- ./README.md if it exists
- src/ — explore ONLY the area your candidate issue touches; don't read broadly

The current open issues, recently closed issues, and available labels are
provided below under "Current repo state" — use them to avoid duplicates and to
pick a label. Do NOT call `gh issue list` or `gh label list` yourself; they are
already fetched.

If AGENTS.md documents a constraint that makes a candidate "issue" a non-issue
(intentional design, already handled, documented gotcha), skip it and pick
something else. In particular: do NOT propose making page routes
`force-dynamic`, adding a live-dawum fallback to the frontend, or other things
AGENTS.md explicitly rules out.

Issue creation rules:
- Clear, concise title.
- Labels are REQUIRED. Pick at least one fitting label from the list below and
  pass it via `gh issue create --label <name>` (repeat `--label` for multiple).
  If truly nothing fits, create a new label with `gh label create` first, then
  use it — never create the issue without a label.
- Body must contain: Summary, Context, Acceptance Criteria checklist, References.

Termination:
- If no new issue remains, output DONE as both the first and last word.

Output:
- On success: include the issue number and URL.
- Otherwise: DONE … DONE.
EOF
)

iteration=0
done_streak=0

while true; do
  iteration=$((iteration + 1))
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  output_file="$log_dir/iter-${iteration}-${timestamp}.txt"

  echo "=== [wahlumfragen] Iteration $iteration ==="
  full_prompt="$PROMPT

--- Current repo state (pre-fetched — do NOT re-run these gh commands) ---
$(repo_state)"
  if ! claude "${CLAUDE_FLAGS[@]}" -p "$full_prompt" >"$output_file" 2>&1; then
    warn "Claude exited non-zero on iteration $iteration. Continuing."
  fi

  first_norm="$(normalize_word "$(first_word "$output_file")")"
  last_norm="$(normalize_word "$(last_word "$output_file")")"

  echo "Output: $output_file"

  if [[ "$first_norm" == "DONE" || "$last_norm" == "DONE" ]]; then
    done_streak=$((done_streak + 1))
    echo "DONE detected ($done_streak/3)."
    (( done_streak >= 3 )) && { echo "3x DONE — finished."; exit 0; }
  else
    (( done_streak > 0 )) && echo "DONE streak reset."
    done_streak=0
  fi
done
