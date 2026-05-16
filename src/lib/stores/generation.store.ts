/**
 * Zustand store for AI generation state.
 * Tracks streaming progress, partial results, provider info, and errors.
 */
import { create } from 'zustand';
import type { TestCase } from '@/lib/schemas/test-case';

export type GenerationStatus =
  | 'idle'
  | 'starting'
  | 'streaming'
  | 'judging'
  | 'complete'
  | 'partial'
  | 'error';

export interface GenerationMeta {
  provider: string;
  model: string;
  estimatedTokens: number;
}

interface GenerationState {
  status:    GenerationStatus;
  /** Fully verified cases (after Judge or final done) */
  cases:     TestCase[];
  /** Live cases appearing during stream (unverified, may be incomplete) */
  streaming: TestCase[];
  partial:   boolean;
  meta:      GenerationMeta | null;
  error:     string | null;
  buffer:    string;
  resumeFrom: number | null;

  // Actions
  start:           ()                         => void;
  setMeta:         (meta: GenerationMeta)     => void;
  appendBuffer:    (text: string)             => void;
  setStreamingCases: (cases: TestCase[])      => void;
  setFinalCases:   (cases: TestCase[])        => void;
  setPartial:      (fromIndex: number)        => void;
  setError:        (msg: string)              => void;
  startJudge:      ()                         => void;
  complete:        ()                         => void;
  reset:           ()                         => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  status:     'idle',
  cases:      [],
  streaming:  [],
  partial:    false,
  meta:       null,
  error:      null,
  buffer:     '',
  resumeFrom: null,

  start: () => set({
    status: 'starting', cases: [], streaming: [],
    partial: false, error: null, buffer: '', meta: null,
  }),

  setMeta: (meta) => set({ meta, status: 'streaming' }),

  appendBuffer: (text) => set((s) => ({ buffer: s.buffer + text })),

  setStreamingCases: (streaming) => set({ streaming }),

  setFinalCases: (cases) => set({ cases, streaming: [] }),

  setPartial: (fromIndex) => set((s) => ({
    status: 'partial',
    partial: true,
    resumeFrom: fromIndex,
    cases: s.streaming.slice(0, fromIndex),
    streaming: [],
  })),

  setError: (msg) => set({ status: 'error', error: msg, streaming: [] }),

  startJudge: () => set({ status: 'judging' }),

  complete: () => set({ status: 'complete', partial: false, resumeFrom: null, buffer: '' }),

  reset: () => set({
    status: 'idle', cases: [], streaming: [], partial: false,
    meta: null, error: null, buffer: '', resumeFrom: null,
  }),
}));
