/**
 * Rate limit queue store.
 * Tracks in-flight AI requests and queues them when GROQ 429s.
 * UI can subscribe to show the "Rate limited — queued" badge.
 */
import { create } from 'zustand';

export type QueueStatus = 'idle' | 'running' | 'rate_limited' | 'queued' | 'error';

interface QueuedJob {
  id:        string;
  label:     string;   // human-readable description
  provider:  string;
  enqueued:  number;   // timestamp
}

interface RateLimitState {
  status:       QueueStatus;
  queue:        QueuedJob[];
  retryAfter:   number | null; // epoch ms when GROQ will unblock
  totalQueued:  number;
  totalRan:     number;

  // Actions
  enqueue:      (job: Omit<QueuedJob, 'enqueued'>) => void;
  dequeue:      (id: string)  => void;
  setStatus:    (s: QueueStatus) => void;
  setRetryAfter:(ms: number)  => void;
  clearRetry:   ()            => void;
  reset:        ()            => void;
}

export const useRateLimitStore = create<RateLimitState>((set) => ({
  status:      'idle',
  queue:       [],
  retryAfter:  null,
  totalQueued: 0,
  totalRan:    0,

  enqueue: (job) => set((s) => ({
    queue:       [...s.queue, { ...job, enqueued: Date.now() }],
    status:      'queued',
    totalQueued: s.totalQueued + 1,
  })),

  dequeue: (id) => set((s) => {
    const queue = s.queue.filter((j) => j.id !== id);
    return {
      queue,
      status:   queue.length > 0 ? 'queued' : 'idle',
      totalRan: s.totalRan + 1,
    };
  }),

  setStatus:    (status)     => set({ status }),
  setRetryAfter:(ms)         => set({ retryAfter: ms, status: 'rate_limited' }),
  clearRetry:   ()           => set({ retryAfter: null, status: 'idle' }),
  reset:        ()           => set({ status: 'idle', queue: [], retryAfter: null }),
}));

/** Returns seconds until GROQ rate limit resets. 0 = already clear. */
export function secondsUntilReset(retryAfter: number | null): number {
  if (!retryAfter) return 0;
  return Math.max(0, Math.ceil((retryAfter - Date.now()) / 1000));
}
