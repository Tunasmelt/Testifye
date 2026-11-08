# Export Engine
Last updated: 2026-11-08

## Overview
Export is a first-class sidebar item rendering a full page. Implemented formats are all **client-side, deterministic text conversions of the TEST SUITE only** (Phase 1 Task 1.15 + Task 2.7 Gherkin + Task 3.5 CSV). No AI call, no server round-trip, no ZIP bundle, no Jira/Linear API.

## Key files
- `src/lib/services/export.service.ts` — `ExportFormat = 'markdown'|'csv'|'json'|'gherkin'|'jira'|'linear'`; `exportSuite` (download), `formatSuite` (string for copy), `buildExportBundle` (returns `Record<ExportFormat,string>`; unused by the UI)
- `src/app/dashboard/[projectId]/export/page.tsx` + `ExportClient.tsx` — format cards (Download / Copy), “What's included” toggles
- `src/app/dashboard/[projectId]/test-cases/TestCasesClient.tsx` — inline Export dropdown (Gherkin, Markdown, CSV, JSON)
- `src/app/dashboard/[projectId]/bug-reports/BugReportsClient.tsx` — per-bug Plain / Jira / Linear text + Copy
- (`src/app/api/export/` is an empty folder; no `ExportPage.tsx`; no `toBundleBlob`.)

## Formats
| Format | Output | Method |
|---|---|---|
| Markdown `.md` | headings per TC with steps | template string |
| JSON `.json` | suite serialized | `JSON.stringify` |
| CSV `.csv` | one row per TC | hand-written `toCsv` (the `json2csv` package is installed but unused — verified 2026-11-08: referenced only in `package.json`; decision pending: wire in or remove) |
| Gherkin `.feature` | Feature/Scenario, Given=preconditions, When=actions, Then=expected | pure string builder (NOT the AI model) |
| Jira markup `.txt` | Jira wiki text | string builder; paste-ready, no API |
| Linear `.md` | Markdown issue text | string builder; no API |

File name: `{safe-project-name}-tests.{ext}`; Export page currently passes the literal name `'project'`.

## Export page behavior (gotchas)
- Source of data is the in-memory `useGenerationStore.cases`, NOT the database. After a reload or direct navigation the page says “No artifacts yet” until test cases are regenerated in the same session. It does not read `generated_artifacts`.
- The “What's included” toggles (test cases, UX issues, bug reports, PRD findings, persona friction, test data) are UI-only: counts for everything except test cases are hard-coded 0, and toggles do not change the output. Only the test suite is exported.
- “Download Bundle” / ZIP is not implemented.
- Task 3.5 “Full Export” is therefore **CSV (+ the other text formats) for test cases only**; Jira/Linear API push is not shipped.

## Do not
- Claim Gherkin consumes AI quota — it doesn't.
- Add Jira/Linear OAuth/API-key flows without resolving the open decision in CLAUDE.md.
- Store export history in the DB.
