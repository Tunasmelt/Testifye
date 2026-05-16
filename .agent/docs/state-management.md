# State Management
Last updated: 2026-05-09

## Overview
Two Zustand stores manage all client-side state. TanStack React Query handles server state (caching, invalidation). Rule: never use `useState` for cross-component state.

## Key files
- `src/stores/generation.store.ts` — AI streaming state, partial recovery
- `src/stores/rate-limit.store.ts` — per-model queues, cooldowns, token budgets
- `src/hooks/useProject.ts` — TanStack Query wrapper for project data
- `src/hooks/useGeneration.ts` — triggers generation, subscribes to store
- `src/hooks/useStreamObject.ts` — consumes SSE stream, feeds generation store

## Generation Store interface

```typescript
interface GenerationState {
  currentArtifact: Partial<TestSuiteOutput | UXReviewOutput | BugReport> | null;
  status: 'idle' | 'streaming' | 'verifying' | 'complete' | 'partial' | 'error';
  completedItems: number;
  estimatedTotal: number;
  errorMessage: string | null;

  startGeneration: () => void;
  handleStreamChunk: (partial: Record<string, unknown>) => void;
  handleStreamComplete: () => void;
  handleStreamError: (error: Error) => void;
  handleVerification: (verified: Record<string, unknown>) => void;
  resumeGeneration: () => void;
  keepPartial: () => void;
  reset: () => void;
}
```

## Rate Limit Store interface

```typescript
interface RateLimitState {
  queues: Record<string, PendingRequest[]>;
  cooldowns: Record<string, number>;  // model → ms timestamp when cooldown ends
  tokenBudgets: Record<string, { used: number; limit: number; resetsAt: number }>;
  activeProvider: Record<string, string>;  // task → provider name

  enqueue: (model: string, request: PendingRequest) => void;
  processNext: (model: string) => void;
  recordUsage: (model: string, tokens: number) => void;
  setActiveProvider: (task: string, provider: string) => void;
  canSend: (model: string) => boolean;
}
```

## Streaming flow (generation store lifecycle)
```
User clicks "Generate"
  → startGeneration() → status: 'streaming', skeleton cards appear
  → handleStreamChunk() called per SSE chunk → completedItems increments
  → handleStreamComplete() → status: 'verifying'
  → Judge runs (generateObject, not streaming)
  → handleVerification() → status: 'complete', is_verified set on cards
  → artifact saved to generated_artifacts
```

## Partial stream recovery
```
Network drop mid-stream
  → handleStreamError() → status: 'partial'
  → Banner: "Generation interrupted — N of ~M test cases generated."
  → [Resume] button → resumeGeneration() → re-trigger with "Continue from TC-{N+1}"
  → [Keep Partial] → keepPartial() → saves artifact with status: 'partial'
```

## Patterns
- Skeleton cards appear BEFORE any stream data — use `estimatedTotal` to render the right count
- TanStack Query `queryKey: ['artifact', projectId, artifactType]` — invalidate on generation complete
- Generation store resets when navigating to a different feature tab

## Gotchas
- `currentArtifact` is a partial object during streaming — components must handle undefined fields
- Never call `reset()` until the artifact is fully saved — risk of losing partial data
- Rate limit store `cooldowns` stores timestamps not durations — compare to `Date.now()`
