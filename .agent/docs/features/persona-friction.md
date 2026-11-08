# Feature 8: Persona Friction Analysis
Phase: 4 (Task 4.1) | Status: done | Pipeline: existing Scout screen maps → single streaming Generator (no Judge run)
Last updated: 2026-11-08

## Overview
Analyzes UX from the perspective of selected user personas ("Would a tech-averse user struggle with this flow?"). ONE streaming response contains all selected personas; the UI renders one card per persona (not separate tabs/reports).

## Key files
- `src/app/dashboard/[projectId]/persona-friction/page.tsx` — server wrapper (AppShell)
- `src/app/dashboard/[projectId]/persona-friction/PersonaFrictionClient.tsx` — persona picker, streaming cards
- `src/app/api/generate/persona-friction/route.ts` — POST, SSE; also persists the artifact inline
- `src/lib/hooks/useStreamPersonaFriction.ts` — SSE hook (status idle|starting|streaming|complete|error)
- `src/lib/ai/prompts/persona-friction.ts` — system prompt + `buildPersonaFrictionPrompt`
- `src/lib/ai/weaver.service.ts` — `streamPersonaFriction`
- `src/lib/schemas/persona-friction.ts` — `PersonaFrictionOutputSchema`

## Request / SSE
- Body: `{ projectId, selectedPersonas: string[] }`; invalid ids are filtered, 0 valid → 400; no analyzed screens → 422.
- Valid ids: `gen_z`, `tech_averse`, `power_user`, `first_time_user`, `accessibility`.
- Events: `meta` {provider, model, estimatedTokens} → `partial` {object} (repeated) → `done` {object} | `error` {message}.

## Output (src/lib/schemas/persona-friction.ts)
```
personas[]:
  persona_id, persona_name, empathy_statement
  ux_score:       0–100   (HIGHER = better; not "friction score")
  drop_off_risk:  high | medium | low
  friction_items[]:
    screen, element, description, suggestion
    friction_type: cognitive_load | trust_issue | missing_affordance
                   | accessibility | confusion | visual_hierarchy
    severity:      blocking | frustrating | annoying | minor
```
No top-level `overall_friction_score` or `summary`.

## Gotchas
- Model: `FEATURE_MODEL_MAP.persona_friction.generator` = `reasoning_large`. The map lists a `judge`, but the route never runs one; artifact is saved `is_verified: false`.
- Artifact saved as `artifact_type: 'persona_friction'` with `input_snapshot: { selected_personas }`; previous latest is flipped `is_latest: false`.
- The UI merges `partial.personas` by `persona_id`, so cards fill in as the stream arrives.
- `friction_type` and `severity` enums are fixed — do not invent values.
- Route handler holds DB persistence logic (longer than the ~25-line thin-route rule). Follow-up: move to a service.
- Page `<title>` still says "Testifye" (typo vs project name Tesifye).

## Do not
- Do not describe `ux_score` as friction; higher is better.
- Do not split into per-persona API calls without updating the hook and UI (single object today).
