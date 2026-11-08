# Feature 4: Requirement Gap Finder
Phase: 3 (Tasks 3.1, 3.2) | Status: done | Pipeline: single NON-streaming Generator (`long_context`); no Judge
Last updated: 2026-11-08

## Overview
User uploads a PRD (PDF/DOCX/TXT) or pastes text → AI compares it with analyzed screen element maps → returns requirement gaps.

## Key files
- `src/app/dashboard/[projectId]/gap-analysis/page.tsx` + `GapAnalysisClient.tsx` — Upload File / Paste Text tabs, summary bar (7 counts), finding list
- `src/app/api/generate/gap-analysis/route.ts` — multipart POST; persists artifact inline
- `src/lib/services/document.service.ts` — `extractDocumentText` (pdfjs-dist, mammoth, tesseract.js OCR fallback); server-only
- `src/lib/ai/weaver.service.ts` — `generateGapAnalysis`; `src/lib/ai/prompts/gap-analysis.ts`
- `src/lib/schemas/gap-analysis.ts` — `GapAnalysisOutputSchema`
- (Not `src/lib/utils/doc-parser.ts`, `src/components/features/*`, or `src/components/generation/*` — none exist.)

## Request / response
- `POST /api/generate/gap-analysis` multipart: `projectId`, and `file` (.pdf/.docx/.doc/.txt, max 20 MB → 413) OR `text`. Returns `{ analysis, provider, model, extractedChars }`. `maxDuration = 120`.
- Errors: 422 on extraction failure, no readable text, or under 50 chars; 502 on AI failure.
- Saved as `artifact_type: 'gap_analysis'`, `input_snapshot { prd_chars, file_name }`, `is_verified: false`.

## Document pipeline (Tasks 3.1/3.2)
```
.pdf  → pdfjs-dist text layer; any page with <50 chars and <5 words → rendered to a temp PNG → tesseract.js OCR (lazy WASM, one worker, then terminated)
.docx/.doc → mammoth
other → UTF-8 text
```
`ExtractionResult.method`: pdf_text | pdf_ocr | docx | plaintext.

## Output (src/lib/schemas/gap-analysis.ts)
```
findings[]: { id (GAP-01…),
              type: contradiction | missing_flow | ambiguity | untestable
                    | undefined_error_state | missing_from_ui | undocumented_feature,
              severity: critical | high | medium | low,
              location (PRD section ref), description, suggestion }
requirements_count
summary: { contradictions, missing_flows, ambiguities, untestable,
           undefined_error_states, missing_from_ui, undocumented_features }   // 7 counts
```
No `confidence`, `prd_text`, `ui_screen`, `ambiguous_requirement`, or `coverage_gap` fields/types.

## Gotchas
- PRD text is hard-truncated to the first 12,000 characters in the prompt builder (`prdText.slice(0, 12000)`); there is NO chunk/summarize step. Long PRDs lose their tail silently.
- `long_context` maps to `mixtral-8x7b-32768` on Groq (Gemini fallback only if extended providers are enabled).
- No screenshots → still runs; screen-map summary is just empty.
- Password-protected PDFs surface as a generic extraction failure (422), not a dedicated message.
- Launch Readiness weights `gap_analysis` critical findings (20% per critical).
- Gap Finder `summary` is the source of the 7-count UI bar; keep schema and UI keys in sync.
