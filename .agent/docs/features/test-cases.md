# Feature 1: Test Case Generator
Phase: 1 (Tasks 1.8–1.14) | Status: done | Pipeline: Scout (at upload) → streaming Generator → Judge (post-stream)
Last updated: 2026-11-08

## Overview
Generates structured test suites from project context + analyzed screens. Role-aware (Tester role selector in the UI is sent as `role` and overrides `project.user_role` for that call): Manual Tester → detailed steps; QA Lead → summary; Automation Engineer → Gherkin-ready structure.

## Key files
- `src/app/dashboard/[projectId]/test-cases/page.tsx` + `TestCasesClient.tsx` — page, role/focus selectors, export dropdown, resume/keep banner
- `src/app/api/generate/test-cases/route.ts` — SSE route; also runs Judge and persists the artifact
- `src/lib/ai/weaver.service.ts` — `streamTestCases`, `runJudge`, `getProjectScreenMaps`, `getProjectArtifacts`
- `src/lib/hooks/useStreamTestCases.ts` — SSE client hook
- `src/lib/stores/generation.store.ts` — status/cases/streaming/partial/resumeFrom (see state-management.md)
- `src/lib/schemas/test-case.ts` — `TestCaseSchema`, `TestSuiteOutputSchema` (NOT test-suite.ts)
- `src/components/test-cases/TestCaseList.tsx`, `TestCaseRow.tsx` — list with category chips, search, priority sort
- `src/components/test-cases/CoverageGapAnalysis.tsx` — Task 3.8 coverage view
- `src/lib/services/export.service.ts` — markdown / csv / json / gherkin / jira / linear text export
- (No `src/components/features/` or `src/components/generation/` files exist; those folders are empty.)

## Request / SSE
- Body: `{ projectId, focusAreas?, resumeFrom?, role? }`. Events: `meta` → `partial` (repeated) → `done` | `error`.
- No screenshots is allowed (generates from description, `noScreensWarning`); route does not 422.

## Inputs
| Input | Source | Required |
|---|---|---|
| description, scope, audience, app_type | projects row | Yes |
| role | UI selector (default `manual_tester`) | Yes |
| screen maps | `getProjectScreenMaps` | No |
| focus_areas | chips, local state only | No (none = all) |
| previous artifacts | `getProjectArtifacts` | auto |

Focus chips (8): Authentication, Payments, Forms, Search, Errors, Accessibility, Performance, Navigation. UI shows a warning style/hint above 5 selected; it does NOT split into parallel sub-calls.

## Output (src/lib/schemas/test-case.ts)
- `TestCase`: `tc_id`, `title`, `category` (free string), `priority` critical|high|medium|low, `preconditions` (**string**, not array), `steps[] {step_number, action, expected_result}`, `step_count`, `screen_label`, `test_data_suggestion?`, `ui_elements_referenced[]`, `is_verified`, `verification_note?`
- `TestSuiteOutput`: `test_cases[]`, `coverage_summary`, `total_count`, `priority_breakdown {critical, high, medium, low}`

## Streaming UI
1. Status flows `starting → streaming → judging → complete` (or `partial` / `error`).
2. Cards stream in from `partial.test_cases`; skeleton rows while streaming.
3. Judge runs after the stream; failure is non-fatal (raw output kept).
4. Artifact saved to `generated_artifacts` (`artifact_type: 'test_suite'`, previous flipped `is_latest:false`).

## Edge cases
| Scenario | Handling |
|---|---|
| No screenshots | Generate from text; warning note |
| 0 focus areas | All areas |
| Rate limit / disconnect mid-stream | Partial kept; “Resume / Keep Partial” banner (`resumeFrom`) |
| Judge fails | Raw generation returned |
| Cached duplicate result, Levenshtein/Jaccard near-duplicate flags, countdown when all providers exhausted | NOT implemented |

## Export
- Export dropdown in `TestCasesClient`: Gherkin (.feature), Markdown, CSV, JSON. Jira/Linear are text formats on the Export page (no API push). See export.md.

## Gotchas
- Artifact `is_verified` now reflects whether the Judge succeeded (`false` when the Judge failed and raw generator output was saved). The Judge honors `project.extended_providers_enabled` (no Google fallback in Private mode). Fixed; type-checked, no automated test. Per-case `is_verified` is still set by the Judge.
- List category chips are `functional|edge|negative|accessibility|performance` and match by substring on the free-text `category`.
- Route handler is ~160 lines (Judge + persistence inline), beyond the thin-route guideline.
