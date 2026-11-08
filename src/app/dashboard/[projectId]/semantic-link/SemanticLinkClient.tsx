'use client';

/**
 * Semantic Link Engine — Phase 3 Task 3.3
 * Maps each PRD requirement to its UI implementation (or flags it missing/untested).
 */

import { useState, useRef, useCallback } from 'react';
import type { SemanticLinkOutput, SemanticLink } from '@/lib/schemas/semantic-link';
import { useStaleArtifact } from '@/lib/hooks/useStaleArtifact';
import * as I from '@/components/ui/Icons';

const STATUS_COLOR: Record<string, string> = {
  verified: 'var(--success)',
  missing:  'var(--error)',
  mismatch: 'var(--warning)',
  untested: 'var(--text-2)',
};

const STATUS_ICON: Record<string, string> = {
  verified: '✓',
  missing:  '✗',
  mismatch: '⚠',
  untested: '—',
};

type FilterStatus = 'all' | 'verified' | 'missing' | 'mismatch' | 'untested';

interface Props { projectId: string }
type Status = 'idle' | 'loading' | 'done' | 'error';

export function SemanticLinkClient({ projectId }: Props) {
  const [inputMode, setInputMode]   = useState<'file' | 'text'>('file');
  const [file, setFile]             = useState<File | null>(null);
  const [text, setText]             = useState('');
  const [status, setStatus]         = useState<Status>('idle');
  const [result, setResult]         = useState<SemanticLinkOutput | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [provider, setProvider]     = useState('');
  const [truncated, setTruncated]   = useState(false);
  const [filterStatus, setFilter]   = useState<FilterStatus>('all');
  const [staleKey, setStaleKey]     = useState(0);
  const stale = useStaleArtifact(projectId, 'semantic_link', staleKey);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canRun = inputMode === 'file' ? !!file : text.trim().length > 50;

  const run = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append('projectId', projectId);
    if (inputMode === 'file' && file) {
      fd.append('file', file);
    } else {
      fd.append('text', text);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 115_000);

    try {
      const res = await fetch('/api/generate/semantic-link', { method: 'POST', body: fd, signal: controller.signal });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as { output: SemanticLinkOutput; provider: string; model: string; extractedChars: number };
      setResult(json.output);
      setProvider(`${json.provider} / ${json.model}`);
      setTruncated(json.extractedChars > 10_000);
      setStaleKey((k) => k + 1);
      setStatus('done');
    } catch (e) {
      const msg = e instanceof DOMException && e.name === 'AbortError'
        ? 'Request timed out — please try again'
        : e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      setStatus('error');
    } finally {
      clearTimeout(timeout);
    }
  }, [projectId, inputMode, file, text]);

  const filtered: SemanticLink[] = (result?.links ?? []).filter((l) =>
    filterStatus === 'all' || l.status === filterStatus,
  );

  // Use summary totals for coverage % — more accurate than links.length which may be filtered
  const summaryTotal = result
    ? (result.summary.verified + result.summary.missing + result.summary.mismatch + result.summary.untested)
    : 0;
  const total    = summaryTotal > 0 ? summaryTotal : (result?.links.length ?? 0);
  const coverage = total > 0 ? Math.round(((result?.summary.verified ?? 0) / total) * 100) : 0;

  return (
    <div className="tf-fade-in">
      {/* Header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.Link size={20} style={{ color: 'var(--accent-2)' }} />
            Semantic Link
          </div>
          <div className="tf-page-sub">
            Upload your PRD — AI creates a traceability matrix linking each requirement to its UI element.
          </div>
        </div>
        {provider && (
          <span className="tf-provider-badge">
            <span className="tf-dot" />
            {provider}
          </span>
        )}
      </div>

      {/* Input card */}
      <div className="tf-card" style={{ marginBottom: 20, padding: 16 }}>
        <div className="tf-tabs" style={{ marginBottom: 16 }}>
          <button className={`tf-tab${inputMode === 'file' ? ' active' : ''}`} onClick={() => setInputMode('file')}>
            Upload File
          </button>
          <button className={`tf-tab${inputMode === 'text' ? ' active' : ''}`} onClick={() => setInputMode('text')}>
            Paste Text
          </button>
        </div>

        {inputMode === 'file' ? (
          <div
            className="tf-uploader__zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) setFile(f);
            }}
            style={{ cursor: 'pointer' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <I.Upload size={28} style={{ marginBottom: 8, color: 'var(--text-2)' }} />
            {file ? (
              <div>
                <p className="tf-uploader__label">{file.name}</p>
                <p className="tf-uploader__hint">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="tf-uploader__label">Drop your PRD here or click to browse</p>
                <p className="tf-uploader__hint">PDF, DOCX, TXT · max 20 MB</p>
              </div>
            )}
          </div>
        ) : (
          <textarea
            className="tf-input"
            placeholder="Paste your requirements or PRD text here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            style={{ resize: 'vertical' }}
          />
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="tf-btn tf-btn-primary" disabled={!canRun || status === 'loading'} onClick={run}>
            {status === 'loading'
              ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Linking…</>
              : <><I.Link size={14} /> Build Traceability Matrix</>
            }
          </button>
        </div>
      </div>

      {/* Stale prompt nudge */}
      {stale?.stale && stale.exists && status !== 'loading' && (
        <div
          className="tf-card tf-fade-in"
          style={{ marginBottom: 12, padding: 12, borderColor: 'var(--accent-strong)', background: 'var(--accent-glow)', display: 'flex', gap: 10, alignItems: 'center' }}
        >
          <I.Sparkle size={14} style={{ color: 'var(--accent-2)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, flex: 1 }}>
            This traceability matrix was generated with an older prompt version. Re-run for improved results.
          </span>
          <button className="tf-btn tf-btn-sm" onClick={run} disabled={!canRun}>Re-run</button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div
          className="tf-card"
          style={{ marginBottom: 16, padding: 14, borderColor: 'var(--error)', background: 'rgba(248,113,113,0.05)', display: 'flex', gap: 10, alignItems: 'center' }}
        >
          <I.AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <>
          {/* Truncation warning */}
          {truncated && (
            <div
              className="tf-card tf-fade-in"
              style={{ marginBottom: 16, padding: '10px 14px', borderColor: 'var(--warning)', background: 'rgba(251,191,36,0.05)', display: 'flex', gap: 10, alignItems: 'center' }}
            >
              <I.Alert size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>
                Document exceeds the 10,000-character analysis window — later sections may not be fully linked. Consider splitting large PRDs.
              </span>
            </div>
          )}

          {/* Summary — clickable to filter */}
          <div className="tf-grid-4" style={{ marginBottom: 20 }}>
            {(['verified', 'missing', 'mismatch', 'untested'] as const).map((s) => (
              <div
                key={s}
                className="tf-card"
                style={{
                  padding: 14, textAlign: 'center', cursor: 'pointer',
                  borderColor: filterStatus === s ? STATUS_COLOR[s] : undefined,
                  transition: 'border-color 0.15s',
                }}
                onClick={() => setFilter(filterStatus === s ? 'all' : s)}
              >
                <div className="tf-stat" style={{ color: STATUS_COLOR[s] }}>{result.summary[s]}</div>
                <div className="tf-stat-label" style={{ textTransform: 'capitalize' }}>{s}</div>
              </div>
            ))}
          </div>

          {/* Coverage bar */}
          <div className="tf-card" style={{ padding: 14, marginBottom: 16 }}>
            <div className="tf-row" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>Requirements coverage</span>
              <span style={{ marginLeft: 'auto', fontWeight: 700, color: coverage >= 70 ? 'var(--success)' : coverage >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                {coverage}%
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-1)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', width: `${coverage}%`, borderRadius: 4,
                  background: coverage >= 70 ? 'var(--success)' : coverage >= 40 ? 'var(--warning)' : 'var(--error)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Filter row */}
          <div className="tf-row" style={{ marginBottom: 12 }}>
            <select
              className="tf-select"
              style={{ minWidth: 160 }}
              value={filterStatus}
              onChange={(e) => setFilter(e.target.value as FilterStatus)}
            >
              <option value="all">All statuses</option>
              <option value="verified">Verified</option>
              <option value="missing">Missing</option>
              <option value="mismatch">Mismatch</option>
              <option value="untested">Untested</option>
            </select>
            <span style={{ marginLeft: 'auto', color: 'var(--text-2)', fontSize: 12 }}>
              {filtered.length} of {total} requirements
            </span>
          </div>

          {/* Traceability table */}
          {filtered.length === 0 ? (
            <div className="tf-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>
              No requirements match the current filter.
            </div>
          ) : (
            <div className="tf-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['', 'Requirement', 'Location', 'UI Element', 'Conf.'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-2)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((link, i) => (
                    <tr
                      key={`${i}-${link.loc}-${link.req.slice(0, 32)}`}
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: STATUS_COLOR[link.status], fontWeight: 700, fontSize: 16 }}>
                        {STATUS_ICON[link.status]}
                      </td>
                      <td style={{ padding: '10px 12px', maxWidth: 340 }}>
                        <p style={{ marginBottom: link.note ? 4 : 0, lineHeight: 1.5 }}>{link.req}</p>
                        {link.note && <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{link.note}</p>}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                        {link.loc}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {link.element ? (
                          <>
                            <span>{link.element}</span>
                            {link.screen && (
                              <span style={{ color: 'var(--text-2)', marginLeft: 6, fontSize: 12 }}>({link.screen})</span>
                            )}
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-2)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text-2)' }}>
                        {(link.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Idle empty state */}
      {status === 'idle' && (
        <div className="tf-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          <I.Link size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Upload a PRD to build a traceability matrix.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Each requirement is linked to its UI implementation.</p>
        </div>
      )}
    </div>
  );
}
