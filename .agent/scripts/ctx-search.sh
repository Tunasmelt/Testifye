#!/usr/bin/env bash
# ctx-search.sh — Search the symbol index without reading files
# Usage: bash .agent/scripts/ctx-search.sh "query" [--kind ts|py|rs|go] [--limit 10]
# Output: file:line — symbol (kind)  — one result per line, most relevant first
# Compatible with: Claude Code, Cursor, Windsurf, Copilot, any bash-capable agent

set -euo pipefail

INDEX="${INDEX_FILE:-.agent/index.json}"
QUERY=""
KIND_FILTER=""
LIMIT=15

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --kind)  KIND_FILTER="$2"; shift 2 ;;
    --limit) LIMIT="$2";       shift 2 ;;
    --index) INDEX="$2";       shift 2 ;;
    --help)
      echo "Usage: ctx-search.sh <query> [--kind ts|py|rs|go] [--limit N]"
      echo "Example: ctx-search.sh 'auth token' --kind ts --limit 5"
      exit 0 ;;
    *)
      QUERY="$QUERY $1"; shift ;;
  esac
done

QUERY=$(echo "$QUERY" | xargs)  # trim whitespace

# ── Validate ──────────────────────────────────────────────────────────────────
if [[ -z "$QUERY" ]]; then
  echo "Error: provide a search query"
  echo "Usage: ctx-search.sh <query> [--kind ts|py|rs|go]"
  exit 1
fi

if [[ ! -f "$INDEX" ]]; then
  echo "Error: index not found at $INDEX"
  echo "Run /ctx-map to build it first."
  exit 1
fi

# ── Check python3 available ───────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  # Fallback: grep-based search (less accurate, no ranking)
  echo "# python3 not found — using grep fallback"
  PATTERN=$(echo "$QUERY" | tr ' ' '|')
  grep -i "$PATTERN" "$INDEX" | grep '"symbol"' | head -"$LIMIT" \
    | sed -E 's/.*"file":"([^"]+)","line":([0-9]+),"symbol":"([^"]+)","kind":"([^"]+)".*/\1:\2 — \3 (\4)/'
  exit 0
fi

# ── Python-based ranked search ────────────────────────────────────────────────
python3 - "$INDEX" "$QUERY" "$KIND_FILTER" "$LIMIT" << 'PYEOF'
import json, sys, re

index_path, query, kind_filter, limit = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])

with open(index_path) as f:
    data = json.load(f)

symbols = data.get("symbols", [])
terms = query.lower().split()

def score(entry):
    sym = entry["symbol"].lower()
    file = entry["file"].lower()
    s = 0
    for term in terms:
        if term == sym:           s += 10   # exact match
        elif sym.startswith(term): s += 6    # prefix match
        elif term in sym:          s += 4    # substring match
        elif term in file:         s += 2    # file path match
    return s

results = [e for e in symbols if score(e) > 0]

# apply kind filter
if kind_filter:
    results = [e for e in results if e.get("kind") == kind_filter]

# sort by score desc, then by symbol name asc
results.sort(key=lambda e: (-score(e), e["symbol"]))
results = results[:limit]

if not results:
    print(f"No matches for: {query}")
    if kind_filter:
        print(f"(filtered by kind: {kind_filter})")
    sys.exit(0)

print(f"# {len(results)} result(s) for '{query}'")
print()
for e in results:
    print(f"{e['file']}:{e['line']} — {e['symbol']} ({e['kind']})")

PYEOF
