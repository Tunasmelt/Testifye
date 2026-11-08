# Feature 2: UX/UI Auditor
Phase: 2 (Tasks 2.1, 2.2, 2.8) | Status: done (Task 2.2 metrics only partially wired — see Gotchas) | Pipeline: Scout screen maps → streaming Generator (`ux_narrative`); no Judge run
Last updated: 2026-11-08

## Overview
Analyzes analyzed screens against Nielsen's 10 heuristics + WCAG basics and streams a scored report with findings, accessibility flags, strengths, and an audit-score history chart.

## Key files
- `src/app/dashboard/[projectId]/ux-audit/page.tsx` + `UXAuditClient.tsx` — focus chips, findings list (severity + “Quick wins only” effort filter), stale nudge, `ScoreHistoryChart` (Recharts)
- `src/app/api/generate/ux-audit/route.ts` — SSE route; persists artifact inline
- `src/lib/hooks/useStreamUXAudit.ts` — SSE hook (accepts optional `screenMetricsSummary`)
- `src/lib/hooks/useStaleArtifact.ts` + `src/app/api/artifacts/stale/route.ts` — prompt-version staleness
- `src/app/api/artifacts/ux-history/[projectId]/route.ts` — last 20 `ux_review` artifacts, chronological, for the chart
- `src/lib/ai/weaver.service.ts` — `streamUXAudit`; `src/lib/ai/prompts/ux-auditor.ts` — `buildUXAuditorPrompt`
- `src/lib/schemas/ux-review.ts` — `UXReviewOutputSchema`
- `src/lib/utils/screen-metrics.ts` — `extractDominantColors`, `computeContrastRatios`, `computeElementDensity`, `computeScreenMetrics`, `formatScreenMetricsForPrompt`
- (No `src/components/features/` or `src/components/generation/` files exist.)

## Request / SSE
- Body: `{ projectId, auditFocus?, screenMetricsSummary? }`. 422 when no analyzed screens. Events `meta` → `partial` → `done` | `error`. Saved as `ux_review`, `is_verified: false`.
- Audit focus chips (7): Full Audit, Onboarding & First-Time UX, Checkout & Conversion Flow, Forms & Input Validation, Error Handling & Recovery, Information Architecture, Mobile Usability.

## Output (src/lib/schemas/ux-review.ts)
- `overall_score` 0–100, `grade` (string: A+, A, B+, B, C, D, F)
- `findings[]`: `heuristic_number` (1–10), `heuristic_name`, `severity` **critical | major | minor | enhancement**, `effort` quick-win | moderate | significant, `element`, `screen`, `description`, `suggestion`, `screenshot_ref?`, `is_verified`
- `score_breakdown`: record of per-heuristic scores 0–10
- `accessibility_flags[]`: `type` (contrast | touch_target | alt_text | focus_order | keyboard_nav | aria_label), `criterion`, `element`, `screen`, `detail`
- `strengths[]`
- `screen_metrics?`: `dominant_colors?`, `contrast_ratios? [{pair, ratio, passes_aa}]`, `whitespace_ratio?`, `element_density?`

## Behaviors
- **Single screen:** server detects `screenMaps.length === 1` and adds a prompt note: audit is limited to single-screen analysis and the model must say so in `summary_recommendation`.
- **Stale nudge:** banner “generated with an older prompt version — Re-run” when `/api/artifacts/stale` reports `stale && exists` (prompt-version check, Task 3.6; not the Task 2.4 dirty-state flag).
- **Score history (Task 2.8):** line chart of up to 20 past audits; with one audit it shows only “Score history will appear after your second audit”.
- **Heuristics H1–H10:** Visibility of status, Match real world, User control, Consistency, Error prevention, Recognition over recall, Flexibility, Aesthetic/minimalist, Error recovery, Help/documentation.

## Gotchas
- Pre-AI metrics: helpers exist in `screen-metrics.ts` and the route/hook accept `screenMetricsSummary`, but `UXAuditClient` only sends `{ projectId, auditFocus }` — no caller computes or injects metrics today, so `screen_metrics` is whatever the model emits. (Not wired; Task 2.2 is only partly effective.)
- Severity enum uses `enhancement`, not `suggestion`.
- No Judge stage runs for UX audit despite `FEATURE_MODEL_MAP.ux_review.judge`; findings are `is_verified: false`. Do not claim `overall_score`/`score_breakdown` consistency is verified.
- No drag-and-drop screenshot reorder exists in the code.
- Launch Readiness reads `overall_score` and critical `findings` from this artifact.
- `extract-colors` and `wcag-contrast-utils` are already installed.
