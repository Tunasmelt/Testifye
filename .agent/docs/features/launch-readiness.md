# Feature 10: Launch Readiness Score
Phase: 4 (Task 4.6) | Status: done | Pipeline: none — deterministic computation, no AI call
Last updated: 2026-11-08

## Overview
Composite go/no-go score from existing artifacts. Client POSTs JSON, the route authenticates and checks project ownership, then calls `loadAndComputeLaunchReadiness`, which reads the latest `test_suite` / `ux_review` / `gap_analysis` artifacts (`is_latest = true`) and ALL complete `bug_report` artifacts from `generated_artifacts` (NOT `manifest_snapshot`) and computes four weighted dimensions with a pure function. Nothing is persisted; the UI triggers computation on demand (button), not on page load.

## Key files
- `src/lib/services/launch-readiness.service.ts` — pure `computeLaunchReadiness(inputs)` (unit-testable) + `loadAndComputeLaunchReadiness(projectId)` (admin-client artifact loading; caller must verify ownership)
- `src/app/api/generate/launch-readiness/route.ts` — thin handler: auth + ownership (`projects.user_id`, `status = active`) + call service
- `src/lib/schemas/launch-readiness.ts` — `LaunchReadinessOutputSchema`, `BlockingIssueSchema`, `DimensionScoreSchema`
- `src/app/dashboard/[projectId]/launch-readiness/page.tsx`
- `src/app/dashboard/[projectId]/launch-readiness/LaunchReadinessClient.tsx` — compute button, 30 s abort timeout, score card
- Automated tests: vitest approved 2026-11-08; unit tests for the pure scoring function `computeLaunchReadiness` are at `src/lib/services/launch-readiness.service.test.ts` (10 passing tests; run `npm test`). `loadAndComputeLaunchReadiness` and the route have no tests. The service was also type-checked (`tsc` clean).

## Request / response
- `POST /api/generate/launch-readiness` body `{ projectId }` → plain JSON `LaunchReadinessOutput` (not SSE). 401 / 400 / 404 on auth, body, ownership. `maxDuration = 30`.

## Computation
Artifacts read: `test_suite`, `ux_review`, `gap_analysis` (latest only) and `bug_report` (all with `status = complete`).

| Dimension | Weight | Score |
|---|---|---|
| test_coverage | 30% | no suite → 0; else volume `min(count,50)/50*50` + category breadth `min(distinct categories,6)/6*30` + judge-verified ratio `verified/total*20` (per-case `is_verified`); `coverage_score` is no longer read |
| ux_score | 30% | `ux_review.overall_score`; none → 0 |
| gap_count | 20% | no analysis → 100 (“assuming 100%”); else `100 − critical*20 − others*5`, floor 0 |
| bug_severity | 20% | no reports → 100; else `100 − sum(per-bug penalty)`, floored at 0 (blocker 40, critical 30, major 15, minor 5, trivial 2) |

`overall_score = round(weighted sum)`. `readiness_label`: >=80 `Ready`, >=60 `Needs Attention`, >=40 `Not Ready`, else `Critical Issues`.

`blocking_issues[]` (typed `{type, source, description, severity}`): up to 3 critical UX findings (`ux_issue`, source `Heuristic {heuristic_number} — {heuristic_name}`), up to 3 critical gaps (`missing_requirement`), up to 5 blocker/critical bugs (`critical_bug`; blocker → severity `critical`, critical → `high`). Schema also allows `a11y_blocker`, never emitted.

## Gotchas
- Bugs have no open/closed status field, so “open bugs” = every filed bug report; a fixed bug cannot be dismissed yet.
- Missing gap analysis / bug report score 100 (optimistic), missing test suite / UX audit score 0 — asymmetric.
- Logic lives in `launch-readiness.service.ts`; the route is thin. Fixed 2026-11-08 (tsc clean; scoring function covered by 10 vitest unit tests).
- The old “show only after 2 artifact types exist” rule is NOT implemented; the page can be run with zero artifacts.
- Labels are 4-state (`Ready | Needs Attention | Not Ready | Critical Issues`), not `ready | caution | not_ready`.
- No AI call, so no streaming/skeleton; result is not stored or versioned.
- Fixed: `coverage_score` (never written by any schema) is no longer used; coverage uses volume + category breadth + judge-verified ratio.
- Fixed: the UX blocking-issue `source` now uses `heuristic_number` / `heuristic_name` instead of the non-existent `f.heuristic`.

## Planned
- Extend tests beyond the pure scoring function (service loader, route).
- Gate the page on >= 2 artifact types.
- Include accessibility blockers (Task 4.3) and persist results for history.

## Do not
- Call any AI model from this feature.
- Read `manifest_snapshot` here unless the code is changed; it currently reads `generated_artifacts`.
