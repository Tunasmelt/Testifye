#!/usr/bin/env bash
# ctx-audit.sh — Context health check and session report
# Usage: bash .agent/scripts/ctx-audit.sh
# Prints: index freshness, file counts, HANDOFF.md status, warnings
# Compatible with: Claude Code, Cursor, any bash-capable agent

set -euo pipefail

INDEX=".agent/index.json"
HANDOFF="HANDOFF.md"
IGNORE_DIRS=("node_modules" "dist" "build" ".next" "__pycache__" "target")

# ── Colours (safe fallback if no tty) ─────────────────────────────────────────
if [ -t 1 ]; then
  RED="\033[0;31m"; YELLOW="\033[0;33m"; GREEN="\033[0;32m"
  CYAN="\033[0;36m"; RESET="\033[0m"; BOLD="\033[1m"
else
  RED=""; YELLOW=""; GREEN=""; CYAN=""; RESET=""; BOLD=""
fi

warn()    { echo -e "${YELLOW}⚠  $*${RESET}"; }
ok()      { echo -e "${GREEN}✓  $*${RESET}"; }
info()    { echo -e "${CYAN}→  $*${RESET}"; }
section() { echo -e "\n${BOLD}$*${RESET}"; }

# ── Header ────────────────────────────────────────────────────────────────────
echo -e "${BOLD}ctx-audit — $(date -u +"%Y-%m-%d %H:%M UTC")${RESET}"
echo "────────────────────────────────────"

# ── Index status ──────────────────────────────────────────────────────────────
section "Symbol Index"
if [[ ! -f "$INDEX" ]]; then
  warn "No index found at $INDEX"
  echo "  Run /ctx-map to build it."
else
  GENERATED=$(python3 -c "import json; d=json.load(open('$INDEX')); print(d['_meta']['generated'])" 2>/dev/null || echo "unknown")
  COUNT=$(python3 -c "import json; d=json.load(open('$INDEX')); print(d['_meta']['symbol_count'])" 2>/dev/null || echo "?")
  
  # Check if index is stale (>4 hours old)
  if command -v python3 &>/dev/null; then
    STALE=$(python3 -c "
from datetime import datetime, timezone
import json
try:
    d = json.load(open('$INDEX'))
    gen = datetime.fromisoformat(d['_meta']['generated'].replace('Z','+00:00'))
    age_h = (datetime.now(timezone.utc) - gen).total_seconds() / 3600
    print('stale' if age_h > 4 else 'fresh')
except:
    print('unknown')
")
    if [[ "$STALE" == "stale" ]]; then
      warn "Index is stale (>4h) — run /ctx-map to refresh"
    else
      ok "Index fresh — $COUNT symbols — generated $GENERATED"
    fi
  else
    ok "Index exists — $COUNT symbols"
  fi
fi

# ── Handoff status ────────────────────────────────────────────────────────────
section "Session Continuity"
if [[ ! -f "$HANDOFF" ]]; then
  warn "No HANDOFF.md — this appears to be a fresh start"
  info "Run /ctx-dump at end of session to create one"
else
  SESSIONS=$(grep -c "^## Session" "$HANDOFF" 2>/dev/null || echo 0)
  LAST_DATE=$(grep "^## Session" "$HANDOFF" 2>/dev/null | tail -1 | sed 's/## Session [0-9]* — //')
  ok "HANDOFF.md exists — $SESSIONS session(s) logged"
  info "Last session: $LAST_DATE"
fi

# ── File counts ───────────────────────────────────────────────────────────────
section "Codebase"
IGNORE_FIND=()
for d in "${IGNORE_DIRS[@]}"; do
  IGNORE_FIND+=(-not -path "*/$d/*")
done

TS_COUNT=$(find . "${IGNORE_FIND[@]}" -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | xargs)
JS_COUNT=$(find . "${IGNORE_FIND[@]}" -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l | xargs)
PY_COUNT=$(find . "${IGNORE_FIND[@]}" -name "*.py" 2>/dev/null | wc -l | xargs)
RS_COUNT=$(find . "${IGNORE_FIND[@]}" -name "*.rs" 2>/dev/null | wc -l | xargs)
GO_COUNT=$(find . "${IGNORE_FIND[@]}" -name "*.go" 2>/dev/null | wc -l | xargs)

[[ $TS_COUNT -gt 0 ]] && info "TypeScript/JS: $((TS_COUNT + JS_COUNT)) files"
[[ $PY_COUNT -gt 0 ]] && info "Python: $PY_COUNT files"
[[ $RS_COUNT -gt 0 ]] && info "Rust: $RS_COUNT files"
[[ $GO_COUNT -gt 0 ]] && info "Go: $GO_COUNT files"

# ── Git status ────────────────────────────────────────────────────────────────
section "Git"
if command -v git &>/dev/null && git rev-parse --git-dir &>/dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
  DIRTY=$(git status --porcelain 2>/dev/null | wc -l | xargs)
  LAST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null || echo "no commits")
  
  if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
    warn "On $BRANCH branch — consider switching to a feature branch"
  else
    ok "Branch: $BRANCH"
  fi
  
  [[ $DIRTY -gt 0 ]] && warn "$DIRTY uncommitted change(s)" || ok "Working tree clean"
  info "Last commit: $LAST_COMMIT"
else
  warn "Not a git repository"
fi

# ── .agent config health ──────────────────────────────────────────────────────
section ".agent Config"
[[ -f ".agent/settings.json" ]] && ok "settings.json found" || warn "No settings.json — hooks not configured"
[[ -d ".agent/commands"      ]] && ok "commands/ directory exists" || warn "No commands/ — slash commands not set up"
[[ -d ".agent/scripts"       ]] && ok "scripts/ directory exists" || warn "No scripts/"
[[ -d ".agent/docs"          ]] && ok "docs/ directory exists" || warn "No docs/ — create pointer files here"

# ── Recommendations ───────────────────────────────────────────────────────────
section "Recommendations"
echo "Before starting work:"
[[ ! -f "$HANDOFF"           ]] && echo "  • Run /ctx-load if continuing previous work" || echo "  • Read HANDOFF.md ✓"
[[ ! -f "$INDEX"             ]] && echo "  • Run /ctx-map to build symbol index"
echo "  • State session goal in one sentence"
echo "  • Run /ctx-scope to restrict reads to relevant dirs"
echo ""
echo "────────────────────────────────────"
echo "Run /ctx-search <query> to find symbols without reading files."
