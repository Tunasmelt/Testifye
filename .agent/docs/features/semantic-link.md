# Feature 5: Semantic Link Engine
Phase: 3 | Pipeline: Scout + Generator

## What it does
Maps PRD sections to specific UI screens, creating a bidirectional traceability matrix. Answers "Which screen implements requirement 4.2?" and "Which requirement justifies this button?".

## Key files
- `src/app/api/generate/semantic-link/route.ts`
- `src/lib/schemas/semantic-link.ts` — SemanticLinkSchema (source of truth: SCHEMA.md)
- `src/components/features/SemanticLinkPage.tsx`
- `src/components/generation/TraceabilityMatrix.tsx` — visual matrix table

## Output fields (from SCHEMA.md SemanticLinkSchema)
```
prd_section:    string  (e.g. "Section 3.1 — Payment Flow")
prd_text:       string  (quoted requirement text)
screen_label:   string  (which project_asset)
element_labels: string[]  (ScreenElementMap labels on that screen)
confidence:     0.0–1.0
status:         verified | missing | mismatch | untested
rationale:      string  (why this link was made)
```

## Status values (CRITICAL — match SCHEMA.md)
| Status | Meaning |
|---|---|
| verified | Requirement clearly present in UI |
| missing | Requirement in PRD, NO matching UI element found |
| mismatch | UI exists but contradicts the requirement |
| untested | Can't determine from available screenshots |

> ⚠ SCHEMA.md uses `verified | missing | mismatch | untested` — NOT `linked | unverified | missing_ui | missing_prd` (old SCOPE.md values — SCHEMA.md wins).

## TraceabilityMatrix component
- Table: rows = PRD sections, columns = screens
- Cell color: green (verified), red (missing), yellow (mismatch), grey (untested)
- Click cell → expands to show prd_text, element_labels, rationale, confidence bar
- Export: "Download as CSV" (rows = links)

## Gotchas
- Requires both PRD (from Gap Finder feature) AND at least 1 screenshot with a Scout map
- `confidence < 0.6` → show uncertainty badge on the link
- Status is `missing` not `missing_ui` or `missing_prd` (unified in updated schema)
