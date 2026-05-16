# Feature 8: Persona Friction Analysis
Phase: 4 | Pipeline: Scout → Generator (audience-specific prompting) → Judge

## What it does
Analyzes UX from the perspective of specific user personas. Answers "Would a tech-averse 60-year-old struggle with this checkout flow?" Each persona gets a tailored friction report with severity and drop-off risk.

## Key files
- `src/app/api/generate/persona-friction/route.ts`
- `src/lib/schemas/persona-friction.ts` — PersonaFrictionOutputSchema (see SCHEMA.md)
- `src/components/features/PersonaFrictionPage.tsx`
- `src/components/generation/FrictionReport.tsx`

## Persona options (multi-select)
- **Gen Z** — mobile-first, impatient, gesture-dependent, no patience for multi-step flows
- **Tech-averse** — needs explicit guidance, no jargon, larger tap targets, clear error recovery
- **Power User** — wants shortcuts, bulk actions, dense UI, keyboard navigation
- **First-time User** — needs onboarding, progressive disclosure, no assumed knowledge
- **Accessibility** — screen reader compatible, motor impaired, low vision (links to i18n audit)

## Output fields (from SCHEMA.md PersonaFrictionOutputSchema)
```
persona:        string  (selected persona name)
friction_items[]:
  screen:         string
  element:        string
  friction_type:  cognitive_load | visual_hierarchy | interaction_pattern
                  | language_complexity | trust_signal
  severity:       critical | high | medium | low
  drop_off_risk:  high | medium | low
  description:    string  (plain language, persona-appropriate)
  suggestion:     string
overall_friction_score:  0–100 (100 = worst friction)
summary:        string  (2–3 sentence executive summary per persona)
```

## Friction types
| Type | Examples |
|---|---|
| cognitive_load | Too many choices, unclear hierarchy |
| visual_hierarchy | Important actions not prominent |
| interaction_pattern | Unfamiliar gestures or conventions |
| language_complexity | Jargon, passive voice, technical terms |
| trust_signal | Missing privacy indicators, unclear pricing |

## Gotchas
- `drop_off_risk` is a new field (from gap analysis) — critical for product teams to prioritize
- Each persona generates a SEPARATE report object — the page shows them in tabs
- Persona prompts use different "voice": Gen Z analysis uses casual language; tech-averse uses clinical
- `friction_type` enum is fixed — agents must not invent new values
