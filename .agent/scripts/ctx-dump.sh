#!/usr/bin/env bash
# ctx-dump.sh — Prompt the agent to write a structured HANDOFF.md
# Usage: bash .agent/scripts/ctx-dump.sh [--message "optional note"]
# This script prints the handoff prompt for the agent to respond to.
# The agent writes HANDOFF.md — the script validates and stamps it.

set -euo pipefail

HANDOFF_FILE="HANDOFF.md"
NOTE="${1:-}"
DATE=$(date -u +"%Y-%m-%d %H:%M UTC")
SESSION_NUM=$(grep -c "^## Session" "$HANDOFF_FILE" 2>/dev/null || echo "0")
SESSION_NUM=$((SESSION_NUM + 1))

# ── Print the prompt for the agent ───────────────────────────────────────────
# When this command is invoked, the agent reads this output and responds
# by writing the handoff. The human (or hook) then runs ctx-dump-save.sh.

cat << PROMPT
# /ctx-dump — Session Handoff Request

Write a handoff note for this session and append it to HANDOFF.md.
Use EXACTLY this format — no deviations:

---

## Session $SESSION_NUM — $DATE
${NOTE:+> Note: $NOTE}

### State
<!-- What is the current state of the work? What's done, what's in progress? -->
[2–4 sentences, no bullet points]

### Decisions
<!-- Key decisions made THIS session and why. Only decisions, not implementation details. -->
- [Decision]: [reason]
- [Decision]: [reason]

### Next steps
<!-- Specific actionable tasks for the next session. Not vague intentions. -->
1. [Concrete step]
2. [Concrete step]
3. [Concrete step]

### Gotchas
<!-- Things the next session needs to know to avoid breaking something -->
- [gotcha or empty line if none]

### Files touched
<!-- List only files that were meaningfully changed this session -->
- [file path]

---

Hard limits:
- Total note must be under 400 words
- Next steps must be specific enough to act on without re-reading the session
- Do not summarise the entire project — only what changed THIS session
PROMPT

# ── Post-write validation ─────────────────────────────────────────────────────
# Run this check after the agent writes the file:
# bash .agent/scripts/ctx-dump.sh --validate

if [[ "${1:-}" == "--validate" ]]; then
  if [[ ! -f "$HANDOFF_FILE" ]]; then
    echo "✗ HANDOFF.md not found — agent did not write it"
    exit 1
  fi

  WORD_COUNT=$(wc -w < "$HANDOFF_FILE")
  if [[ $WORD_COUNT -gt 500 ]]; then
    echo "⚠ HANDOFF.md is ${WORD_COUNT} words — aim for under 400"
  fi

  if ! grep -q "### Next steps" "$HANDOFF_FILE"; then
    echo "✗ Missing '### Next steps' section"
    exit 1
  fi

  if ! grep -q "### Decisions" "$HANDOFF_FILE"; then
    echo "✗ Missing '### Decisions' section"
    exit 1
  fi

  echo "✓ HANDOFF.md validated — $WORD_COUNT words"
  echo "  Sessions logged: $SESSION_NUM"
fi
