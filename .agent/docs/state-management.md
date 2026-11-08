# State Management
Last updated: 2026-11-08

## Overview
Two Zustand stores under `src/lib/stores/` hold cross-component client state: generation (test-case streaming) and a rate-limit queue. **TanStack React Query is NOT installed or used** (not in `package.json`, no `QueryClient`/`useQuery` in `src/`), despite being in the CLAUDE.md stack list. Other features keep state in local `useState` inside their `*Client.tsx` plus a dedicated hook.

## Key files
- `src/lib/stores/generation.store.ts` — `useGenerationStore` (test-case stream state)
- `src/lib/stores/rate-limit.store.ts` — `useRateLimitStore`, `secondsUntilReset`
- `src/lib/hooks/useStreamTestCases.ts` — SSE consumer for `/api/generate/test-cases`; writes the generation store; exports `{ generate, cancel }`
- `src/lib/hooks/useStreamUXAudit.ts`, `useStreamPersonaFriction.ts`, `useStreamI18nAudit.ts` — per-feature SSE hooks holding LOCAL state (`status/result/partial/error/provider/model/estimatedTokens`), not stores
- `src/lib/hooks/useStaleArtifact.ts` (prompt-version nudge), `useTokenEstimate.ts` (calls `/api/generate/estimate`)
- (No `src/stores/`, `useProject.ts`, `useGeneration.ts`, or `useStreamObject.ts`.)

## Generation store (actual)
```typescript
status: 'idle' | 'starting' | 'streaming' | 'judging' | 'complete' | 'partial' | 'error'
cases: TestCase[]         // final / kept cases
streaming: TestCase[]     // live, unverified cases during the stream
partial: boolean; resumeFrom: number | null
meta: { provider, model, estimatedTokens } | null
error: string | null; buffer: string; coverageSummary: string
actions: start, setMeta, appendBuffer, setStreamingCases, setFinalCases(cases, coverageSummary?),
         setPartial(fromIndex), setError, startJudge, complete, reset
```
Persists only in memory — reloading the page empties it (the Export page depends on it; see export.md).

## Rate-limit store (actual)
`status: idle|running|rate_limited|queued|error`, `queue: QueuedJob[]`, `retryAfter` (epoch ms), `totalQueued`, `totalRan`; actions `enqueue`, `dequeue`, `setStatus`, `setRetryAfter`, `clearRetry`, `reset`. Not the per-model queues/token-budget design in older docs.
**Implementation status: nothing in `src/` calls it** — no component or hook reads or writes `useRateLimitStore`; the queue UI is not wired (see rate-limit.md).

## Streaming flow
```
generate() → store.start() [starting]
  → SSE 'meta' → setMeta [streaming]
  → SSE 'partial' → setStreamingCases(partial.test_cases)
  → SSE 'done' → setFinalCases (server already ran Judge before 'done'); complete() [complete]
Stream drops / cancel → setPartial(streaming.length + 1) [partial] → banner: Resume | Keep Partial
  Resume → generate({ resumeFrom })   (prompt: "Continue from TC-00N")
  Keep   → complete()
```
The `judging` status exists in the store but the Judge runs server-side before the final `done`, so it is mostly transient.

## Patterns
- Use `useGenerationStore.getState()` inside callbacks (hook has no deps) to avoid stale closures.
- `resumeFrom` means “next TC number to generate”, hence the `+1`.
- Skeleton rows appear while `status` is starting/streaming/judging.

## Gotchas
- `streaming` cases may have undefined fields mid-stream.
- `reset()` empties `cases`; call it only after data is persisted (the artifact is saved server-side on `done`).
- `retryAfter` stores an epoch timestamp, not a duration.
- Other features (UX audit, personas, i18n) do not share the generation store; navigating away loses their in-flight state, though results are saved as artifacts.

## Do not
- Add React Query without listing the dependency and asking first (RULE 4).
- Move AI SDK calls into stores or components; use hooks that call route handlers.
