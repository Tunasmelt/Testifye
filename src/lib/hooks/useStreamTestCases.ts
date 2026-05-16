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
}

export function useStreamTestCases() {
  const store     = useGenerationStore();
  const abortRef  = useRef<AbortController | null>(null);

  const generate = useCallback(async (opts: StreamOptions) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    store.start();

    try {
      const res = await fetch('/api/generate/test-cases', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(opts),
        signal:  abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        store.setError(err.error ?? `HTTP ${res.status}`);
        return;
      }

      const reader = res.body!.getReader();
      const dec    = new TextDecoder();
      let buf      = '';

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
              store.setMeta({
                provider:        evt.provider!,
                model:           evt.model!,
                estimatedTokens: evt.estimatedTokens ?? 0,
              });
              break;

            case 'partial': {
              const partial = evt.object as DeepPartial<TestSuiteOutput>;
              if (partial?.test_cases) {
                // Filter to cases that have at least a tc_id
                const live = (partial.test_cases as Array<DeepPartial<TestSuiteOutput['test_cases'][0]>>)
                  .filter((tc): tc is NonNullable<typeof tc> => !!tc?.tc_id);
                store.appendBuffer(JSON.stringify(partial));
                // Update the displayed list with what we have so far
                store.setStreamingCases(live as TestSuiteOutput['test_cases']);
              }
              break;
            }

            case 'done': {
              const final = evt.object as TestSuiteOutput;
              store.setFinalCases(final?.test_cases ?? []);
              store.complete();
              break;
            }

            case 'error':
              store.setError(evt.message ?? 'Unknown error');
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // user cancelled
      store.setError(err instanceof Error ? err.message : 'Stream failed');
    }
  }, [store]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    const current = useGenerationStore.getState();
    if (current.status === 'streaming' || current.status === 'starting') {
      // Mark as partial with how many we got
      store.setPartial(current.cases.length);
    }
  }, [store]);

  return { generate, cancel };
}
