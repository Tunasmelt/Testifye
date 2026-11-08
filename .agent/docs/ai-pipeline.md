# AI Pipeline
Last updated: 2026-11-08

## Overview
Scout (vision → ScreenElementMap, run once per screenshot in the background after upload) → Generator (per feature) → Judge (verification). The Judge only runs for the **test-case** feature; other features are a single Generator pass. All AI logic lives in `src/lib/ai/`. Providers: Groq primary, Google Gemini fallback (Extended mode opt-in only). Decision 2026-11-08: Cerebras is dropped and will not be used (see rate-limit.md).

## Key files
- `src/lib/ai/weaver.service.ts` — `runScout`, `streamTestCases`, `runJudge`, `streamUXAudit`, `generateBugReport`, `generateGapAnalysis`, `generateSemanticLink`, `generateTestData`, `streamPersonaFriction`, `streamI18nAudit`, `getProjectScreenMaps`, `getProjectArtifacts`
- `src/lib/ai/providers.ts` — `MODEL_REGISTRY`, `FEATURE_MODEL_MAP`, `FALLBACK_CHAINS` (unused), `getModel`
- `src/lib/ai/generate-with-fallback.ts` / `stream-with-fallback.ts` — see rate-limit.md
- `src/lib/ai/context-budget.ts` — `TOKEN_BUDGET`, `estimateTokens`, `buildCompressedHistory`, `buildFullContext`
- `src/lib/ai/prompt-version.ts` — `PROMPT_VERSION`, `MIN_FRESH_VERSION`, `isStale` (Task 3.6)
- `src/lib/ai/prompts/` — `scout.ts`, `generator.ts` (`buildGeneratorPrompt(feature, role)`, `buildContextSummaryPrompt`), `judge.ts`, `ux-auditor.ts`, `bug-report.ts`, `gap-analysis.ts`, `semantic-link.ts`, `test-data.ts`, `persona-friction.ts`, `i18n-audit.ts`
- `src/lib/schemas/screen-element-map.ts` — Scout output (`ScreenElementMapSchema`)

## Feature → model map (FEATURE_MODEL_MAP)
| Feature | Generator | Mode |
|---|---|---|
| test_suite | reasoning_large | `streamObject` + Judge (`fast_format`, `generateObject`) |
| ux_review | ux_narrative | `streamObject` |
| persona_friction, i18n_audit | reasoning_large | `streamObject` |
| bug_report, test_data | fast_format | `generateObject` |
| gap_analysis | long_context | `generateObject` |
| semantic_link | reasoning_large | `generateObject` |
| sidekick | reasoning_large | `streamText` (route calls `getModel` directly) |
The map's `scout`/`judge` slots are descriptive: only test_suite actually runs a Judge; Scout runs from the upload route, not per feature.

## Patterns
- Scout: `generateWithFallback('vision_scout', { messages: [image + text] })` — non-streaming. Result cached as `generated_artifacts` row `artifact_type: 'vision_map'` keyed by `input_snapshot.asset_id`; skipped if a latest one exists (`force` overrides). Marks the asset `is_verified = true`, `metadata.vision_map_status = 'ready'|'failed'`.
- Generator: `streamObject` through `streamWithFallback`; routes forward `partialObjectStream` as SSE (`meta` → `partial`* → `done`|`error`).
- Judge: `generateObject` with `fast_format` over artifact + screen maps; failure is non-fatal.
- Context: `buildFullContext` assembles project fields + screen maps + previous same-type artifact + compressed history of other latest artifacts; each section is hard-sliced to its budget (~4 chars/token).
- Prompt versioning: bump `MIN_FRESH_VERSION` to flag old artifacts stale; every artifact stores `prompt_version`.

## Gotchas
- Budget (14K input): system 2K, screen maps 5K, active artifact 4K, history 2K, user message 1K. Truncation is character slicing, not semantic.
- Scout model is `vision_scout` (llama-4-scout); text features use `reasoning_large`.
- Context is built from `generated_artifacts` (`is_latest`), never from `manifest_snapshot`.
- `getProjectScreenMaps` returns `vision_map` rows with `is_latest = true`. Migration `003_fix_vision_map_latest_and_chat_unique.sql` scopes the trigger `on_artifact_insert` flip per `input_snapshot->>'asset_id'` for `vision_map`, so each screen keeps its own latest map. **Migration 003 must be applied to the live DB** (not yet applied; SQL not executed or tested). Until it is applied, the old behavior holds: only the most recently scouted screen stays `is_latest` (see database.md).
- Gap Finder / Semantic Link truncate the PRD to 12,000 / 10,000 chars in the prompt.
- Judge fallback now respects the privacy flag: `test-cases/route.ts` passes `project.extended_providers_enabled ?? false` to `runJudge` (previously hard-coded `true`). Fixed; type-checked (`tsc` clean) but no automated test for this fix (vitest was approved 2026-11-08; so far it covers only launch-readiness scoring).
- `src/app/api/generate/chat/route.ts` imports `streamText` from `ai` directly (outside `src/lib/ai/`); the structural rule says AI logic belongs in `src/lib/ai/`. Type-only `DeepPartial` imports in hooks/components are fine.

## Do not
- Import `@ai-sdk/groq` / `@ai-sdk/google` outside `src/lib/ai/`.
- Call `streamObject` for the Judge stage.
- Exceed the 14K input budget or send raw `manifest_snapshot` to a model.
