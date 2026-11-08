'use client';
/**
 * Hook that drives the i18n Audit SSE stream.
 */
import { useCallback, useRef, useState } from 'react';
import type { I18nAuditOutput } from '@/lib/schemas/i18n-audit';
import type { DeepPartial } from 'ai';

export type I18nAuditStatus =
  | 'idle'
  | 'starting'
  | 'streaming'
  | 'complete'
  | 'error';

interface I18nAuditState {
  status:          I18nAuditStatus;
  result:          I18nAuditOutput | null;
  partial:         DeepPartial<I18nAuditOutput> | null;
  error:           string | null;
  provider:        string | null;
  model:           string | null;
  estimatedTokens: number;
}

const INITIAL: I18nAuditState = {
  status:          'idle',
  result:          null,
  partial:         null,
  error:           null,
  provider:        null,
  model:           null,
  estimatedTokens: 0,
};

interface StreamOptions {
  projectId:     string;
  targetLocales?: string[];
}

export function useStreamI18nAudit() {
  const [state, setState] = useState<I18nAuditState>(INITIAL);
  const abortRef          = useRef<AbortController | null>(null);

  const run = useCallback(async (opts: StreamOptions) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setState({ ...INITIAL, status: 'starting' });

    try {
      const res = await fetch('/api/generate/i18n-audit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(opts),
        signal:  abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setState((s) => ({ ...s, status: 'error', error: err.error ?? `HTTP ${res.status}` }));
        return;
      }

      setState((s) => ({ ...s, status: 'streaming' }));

      const reader = res.body!.getReader();
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
          let evt: { type: string; [k: string]: unknown };
          try { evt = JSON.parse(line.slice(6)); }
          catch { continue; }

          switch (evt.type) {
            case 'meta':
              setState((s) => ({
                ...s,
                provider:        evt.provider as string,
                model:           evt.model as string,
                estimatedTokens: (evt.estimatedTokens as number) ?? 0,
              }));
              break;

            case 'partial':
              setState((s) => ({ ...s, partial: evt.object as DeepPartial<I18nAuditOutput> }));
              break;

            case 'done':
              receivedDone = true;
              setState((s) => ({
                ...s,
                status:  'complete',
                result:  evt.object as I18nAuditOutput,
                partial: null,
              }));
              break;

            case 'error':
              setState((s) => ({ ...s, status: 'error', error: evt.message as string }));
              break;
          }
        }
      }

      if (!receivedDone) {
        setState((s) =>
          s.status === 'streaming' || s.status === 'starting'
            ? { ...s, status: 'error', error: 'Stream ended unexpectedly. Please retry.' }
            : s,
        );
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState((s) => ({
        ...s,
        status: 'error',
        error:  err instanceof Error ? err.message : 'Stream failed',
      }));
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) =>
      s.status === 'streaming' || s.status === 'starting'
        ? { ...s, status: 'idle' }
        : s
    );
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, run, cancel, reset };
}
