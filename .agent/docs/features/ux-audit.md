# Feature 2: UX/UI Auditor
Phase: 2 | Pipeline: Scout → Generator (ux_narrative model) → Judge

## What it does
Analyzes screenshots against Nielsen's 10 Heuristics + WCAG foundations. Combines deterministic Canvas-based metrics (contrast, density) with AI narrative. Produces a scored report with per-heuristic breakdown.

## Key files
- `src/app/api/generate/ux-audit/route.ts` — Route handler
- `src/lib/schemas/ux-review.ts` — UXReviewOutputSchema (source of truth: SCHEMA.md)
- `src/components/features/UXAuditPage.tsx` — feature page
- `src/components/generation/UXFindingCard.tsx` — single finding with effort badge
- `src/lib/utils/screen-metrics.ts` — Canvas-based metrics (contrast, density, whitespace_ratio)

## Inputs
| Input | Required |
|---|---|
| Screenshots (project_assets, up to 10) | At least 1 |
| Navigation flow description | No (optional free text) |
| app_type | Yes (from projects) |
| Audit focus | No (defaults to Full Audit) |

## Audit focus options
- Full Audit (all heuristics)
- Onboarding & First-Time UX
- Checkout & Conversion Flow
- Forms & Input Validation
- Error Handling & Recovery
- Information Architecture
- Mobile Usability

## Pre-AI screen metrics (deterministic, via Canvas)
Run BEFORE calling the AI. Inject as facts into Generator prompt:
- **dominant_colors** — via `extract-colors` package
- **wcag_contrast_ratios** — via `wcag-contrast-utils` on primary text/bg pairs
- **information_density** — element count per viewport from ScreenElementMap
- **whitespace_ratio** — whitespace px / total viewport px

## Output fields (from SCHEMA.md UXReviewOutputSchema)
- `overall_score` — 0–100 weighted average
- `grade` — A / B / C / D / F
- `score_breakdown` — per-heuristic score (0–10) for all 10 Nielsen heuristics
- `findings[]` — each has:
  - `heuristic` — H1–H10
  - `severity` — critical | major | minor | suggestion (lowercase)
  - `effort` — quick-win | moderate | significant
  - `screen` — which screenshot
  - `element` — UI element label
  - `description`, `suggestion`, `screenshot_ref`
- `accessibility_flags[]` — A11yFlagSchema items (wcag_criterion, issue, fix_suggestion)
- `strengths[]` — what the app does well
- `screen_metrics` — the deterministic Canvas data

## Nielsen heuristics map (H1–H10)
| # | Name | Tesifye checks |
|---|---|---|
| H1 | Visibility of system status | Loading indicators, progress bars, feedback |
| H2 | Match system & real world | Familiar icons, natural language |
| H3 | User control & freedom | Back buttons, undo, cancel |
| H4 | Consistency & standards | Button styles, nav patterns |
| H5 | Error prevention | Confirmation dialogs, input constraints |
| H6 | Recognition over recall | Visible options, breadcrumbs |
| H7 | Flexibility & efficiency | Shortcuts, bulk actions |
| H8 | Aesthetic & minimalist design | Visual hierarchy, whitespace |
| H9 | Error recovery | Helpful messages, retry |
| H10 | Help & documentation | Tooltips, help links |

## Edge cases
| Scenario | Handling |
|---|---|
| Only 1 screenshot | Audit single screen; note: "Limited to single-screen analysis" |
| Screenshots in wrong order | User can drag-and-drop reorder before generating |
| Very similar screenshots | pHash detects; prompt: "Similar images detected — proceed anyway?" |
| No interactive elements found | Flag as potential issue (H1, H8) |

## Gotchas
- `effort` field is critical for dashboard filtering (quick-win vs significant) — don't omit
- `whitespace_ratio` uses viewport dimensions from ScreenElementMap — must run Scout first
- wcag-contrast-utils and extract-colors are Phase 2 deps — install: `npm install wcag-contrast-utils extract-colors`
- Judge verifies `overall_score` is consistent with `score_breakdown` values — add this check in prompts
