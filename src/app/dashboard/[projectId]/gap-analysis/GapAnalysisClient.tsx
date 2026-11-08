'use client';

/**
 * Gap Analysis client — Phase 3 Task 3.1
 * Upload a PRD (PDF/DOCX/TXT) or paste text → AI identifies contradictions,
 * missing flows, ambiguities, and undocumented features.
 */

import { useState, useRef, useCallback } from 'react';
import type { GapAnalysisOutput, GapFinding } from '@/lib/schemas/gap-analysis';
import { useStaleArtifact } from '@/lib/hooks/useStaleArtifact';
import * as I from '@/components/ui/Icons';

// Hex literals required — CSS vars cannot have alpha appended with string concat
const SEVERITY_COLOR: Record<string, string> = {
  critical: '#f87171',
  high:     '#fbbf24',
  medium:   '#60a5fa',
  low:      '#94a3b8',
};

const TYPE_LABELS: Record<string, string> = {
  contradiction:         'Contradiction',
  missing_flow:          'Missing Flow',
  ambiguity:             'Ambiguity',
  untestable:            'Untestable',
  undefined_error_state: 'Undefined Error',
  missing_from_ui:       'Missing from UI',
  undocumented_feature:  'Undocumented',
};

interface Props { projectId: string }
type Status = 'idle' | 'loading' | 'done' | 'error';

export function GapAnalysisClient({ projectId }: Props) {
  const [inputMode, setInputMode]   = useState<'file' | 'text'>('file');
  const [file, setFile]             = useState<File | null>(null);
  const [text, setText]             = useState('');
  const [status, setStatus]         = useState<Status>('idle');
  const [result, setResult]         = useState<GapAnalysisOutput | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [provider, setProvider]     = useState('');
  const [truncated, setTruncated]   = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSev, setFilterSev]   = useState<string>('all');
  const [staleKey, setStaleKey]     = useState(0);
  const stale = useStaleArtifact(projectId, 'gap_analysis', staleKey);
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
      const res = await fetch('/api/generate/gap-analysis', { method: 'POST', body: fd, signal: controller.signal });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as { analysis: GapAnalysisOutput; provider: string; model: string; extractedChars: number };
      setResult(json.analysis);
      setProvider(`${json.provider} / ${json.model}`);
      setTruncated(json.extractedChars > 12_000);
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

  const filtered: GapFinding[] = (result?.findings ?? []).filter((f) => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (filterSev  !== 'all' && f.severity !== filterSev) return false;
    return true;
  });

  return (
    <div className="tf-fade-in">
      {/* Header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.Gap size={20} style={{ color: 'var(--accent-2)' }} />
            Gap Analysis
          </div>
          <div className="tf-page-sub">
            Upload your PRD or requirements doc — AI flags contradictions, missing flows, and untestable requirements.
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
        {/* File / text tabs */}
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
            placeholder="Paste your requirements or PRD text here (minimum 50 characters)…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            style={{ resize: 'vertical' }}
          />
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="tf-btn tf-btn-primary"
            disabled={!canRun || status === 'loading'}
            onClick={run}
          >
            {status === 'loading'
              ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Analysing…</>
              : <><I.Gap size={14} /> Run Gap Analysis</>
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
            This analysis was generated with an older prompt version. Re-run for improved results.
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
          {/* Truncation warning — shown when document was larger than the 12K-char analysis window */}
          {truncated && (
            <div
              className="tf-card tf-fade-in"
              style={{ marginBottom: 16, padding: '10px 14px', borderColor: 'var(--warning)', background: 'rgba(251,191,36,0.05)', display: 'flex', gap: 10, alignItems: 'center' }}
            >
              <I.Alert size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>
                Document exceeds the 12,000-character analysis window — later sections may not be fully analyzed. Consider splitting large PRDs.
              </span>
            </div>
          )}

          {/* Summary bar */}
          <div className="tf-grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Requirements',        value: result.requirements_count,             color: undefined },
              { label: 'Gaps found',          value: result.findings.length,               color: undefined },
              { label: 'Contradictions',      value: result.summary.contradictions,         color: 'var(--error)' },
              { label: 'Missing flows',       value: result.summary.missing_flows,          color: 'var(--warning)' },
              { label: 'Ambiguities',         value: result.summary.ambiguities,            color: 'var(--info)' },
              { label: 'Untestable',          value: result.summary.untestable,             color: '#94a3b8' },
              { label: 'Undefined errors',    value: result.summary.undefined_error_states, color: '#f87171' },
              { label: 'Missing from UI',     value: result.summary.missing_from_ui,        color: '#fbbf24' },
              { label: 'Undocumented',        value: result.summary.undocumented_features,  color: '#a78bfa' },
            ].map(({ label, value, color }) => (
              <div key={label} className="tf-card" style={{ padding: 14, textAlign: 'center' }}>
                <div className="tf-stat" style={color ? { color } : undefined}>{value}</div>
                <div className="tf-stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="tf-row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <select
              className="tf-select"
              style={{ minWidth: 160 }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All types</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              className="tf-select"
              style={{ minWidth: 140 }}
              value={filterSev}
              onChange={(e) => setFilterSev(e.target.value)}
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <span style={{ marginLeft: 'auto', color: 'var(--text-2)', fontSize: 12, alignSelf: 'center' }}>
              {filtered.length} of {result.findings.length} gaps
            </span>
          </div>

          {/* Findings list */}
          {filtered.length === 0 ? (
            <div className="tf-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>
              No gaps match the current filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((f) => (
                <div key={f.id} className="tf-card" style={{ padding: 14 }}>
                  <div className="tf-row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                    <span
                      className="tf-badge"
                      style={{ background: SEVERITY_COLOR[f.severity] + '22', color: SEVERITY_COLOR[f.severity], borderColor: SEVERITY_COLOR[f.severity] + '44' }}
                    >
                      {f.severity.toUpperCase()}
                    </span>
                    <span className="tf-badge" style={{ background: 'var(--bg-2)', color: 'var(--text-1)' }}>
                      {TYPE_LABELS[f.type] ?? f.type}
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-2)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                      {f.id} · {f.location}
                    </span>
                  </div>
                  <p style={{ marginBottom: 10, fontSize: 13, lineHeight: 1.6 }}>{f.description}</p>
                  <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: '10px 12px', fontSize: 13, border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text-2)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>
                      Suggestion
                    </div>
                    <p style={{ lineHeight: 1.6 }}>{f.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Idle empty state */}
      {status === 'idle' && (
        <div className="tf-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          <I.Gap size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Upload a PRD to find gaps in your requirements.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>PDF, DOCX, and TXT are supported.</p>
        </div>
      )}
    </div>
  );
}
