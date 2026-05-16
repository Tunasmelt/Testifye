# Feature 4: Requirement Gap Finder
Phase: 3 | Pipeline: Generator with long_context model

## What it does
User uploads a PRD (PDF/DOCX/text) → AI compares it against actual UI ScreenElementMaps → identifies requirements missing from UI, UI features undocumented in PRD, and ambiguous requirements.

## Key files
- `src/app/api/generate/gap-analysis/route.ts` — Route handler (handles doc parsing)
- `src/lib/schemas/gap-analysis.ts` — GapAnalysisOutputSchema (source of truth: SCHEMA.md)
- `src/lib/utils/doc-parser.ts` — PDF/DOCX/text extraction pipeline
- `src/components/features/GapFinderPage.tsx` — feature page with PRD upload zone
- `src/components/generation/GapFindingCard.tsx` — single gap with type badge

## Document processing pipeline
```
User uploads file
  ├─ .pdf → pdfjs-dist extracts text layer
  │         └─ No text layer (scanned)? → tesseract.js OCR (lazy-loaded)
  ├─ .docx → mammoth extracts text
  └─ .txt/.md → direct use
```

## OCR strategy (Tesseract.js — lazy load)
```typescript
// Only imported when scanned PDF detected — heavy library
async function runOCR(pages: Blob[]): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  // Single worker for ALL pages — more efficient than one worker per page
  const results = await Promise.all(pages.map(p => worker.recognize(p)));
  await worker.terminate();
  return results.map(r => r.data.text).join('\n\n');
}
```

## Output fields (from SCHEMA.md GapAnalysisOutputSchema)
Each `GapFindingSchema` item has:
```
id:              GAP-001
type:            missing_from_ui | undocumented_feature | ambiguous_requirement
                 | contradiction | untestable | undefined_error_state | coverage_gap
prd_section:     string (e.g. "Section 4.2")
prd_text:        string (quoted from PRD)
ui_screen:       string | null (which screen, if applicable)
severity:        critical | high | medium | low
description:     string
suggestion:      string
confidence:      0.0–1.0 (AI confidence in the finding)
```

## Gap type descriptions
| Type | When |
|---|---|
| missing_from_ui | Requirement in PRD, not visible in any screenshot |
| undocumented_feature | UI element exists, not mentioned in PRD |
| ambiguous_requirement | PRD text too vague to verify either way |
| contradiction | PRD says X, UI does Y |
| untestable | Requirement cannot be tested from UI alone |
| undefined_error_state | UI flow has an unhandled error path |
| coverage_gap | Testing coverage missing for a feature area |

## Dependencies to install (Phase 3)
```bash
npm install pdfjs-dist mammoth
# tesseract.js — lazy loaded, no explicit install needed in Next.js bundle
```

## Edge cases
| Scenario | Handling |
|---|---|
| Scanned PDF (no text layer) | Auto-detect, lazy-load Tesseract.js |
| Very long PRD (>20K tokens) | Chunk + summarize via long_context model (gemini-2.5-flash) |
| No screenshots | Analyze PRD only; note: "No UI to compare against" |
| Password-protected PDF | Error: "Password-protected PDFs not supported" |

## Gotchas
- `confidence` field lets the Judge surface low-confidence findings differently (show uncertainty badge)
- `contradiction` type is new (from gap analysis) — don't miss it
- Long PRDs must be chunked BEFORE sending to AI — context budget is 14K tokens
