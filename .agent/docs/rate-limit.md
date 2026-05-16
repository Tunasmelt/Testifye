# Rate Limit & Provider Fallback
Last updated: 2026-05-09

## Overview
Tesifye uses a client-side Zustand rate limit queue + server-side multi-provider fallback. Primary: GROQ (~200ms). Fallback 1: Google AI Studio (~800ms). Fallback 2: Cerebras (text-only, 1M tokens/day). All managed by `generate-with-fallback.ts` / `stream-with-fallback.ts`.

## Key files
- `src/lib/ai/generate-with-fallback.ts` — tries providers in order, catches 429
- `src/lib/ai/stream-with-fallback.ts` — streaming variant
- `src/lib/ai/providers.ts` — MODEL_REGISTRY, FEATURE_MODEL_MAP, FALLBACK_CHAINS
- `src/stores/rate-limit.store.ts` — client-side queue, cooldowns, token budgets

## Provider fallback chain
```
Request
  → GROQ (primary, ~200ms)
      ├─ 200 OK → return result, badge: "✦ Powered by GROQ"
      └─ 429 Rate Limited
            ├─ Vision task? → Google AI Studio (gemini-2.5-flash, ~800ms)
            │                    ├─ 200 OK → badge: "✦ Powered by Google AI"
            │                    └─ Fail → queue for retry with countdown
            └─ Text-only task? → Cerebras (when SDK available)
                                  └─ Or Google AI as universal fallback
```

## Queue priority order (highest to lowest)
1. User-triggered generation (e.g. clicking "Generate")
2. Judge verification (internal, runs after streaming)
3. Shadow Scout (background, Phase 2 — runs after upload)
4. Manifest cache updates (lowest — background only)

## Privacy controls (per project)
| Mode | Providers | Training risk |
|---|---|---|
| Private (default) | GROQ only | None |
| Extended (opt-in) | GROQ + Google AI + Cerebras | Google may train on free-tier data |

- Stored in `projects.extended_providers_enabled`
- `generate-with-fallback.ts` checks this flag before trying Google/Cerebras
- User sees explicit disclosure modal when enabling Extended mode

## FALLBACK_CHAINS (from providers.ts)
```
vision:     groq:llama-4-scout → google:gemini-2.5-flash
reasoning:  groq:llama-3.3-70b → google:gemini-2.5-flash
ux_review:  groq:llama-4-maverick → google:gemini-2.5-flash
fast:       groq:llama-3.1-8b → google:gemini-2.5-flash
```

## When all providers exhausted
- Show countdown timer in UI: "Retrying in 47s..."
- Serve cached artifact if available with stale badge
- Log which providers were tried and their error codes

## Gotchas
- `generate-with-fallback` returns `{ result, provider, model }` — always store `provider` and `model` in the generated_artifacts row
- Cerebras fallback is text-only — NEVER route vision tasks (Scout) to Cerebras
- GROQ free tier resets every minute; Google AI Studio resets daily
- The ProviderBadge component reads from rate-limit.store `activeProvider` — update it on every successful call

## Do not
- Retry on 4xx errors other than 429 (auth errors, bad requests won't fix themselves)
- Import `@ai-sdk/groq` or `@ai-sdk/google` outside `src/lib/ai/`
- Use `extended_providers_enabled` from `projects` without first reading the privacy disclosure to the user
