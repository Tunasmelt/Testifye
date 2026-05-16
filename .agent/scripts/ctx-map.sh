#!/usr/bin/env bash
# ctx-map.sh — Build .agent/index.json symbol index
# Supports: JS/TS, Python, Rust, Go, and any language with grep-able exports
# Usage: bash .agent/scripts/ctx-map.sh [--root ./src] [--out .agent/index.json]
# Compatible with: Claude Code, Cursor, Windsurf, any agent with bash access

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
ROOT="${1:-./src}"          # directory to index (override with --root)
OUT="${2:-.agent/index.json}"
IGNORE_DIRS=("node_modules" "dist" "build" ".next" "__pycache__" "target" ".git" "coverage")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Parse flags ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --root) ROOT="$2"; shift 2 ;;
    --out)  OUT="$2";  shift 2 ;;
    --help) echo "Usage: ctx-map.sh [--root DIR] [--out FILE]"; exit 0 ;;
    *) shift ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
json_escape() {
  printf '%s' "$1" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" 2>/dev/null \
    || printf '"%s"' "$1"
}

build_ignore_args() {
  local args=()
  for dir in "${IGNORE_DIRS[@]}"; do
    args+=("--exclude-dir=$dir")
  done
  echo "${args[@]}"
}

# ── Extraction patterns ────────────────────────────────────────────────────────
# Each language block outputs: FILE:LINE:SYMBOL_NAME:KIND
extract_symbols() {
  local ignore_args
  ignore_args=$(build_ignore_args)

  # TypeScript / JavaScript
  grep -rn $ignore_args \
    -E "^export (default )?(function|class|const|let|var|type|interface|enum|async function) [A-Za-z_][A-Za-z0-9_]*" \
    "$ROOT" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null \
    | sed -E 's/^([^:]+):([0-9]+):.*export (default )?(async function|function|class|const|let|var|type|interface|enum) ([A-Za-z_][A-Za-z0-9_]*).*/\1:\2:\5:ts/' \
  || true

  # Python
  grep -rn $ignore_args \
    -E "^(def |class |async def )[A-Za-z_][A-Za-z0-9_]*" \
    "$ROOT" --include="*.py" 2>/dev/null \
    | sed -E 's/^([^:]+):([0-9]+):(def |class |async def )([A-Za-z_][A-Za-z0-9_]*).*/\1:\2:\4:py/' \
  || true

  # Rust
  grep -rn $ignore_args \
    -E "^pub (fn|struct|enum|trait|type|const) [A-Za-z_][A-Za-z0-9_]*" \
    "$ROOT" --include="*.rs" 2>/dev/null \
    | sed -E 's/^([^:]+):([0-9]+):pub (fn|struct|enum|trait|type|const) ([A-Za-z_][A-Za-z0-9_]*).*/\1:\2:\4:rs/' \
  || true

  # Go
  grep -rn $ignore_args \
    -E "^func [A-Za-z_][A-Za-z0-9_]*" \
    "$ROOT" --include="*.go" 2>/dev/null \
    | sed -E 's/^([^:]+):([0-9]+):func ([A-Za-z_][A-Za-z0-9_]*).*/\1:\2:\3:go/' \
  || true
}

# ── Build JSON ────────────────────────────────────────────────────────────────
echo "→ Scanning $ROOT ..."

mkdir -p "$(dirname "$OUT")"

SYMBOLS=$(extract_symbols)
COUNT=0
JSON_ENTRIES=""

while IFS=: read -r file line symbol kind; do
  [[ -z "$symbol" ]] && continue
  [[ -z "$file" ]]   && continue

  ENTRY=$(printf '{"file":"%s","line":%s,"symbol":"%s","kind":"%s"}' \
    "$file" "$line" "$symbol" "$kind")

  if [[ -z "$JSON_ENTRIES" ]]; then
    JSON_ENTRIES="$ENTRY"
  else
    JSON_ENTRIES="$JSON_ENTRIES,$ENTRY"
  fi
  COUNT=$((COUNT + 1))
done <<< "$SYMBOLS"

cat > "$OUT" << EOF
{
  "_meta": {
    "generated": "$TIMESTAMP",
    "root": "$ROOT",
    "symbol_count": $COUNT,
    "version": "1.0"
  },
  "symbols": [$JSON_ENTRIES]
}
EOF

echo "✓ Index built — $COUNT symbols → $OUT"
echo "  Run /ctx-search to query it."
