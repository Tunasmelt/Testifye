# Feature 7: Synthetic Test Data Generator
Phase: 3 (Task 3.4) | Status: done | Pipeline: single non-streaming Generator (`fast_format`)
Last updated: 2026-11-08

## Overview
Generates scenario-based test data (valid / boundary / invalid / edge_case) for the form fields found in the project's screen maps. One POST, one JSON response — no SSE.

**Implementation status: faker not wired; generation is model-only.** `@faker-js/faker` is in `package.json` but is not imported anywhere (verified 2026-11-08: referenced only in `package.json`; decision pending: wire in or remove). The old “Faker factory” design (field type → `faker.*`) and CSV download are NOT implemented.

## Key files
- `src/app/dashboard/[projectId]/test-data/page.tsx`
- `src/app/dashboard/[projectId]/test-data/TestDataClient.tsx` — description + dataset-count inputs, category filter, per-scenario copy-to-clipboard
- `src/app/api/generate/test-data/route.ts` — POST; persists artifact inline
- `src/lib/ai/weaver.service.ts` — `generateTestData` (uses `generateWithFallback`)
- `src/lib/ai/prompts/test-data.ts` — system prompt + `buildTestDataPrompt`
- `src/lib/schemas/test-data.ts` — `TestDataOutputSchema`

## Request / response
- Body: `{ projectId, projectDescription?, datasetCount? }`; count clamped to 1–20 (default 5). Description falls back to project description, then name.
- Response: `{ data: TestDataOutput, provider, model }`; AI failure → 502. Artifact saved as `test_data`, `is_verified: false`.

## Output (src/lib/schemas/test-data.ts)
```
scenarios[]: { scenario_id (DS-001…), name, category: valid|boundary|invalid|edge_case,
               description, expected_outcome,
               fields[]: { field_name, field_type: text|email|password|phone|number|date|select|boolean|file,
                           value, notes? } }
total_count, coverage_summary, fields_identified[]
```
Not a row/column table; no locale or edge-case-ratio inputs.

## Gotchas
- `fast_format` (llama-3.1-8b-instant) — fast but weaker field detection.
- UI counts `scenarios.length`, not the model-reported `total_count` (can differ).
- Screen maps are optional input (route does not 422 without them); the description drives the prompt.
- Category colors in the client use hex literals with alpha suffixes (`+ '22'`) — see design-system.md exception.
- Route holds persistence logic (longer than the thin-route guideline).

## Planned
- Wire faker for deterministic values, locale support, CSV/JSON download (Task 3.5 export covers test cases only today).

## Do not
- Do not document faker behavior as shipped.
