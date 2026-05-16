# Export Engine
Last updated: 2026-05-09

## Overview
Export is a **first-class sidebar navigation item** (not a hidden button). It renders as a full page at the 'export' nav route. The engine supports 6 formats across all artifact types, with a bundle builder that lets users pick which artifacts to include.

## Key files
- `src/lib/services/export.service.ts` — toMarkdown, toJSON, toCSV, toBundleBlob
- `src/components/features/ExportPage.tsx` — full export page with format cards and bundle builder
- `src/app/dashboard/[projectId]/export/page.tsx` — route
- Inline export buttons on feature pages call export.service directly

## Format support by phase

| Format | Phase | Artifact types | Method |
|---|---|---|---|
| Markdown (.md) | 1 | All | Template rendering |
| JSON (.json) | 1 | All | Raw Zod output serialized |
| CSV (.csv) | 1 | Test Cases, UX Issues, Bugs | json2csv library |
| Gherkin (.feature) | 2 | Test Cases only | GROQ 8B reformatting |
| Jira Markup | 3 | Test Cases, Bugs | API integration |
| Linear | 3 | Test Cases, Bugs | API integration |

## ExportPage layout
1. **Format cards** — 3-column grid, one per format (icon, name, description, Download button)
2. **"What's included" section** — toggle switches per artifact type:
   - Test cases, UX issues, Bug reports, PRD findings, Persona friction, Test data
3. **"Download Bundle" CTA** — zips all enabled artifacts in selected format

## Bundle builder
```typescript
// export.service.ts
async function toBundleBlob(
  artifacts: Record<string, unknown>,
  formats: string[]   // e.g. ['markdown', 'json']
): Promise<Blob>
// Returns a ZIP blob — download via URL.createObjectURL
```

## Inline export (secondary — on feature pages)
- TestCaseList header row: "Copy as Markdown" (clipboard) + "Download JSON" (file)
- UXReviewPanel: "Download PDF Summary" (Phase 3)
- BugReportCard: "Copy as Jira" / "Copy as Linear" (Phase 3)

## Gherkin generation (Phase 2)
Uses `fast_format` model (llama-3.1-8b) to reformat TestSuiteOutput:
```
Given [preconditions]
When [action steps]
Then [expected result]
```
Output is streamed into a `.feature` file download.

## Gotchas
- Export page reads from the **latest** generated_artifacts (is_latest=TRUE) — not the full history
- CSV needs `npm install json2csv` — add in Phase 1 scaffold even if not used until Phase 2
- Bundle ZIP is assembled client-side — large projects (>50 test cases) can be slow; show progress
- Gherkin export calls the AI — it will consume rate limit quota

## Do not
- Add Jira/Linear OAuth in Phase 1 — just show the tab UI (disabled) as a placeholder
- Store export history in DB — exports are stateless operations
