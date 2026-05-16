#!/usr/bin/env bash
# ctx-scope.sh — Set a temporary file-read scope for the current session
# Usage: bash .agent/scripts/ctx-scope.sh [paths...] [--clear] [--show]
# Creates .agent/scope.json — agents that respect it will only read listed dirs
# Claude Code: pair this with permissions.allow in settings.json for hard enforcement

set -euo pipefail

SCOPE_FILE=".agent/scope.json"
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Parse args ────────────────────────────────────────────────────────────────
if [[ $# -eq 0 ]]; then
  echo "Usage: ctx-scope.sh <path1> [path2 ...] [--clear] [--show]"
  echo "Example: ctx-scope.sh src/lib/auth/ src/hooks/ src/types/"
  echo ""
  echo "  --clear   Remove scope restriction (allow all reads)"
  echo "  --show    Print current scope"
  exit 0
fi

if [[ "${1:-}" == "--clear" ]]; then
  rm -f "$SCOPE_FILE"
  echo "✓ Scope cleared — all files accessible"
  exit 0
fi

if [[ "${1:-}" == "--show" ]]; then
  if [[ -f "$SCOPE_FILE" ]]; then
    echo "Current scope (set $(python3 -c "import json; d=json.load(open('$SCOPE_FILE')); print(d['set_at'])" 2>/dev/null || echo "?")):"
    python3 -c "
import json
d = json.load(open('$SCOPE_FILE'))
for p in d['paths']:
    print(f'  → {p}')
" 2>/dev/null || cat "$SCOPE_FILE"
  else
    echo "No scope set — all files accessible"
  fi
  exit 0
fi

# ── Build scope ───────────────────────────────────────────────────────────────
PATHS=("$@")
VALIDATED=()

for path in "${PATHS[@]}"; do
  # Strip leading ./
  path="${path#./}"
  
  if [[ -e "$path" ]]; then
    VALIDATED+=("$path")
    echo "  + $path"
  else
    echo "  ⚠ Not found: $path (still including — may be created this session)"
    VALIDATED+=("$path")
  fi
done

# Build JSON array
JSON_PATHS=$(printf '"%s",' "${VALIDATED[@]}")
JSON_PATHS="[${JSON_PATHS%,}]"

mkdir -p .agent
cat > "$SCOPE_FILE" << EOF
{
  "set_at": "$DATE",
  "paths": $JSON_PATHS,
  "note": "Agents should read files ONLY from these paths this session. Run ctx-scope --clear to remove."
}
EOF

echo ""
echo "✓ Scope set — ${#VALIDATED[@]} path(s)"
echo "  Agent reads restricted to scoped directories."
echo "  Run: ctx-scope.sh --show  to review"
echo "  Run: ctx-scope.sh --clear  when task is done"
echo ""
echo "# Paste this into your session prompt:"
echo "# 'This session is scoped to: ${VALIDATED[*]}. Do not read files outside these paths.'"
