# Feature 9: i18n / RTL Audit
Phase: 4 (Task 4.2) | Status: done | Pipeline: existing Scout screen maps → single streaming Generator (no Judge run)
Last updated: 2026-11-08

## Overview
Checks the UI for internationalization readiness: text expansion, RTL layout, date/currency/number formats, cultural assumptions. Streams one structured audit object.

## Key files
- `src/app/dashboard/[projectId]/i18n-audit/page.tsx` — server wrapper
- `src/app/dashboard/[projectId]/i18n-audit/I18nAuditClient.tsx` — locale chips, score card, finding list
- `src/app/api/generate/i18n-audit/route.ts` — POST, SSE; persists artifact inline
- `src/lib/hooks/useStreamI18nAudit.ts` — SSE hook
- `src/lib/ai/prompts/i18n-audit.ts` — system prompt + `buildI18nAuditPrompt(targetLocales)`
- `src/lib/ai/weaver.service.ts` — `streamI18nAudit`
- `src/lib/schemas/i18n-audit.ts` — `I18nAuditOutputSchema`

## Request / SSE
- Body: `{ projectId, targetLocales?: string[] }` (optional; empty = broad coverage). 422 if no analyzed screens.
- Events: `meta` → `partial` (repeated) → `done` | `error`.
- Saved as `artifact_type: 'i18n_audit'`, `input_snapshot: { target_locales }`, `is_verified: false`.

## Output (src/lib/schemas/i18n-audit.ts)
```
readiness_score:      0–100 (100 = ready)
readiness_label:      free string; prompt asks for Not Ready | Needs Work | Partially Ready
                      | Mostly Ready | Production Ready
recommended_locales:  string[]  (3–5 priority test locales, ISO codes)
findings[]:
  category: text_expansion | rtl | date_format | currency | number_format | cultural_assumption
  severity: critical | major | minor
  screen, element, detail
  locales:  string[]  (affected locale codes, e.g. "ar-SA")
summary: { critical, major, minor }   (counts)
```
Fields that do NOT exist: `rtl_risk_score`, `hardcoded_strings`, `fix_example`, `target_locales` (output), `high|medium|low` severities.

## Gotchas
- Score bands live in the prompt (90–100 prod-ready … <50 major gaps); score is model-judged, not computed from finding counts.
- `readiness_label` is not an enum in the schema; UI displays it as-is.
- Model: `FEATURE_MODEL_MAP.i18n_audit.generator` = `reasoning_large`. The map lists a `judge`, never run by the route.
- Findings must cite real elements from the screen maps; prompt forbids fabricating UI.
- Route handler contains persistence logic (exceeds thin-route guideline); follow-up: move to a service.

## Do not
- Do not reintroduce the old category/severity names (`text_truncation`, `rtl_layout`, `high`, `medium`, `low`).
- Do not add AI-SDK imports to the client; use the hook.
