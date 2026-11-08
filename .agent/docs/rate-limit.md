# Rate Limit & Provider Fallback
Last updated: 2026-11-08

## Overview
Server-side fallback is GROQ → Google AI Studio (Gemini), and only when a 429 / rate-limit error occurs AND the project has `extended_providers_enabled`. Decision 2026-11-08: **Cerebras is dropped** and will not be used; Gemini is the only fallback provider (no SDK or code references to Cerebras exist). A client-side Zustand queue exists but is not wired to anything.

## Key files
- `src/lib/ai/generate-with-fallback.ts` — `generateWithFallback(modelKey, {schema, prompt|messages, system, temperature=0.3, allowGoogleFallback=false})` → `{ result, provider: 'groq'|'google', model, modelKey }`
- `src/lib/ai/stream-with-fallback.ts` — `streamWithFallback(modelKey, {...})` → `{ stream, provider, model, estimatedTokens: 0 }` (real token estimate comes from `buildFullContext`, not this function)
- `src/lib/ai/providers.ts` — `MODEL_REGISTRY`, `FEATURE_MODEL_MAP`, `FALLBACK_CHAINS`, `getModel(key, useGoogle)`
- `src/lib/stores/rate-limit.store.ts` — client queue store (NOT `src/stores/…`); currently unused by any component or hook
- `src/app/dashboard/[projectId]/OverviewClient.tsx` + `src/app/api/projects/[projectId]/settings/route.ts` — the “extended providers” privacy toggle (`extended_providers_enabled`)

## Actual fallback behavior
```
groq (MODEL_REGISTRY[key])
  └─ error is 429 / "rate limit" / "too many requests"?
        ├─ allowGoogleFallback false → throw (surfaces as error / 502)
        └─ true → google gemini-2.0-flash (ALL six model keys map to this one model)
  non-429 error → throw immediately
```
Streaming variant only probes the first chunk for a 429 when `allowGoogleFallback` is true; otherwise errors surface when the stream is consumed.

## Model registry (Groq)
| Key | Model |
|---|---|
| vision_scout | meta-llama/llama-4-scout-17b-16e-instruct |
| reasoning_large | llama-3.3-70b-versatile |
| ux_narrative | meta-llama/llama-4-maverick-17b-128e-instruct |
| long_context | mixtral-8x7b-32768 |
| fast_format | llama-3.1-8b-instant |
| quick_labels | gemma2-9b-it |

Google equivalent for every key: `gemini-2.0-flash` (not gemini-2.5-flash).

## FALLBACK_CHAINS (providers.ts)
`vision [vision_scout, null]`, `reasoning [reasoning_large, null]`, `ux_review [ux_narrative, reasoning_large]`, `fast [fast_format, null]`, `long [long_context, reasoning_large]`. These are model-key pairs, NOT provider chains, and **nothing in `src/` references `FALLBACK_CHAINS`** — it is dead config. Real fallback is the provider swap above.

## Privacy controls
| Mode | Behavior |
|---|---|
| Private (default, `extended_providers_enabled = false`) | Groq only; 429 → error |
| Extended (opt-in) | Groq, then Google on 429 |
- Flag read per route (`allowGoogleFallback: project.extended_providers_enabled ?? false`).
- Judge: `test-cases/route.ts` now passes `project.extended_providers_enabled ?? false` to `runJudge`, so Private mode no longer falls back to Google (fixed; type-checked, no automated test). Remaining exceptions to review: `api/generate/chat/route.ts` calls `getModel('reasoning_large', false)` directly (Groq only, no fallback, no 429 handling); `buildCompressedHistory` uses `getModel('fast_format')` directly. Flag for a human decision.

## NOT implemented (do not document as shipped)
- “All providers exhausted → countdown timer + serve cached artifact with stale badge.” Today an exhausted/failed call returns an error (SSE `error` event or HTTP 502). Test-case streams can be recovered via Resume/Keep Partial only.
- Queue priority ordering (user generation > Judge > Shadow Scout > manifest updates) and the “Rate limited — queued” badge: the store has no priority concept and is unused.
- A `ProviderBadge` component (only the CSS class `.tf-provider-badge` exists); the UI shows provider/model from the SSE `meta` event instead.

## Gotchas
- Always persist `provider` and `model` from the fallback result into `generated_artifacts`.
- Shadow Scout (`runScout`, run in `after()` on upload) uses `generateWithFallback('vision_scout', …)` with the project's flag.
- Groq free tier resets per minute; Google AI Studio daily. (external; unverified)

## Do not
- Retry on non-429 errors.
- Import `@ai-sdk/groq` / `@ai-sdk/google` outside `src/lib/ai/`.
- Enable Google fallback without the project's opt-in flag.
