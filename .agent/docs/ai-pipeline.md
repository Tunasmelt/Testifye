# AI Pipeline
Last updated: 2026-05-09

## Overview
Tesifye's AI brain uses a 3-stage pipeline: Scout (vision analysis) → Generator (streaming output) → Judge (verification). All logic lives in `src/lib/ai/`. Multi-provider fallback: GROQ → Google AI Studio → Cerebras.

## Key files
- `src/lib/ai/weaver.service.ts` — orchestrates Scout → Generator → Judge
- `src/lib/ai/providers.ts` — MODEL_REGISTRY, FEATURE_MODEL_MAP, FALLBACK_CHAINS
- `src/lib/ai/generate-with-fallback.ts` — tries providers in order, catches 429
- `src/lib/ai/stream-with-fallback.ts` — streaming variant
- `src/lib/ai/context-budget.ts` — semantic truncation to 14K token input limit
- `src/lib/ai/prompts/scout.ts` — SCOUT_SYSTEM_PROMPT
- `src/lib/ai/prompts/generator.ts` — buildGeneratorPrompt(feature, role)
- `src/lib/ai/prompts/judge.ts` — JUDGE_SYSTEM_PROMPT

## Patterns
- Scout: `generateObject` (NOT streaming) — needs full ScreenElementMap before proceeding
- Generator: `streamObject` — user sees cards streaming in
- Judge: `generateObject` (NOT streaming) — verifies complete artifact
- All AI calls go through generate-with-fallback or stream-with-fallback — NEVER import AI SDK directly elsewhere
- Model keys: vision_scout, reasoning_large, ux_narrative, long_context, fast_format, quick_labels

## Gotchas
- Accent/primary model is llama-4-scout (vision), NOT llama-3.3-70b (reasoning)
- Context budget: 14K total input — system(2K) + screen maps(5K) + artifact(4K) + history(2K) + user(1K)
- Never send raw manifest_snapshot to AI — use context-budget.ts to build the payload
- Scout output is cached as artifact type 'vision_map' — skip if not dirty

## Do not
- Import `@ai-sdk/groq` or `@ai-sdk/google` outside `src/lib/ai/`
- Call `streamObject` in Judge stage (needs full input first)
- Exceed 14K tokens in AI input context
