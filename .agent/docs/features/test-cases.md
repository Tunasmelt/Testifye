# Feature 1: Test Case Generator
Phase: 1 | Pipeline: Scout → Generator → Judge

## What it does
Generates structured test suites from project context + screenshots. Role-aware: output language and step depth adapt to the user's selected role (Manual Tester → detailed steps; QA Lead → summary; Automation Engineer → Gherkin-ready structure).

## Key files
- `src/app/api/generate/test-cases/route.ts` — Route handler (thin)
- `src/lib/ai/weaver.service.ts` — orchestrates the 3 stages
- `src/lib/schemas/test-suite.ts` — TestSuiteOutputSchema (source of truth: SCHEMA.md)
- `src/components/features/TestCasePage.tsx` — feature page with focus area filter
- `src/components/generation/TestCaseCard.tsx` — streaming card
- `src/components/generation/TestCaseList.tsx` — filterable list with filter row
- `src/lib/services/export.service.ts` — Copy as Markdown / Download JSON

## Inputs (from SCHEMA.md)
| Input | DB source | Required |
|---|---|---|
| description, scope, target_audience | projects table | Yes |
| user_role, app_type | projects table | Yes |
| Screenshots (ScreenElementMaps) | project_assets | No (generates from description only if missing) |
| focus_areas | Multi-select UI (local state only, not persisted) | No (defaults to all) |
| Previous test suite | generated_artifacts (is_latest=TRUE) | Auto-included in context |

## Focus area chips
```
Authentication & Login | Payments & Checkout | Navigation & Routing
User Input / Forms     | Search & Filtering  | Onboarding
Data Validation        | Error Handling      | Performance
Accessibility          | Security            | Edge Cases
```
- No selection → default to all
- >5 selected → warn user, split into parallel sub-calls

## Output fields (from SCHEMA.md TestCaseSchema)
- `tc_id` — TC-001, TC-002, ...
- `title` — human-readable
- `category` — matches focus area
- `priority` — critical | high | medium | low (lowercase)
- `preconditions` — string[]
- `steps` — `{ step_number, action, expected_result }[]`
- `test_data_suggestion` — string
- `ui_elements_referenced` — from ScreenElementMap labels
- `step_count` — derived field
- `screen_label` — which screen this test applies to
- `is_verified` — boolean, set by Judge

## Streaming UI behavior
1. Skeleton cards appear immediately (N = estimatedTotal from header)
2. Each completed test case card fades in via `.tf-fade-in`
3. Progress: "Generating 7 of ~15 test cases..."
4. Judge runs after stream completes → verified badge appears per card
5. Auto-saved to generated_artifacts on complete

## Edge cases
| Scenario | Handling |
|---|---|
| No screenshots | Generate from text only; warn: "Test cases may reference assumed UI elements" |
| 0 focus areas | Default to all — do not block |
| >5 focus areas | Warn, split into parallel model calls |
| Duplicate (same inputs, same assets) | Serve cached artifact; show "Cached result" badge |
| Rate limit mid-stream | Save partial; show "Resume / Keep Partial" banner |
| All providers exhausted | Countdown timer; serve cached if available |
| Levenshtein near-duplicate cases | Flag with warning icon; user can dismiss or delete |

## Post-processing
- Levenshtein / Jaccard similarity check for semantically duplicate test cases (run client-side after full stream)
- Group by category, sort by priority within groups

## Export (Phase 1: MD + JSON; Phase 2: Gherkin)
- Inline "Copy as Markdown" + "Download JSON" in filter row
- Gherkin: Phase 2 — uses fast_format model, outputs `.feature` file
