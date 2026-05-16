# Feature 3: Bug Report Formatter
Phase: 2 | Pipeline: Generator only (Scout optional if screenshots provided)

## What it does
User describes a bug in plain language → AI formats it into a structured bug report with auto-classified severity, inferred steps to reproduce, device context, and root cause hypothesis. Phase 3 adds Jira/Linear push.

## Key files
- `src/app/api/generate/bug-report/route.ts` — Route handler
- `src/lib/schemas/bug-report.ts` — BugReportSchema (source of truth: SCHEMA.md)
- `src/components/features/BugReportPage.tsx` — feature page
- `src/components/generation/BugReportCard.tsx` — formatted output card
- `src/components/generation/BugReportForm.tsx` — input form

## Inputs
| Input | Required |
|---|---|
| Bug description | Yes (free text, min ~50 chars) |
| Screenshots | No (if provided, Scout runs to extract element labels) |
| Device/browser context | No (AI infers if not provided) |
| Feature area | No (dropdown populated from project scope) |

## Output fields (CRITICAL — match SCHEMA.md exactly)
```
bug_id:             BUG-001 (auto-incremented per project)
title:              string
severity:           blocker | critical | major | minor | trivial  ← lowercase, 5 values
priority:           P0 | P1 | P2 | P3 | P4                       ← 5 levels (P4 = lowest)
component:          string (app area)
environment:
  platform:         Android | iOS | Web | Desktop
  os_version:       string
  app_version:      string
  screen_size:      string
steps_to_reproduce: string[]  ← plain strings NOT objects
expected_result:    string
actual_result:      string
frequency:          always | often | sometimes | rarely | once
root_cause_hypothesis:  string  ← AI inference
suggested_fix:      string
labels:             string[]  ← searchable tags
screenshot_refs:    string[]  ← asset IDs
```

## BugReportCard UI elements
- Severity badge (`.tf-badge-critical`, `.tf-badge-high`, etc.) + priority chip
- Frequency indicator: "Always reproducible" / "Sometimes reproducible"
- Steps listed as numbered plain strings (NOT numbered `{step_number, action}` objects)
- Root cause section with lightbulb icon
- Labels row as `.tf-chip` elements
- **Jira / Linear tab switcher** — Phase 2 renders the tab UI (disabled state), Phase 3 wires it to APIs

## Jira Markup format (Phase 3 reference)
```
h2. {title}
*Severity:* {severity} | *Priority:* {priority}
*Frequency:* {frequency}

h3. Steps to Reproduce
# {step 1}
# {step 2}

h3. Root Cause Hypothesis
{root_cause_hypothesis}
```

## Edge cases
| Scenario | Handling |
|---|---|
| Description too vague (<50 chars) | Prompt: "Add more detail for better classification" |
| Screenshot provided | Run Scout to extract element labels, inject into Generator prompt |
| Multiple bugs described | AI generates multiple BugReport objects |
| Severity disagrees with description | Judge flags discrepancy |

## Gotchas
- `severity` is 5 values, `priority` is P0–P4 (5 values) — they are SEPARATE fields
- `steps_to_reproduce` is `string[]` — NOT `{ step_number: number, action: string, expected_result: string }[]`
- `frequency` field is new (from gap analysis) — do not omit
- `labels[]` enables search filtering in bug report list view
