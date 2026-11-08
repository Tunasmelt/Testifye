# Feature 5: Semantic Link Engine
Phase: 3 (Task 3.3) | Status: done | Pipeline: single NON-streaming Generator (`reasoning_large`); uses stored screen maps, no Judge
Last updated: 2026-11-08

## Overview
Maps each PRD requirement to a UI element/screen, producing a requirement → element traceability list with a status per requirement.

## Key files
- `src/app/dashboard/[projectId]/semantic-link/page.tsx` + `SemanticLinkClient.tsx` — PRD upload/paste, summary tiles (click to filter), status filter, per-link rows with confidence %, stale-prompt nudge
- `src/app/api/generate/semantic-link/route.ts` — multipart POST; persists artifact inline
- `src/lib/ai/weaver.service.ts` — `generateSemanticLink`; `src/lib/ai/prompts/semantic-link.ts`
- `src/lib/services/document.service.ts` — shared PDF/DOCX/OCR extraction (same as Gap Finder)
- `src/lib/schemas/semantic-link.ts` — `SemanticLinkOutputSchema`
- (No `TraceabilityMatrix.tsx`, `SemanticLinkPage.tsx` or `src/components/features|generation/*` exist.)

## Request / response
- `POST /api/generate/semantic-link` multipart: `projectId` + `file` (max 20 MB) or `text`. Returns `{ output, provider, model, extractedChars }`. 422 for extraction failures / empty / under 50 chars; 502 on AI failure. `maxDuration = 120`.
- Saved as `artifact_type: 'semantic_link'`, `is_verified: false`.

## Output (src/lib/schemas/semantic-link.ts)
```
links[]: { req, loc (PRD section ref), element|null, screen|null,
           status: verified | missing | mismatch | untested,
           confidence: 0–1, note? }
summary: { verified, missing, mismatch, untested }
```
Not `prd_section`/`prd_text`/`element_labels`/`rationale`.

| Status | Meaning |
|---|---|
| verified | Requirement clearly present in UI |
| missing | In PRD, no matching UI element (`element`/`screen` null) |
| mismatch | UI exists but contradicts the requirement |
| untested | Cannot be determined from the screens analyzed |

## Gotchas
- UI is a filterable list of rows, not a rows×screens colour matrix; no CSV download exists.
- PRD text is truncated to the first 10,000 chars in the prompt (`slice(0, 10000)`); no chunking.
- The PRD is supplied again here (upload/paste), not reused from Gap Finder.
- Works with zero screenshots, but everything then trends to `missing`/`untested`.
- Old SCOPE statuses (`linked`, `unverified`, `missing_ui`, `missing_prd`) are wrong; use the four above.
- No low-confidence badge threshold is implemented; the UI just prints the percentage.
