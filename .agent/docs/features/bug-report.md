# Feature 3: Bug Report Formatter
Phase: 2 (Task 2.5) | Status: done | Pipeline: single NON-streaming Generator (`fast_format`); no Scout, no Judge
Last updated: 2026-11-08

## Overview
User describes a bug in plain language → AI returns one structured bug report (severity, priority, inferred steps, environment, root-cause hypothesis). Reports accumulate in the page's local list; each is copy-able as Plain Text / Jira markup / Linear markdown.

## Key files
- `src/app/dashboard/[projectId]/bug-reports/page.tsx` + `BugReportsClient.tsx` — form (description + optional platform/os/browser/appVersion/component), report cards, Plain/Jira/Linear tab + Copy; `toJira`/`toLinear` formatters live in the client file
- `src/app/api/generate/bug-report/route.ts` — plain JSON POST; persists artifact inline
- `src/lib/ai/weaver.service.ts` — `generateBugReport` (uses `generateWithFallback`, renumbers `bug_id`)
- `src/lib/ai/prompts/bug-report.ts`
- `src/lib/schemas/bug-report.ts` — `BugReportSchema`

## Request / response
- `POST /api/generate/bug-report` body `{ projectId, description, bugIndex?, platform?, os?, browser?, appVersion?, component? }` → `{ report, provider, model }`. NOT SSE. `maxDuration = 60`.
- `bug_id` is set server-side as `BUG-{bugIndex padded to 3}`; the client passes `reports.length + 1`, so numbering is per page session, not per project.
- Missing/blank description → 400. Saved as `artifact_type: 'bug_report'`, `is_verified: false`.

## Output (src/lib/schemas/bug-report.ts)
```
bug_id, title
severity:  blocker | critical | major | minor | trivial      (lowercase)
priority:  P0 | P1 | P2 | P3 | P4
component
environment: { platform, os, browser, app_version, screen_size? }
steps_to_reproduce: string[]        (plain strings)
expected_result, actual_result
frequency: always | often | sometimes | rarely | once
root_cause_hypothesis, suggested_fix
labels: string[], screenshot_refs: string[]
```
Environment keys are `os` and `browser` (not `os_version`).

## Gotchas
- Severity and priority are SEPARATE fields.
- Jira/Linear tabs are text formatters with a Copy button — they are enabled, but nothing is pushed to Jira/Linear APIs (not shipped).
- Only the newest `bug_report` artifact carries `is_latest`, but Launch Readiness now loads ALL complete `bug_report` artifacts (bugs have no open/closed status, so every filed report counts).
- One description → one report. “Multiple bugs → multiple objects”, screenshot/Scout input, minimum-length validation and Judge severity checks are NOT implemented (server only rejects empty descriptions).
- Route persists inline (thin-route guideline exceeded slightly).
- `frequency` and `labels[]` are required output fields; do not omit them.
