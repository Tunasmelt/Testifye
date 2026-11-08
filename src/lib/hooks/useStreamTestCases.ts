'use client';
/**
 * Hook that drives the test-case generation SSE stream.
 * Reads from /api/generate/test-cases and feeds the Zustand generation store.
 */
import { useCallback, useRef } from 'react';
import { useGenerationStore } from '@/lib/stores/generation.store';
import type { TestSuiteOutput } from '@/lib/schemas/test-case';
import type { DeepPartial } from 'ai';

interface StreamOptions {
  projectId:   string;
  focusAreas?: string[];
  resumeFrom?: number;
  role?:       string;
}

export function useStreamTestCases() {
  // Use getState() for actions to avoid stale closures from store reference churn
  const abortRef  = useRef<AbortController | null>(null);

  const generate = useCallback(async (opts: StreamOptions) => {
    const store = useGenerationStore.getState();
    // Cancel any in-flight request
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    store.start();

    try {
      const res = await fetch('/api/generate/test-cases', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...opts }),
        signal:  abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        useGenerationStore.getState().setError(err.error ?? `HTTP ${res.status}`);
        return;
      }

      if (!res.body) {
        useGenerationStore.getState().setError('No response body received');
        return;
      }
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf      = '';
      let receivedDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let evt: {
            type: string;
            provider?: string; model?: string; estimatedTokens?: number;
            object?: DeepPartial<TestSuiteOutput> | TestSuiteOutput;
            message?: string;
          };
          try { evt = JSON.parse(line.slice(6)); }
          catch { continue; }

          switch (evt.type) {
            case 'meta':
              useGenerationStore.getState().setMeta({
                provider:        evt.provider!,
                model:           evt.model!,
                estimatedTokens: evt.estimatedTokens ?? 0,
              });
              break;

            case 'partial': {
              const partial = evt.object as DeepPartial<TestSuiteOutput>;
              if (partial?.test_cases) {
                const live = (partial.test_cases as Array<DeepPartial<TestSuiteOutput['test_cases'][0]>>)
                  .filter((tc): tc is NonNullable<typeof tc> => !!(tc?.tc_id && tc?.title && tc?.category));
                const s = useGenerationStore.getState();
                s.appendBuffer(JSON.stringify(partial));
                s.setStreamingCases(live as TestSuiteOutput['test_cases']);
              }
              break;
            }

            case 'done': {
              receivedDone = true;
              const final = evt.object as TestSuiteOutput;
              const s = useGenerationStore.getState();
              s.setFinalCases(final?.test_cases ?? [], final?.coverage_summary ?? '');
              s.complete();
              break;
            }

            case 'error':
              useGenerationStore.getState().setError(evt.message ?? 'Unknown error');
              break;
          }
        }
      }

      // Stream closed without a 'done' event — save whatever we streamed as partial
      if (!receivedDone) {
        const s = useGenerationStore.getState();
        if (s.status === 'streaming' || s.status === 'starting') {
          // +1 so resumeFrom means "start AFTER last received TC" (matches cancel() convention)
          s.setPartial(s.streaming.length + 1);
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // user cancelled
      // On any other error, transition to partial if we have streaming cases
      const s = useGenerationStore.getState();
      if ((s.status === 'streaming' || s.status === 'starting') && s.streaming.length > 0) {
        s.setPartial(s.streaming.length + 1);
      } else {
        s.setError(err instanceof Error ? err.message : 'Stream failed');
      }
    }
  }, []); // no external deps — uses getState() for all store access

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    const current = useGenerationStore.getState();
    if (current.status === 'streaming' || current.status === 'starting') {
      // +1 so resumeFrom points to the NEXT TC to generate, not the last received
      current.setPartial(current.streaming.length + 1);
    }
  }, []);

  return { generate, cancel };
}
