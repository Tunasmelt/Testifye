'use client';

/**
 * Synthetic Test Data Generator — Phase 3 Task 3.4
 * Generates realistic test datasets for form fields detected in UI screenshots.
 */

import { useState, useCallback } from 'react';
import type { TestDataOutput, DataScenario } from '@/lib/schemas/test-data';
import * as I from '@/components/ui/Icons';

// Hex literals required — CSS vars cannot have alpha appended with string concat
const CATEGORY_COLOR: Record<string, string> = {
  valid:      '#4ade80',
  boundary:   '#60a5fa',
  invalid:    '#f87171',
  edge_case:  '#fbbf24',
};

const CATEGORY_LABELS: Record<string, string> = {
  valid:     'Valid',
  boundary:  'Boundary',
  invalid:   'Invalid',
  edge_case: 'Edge Case',
};

interface Props { projectId: string }
type Status = 'idle' | 'loading' | 'done' | 'error';

export function TestDataClient({ projectId }: Props) {
  const [description, setDescription]   = useState('');
  const [datasetCount, setDatasetCount]  = useState(5);
  const [status, setStatus]             = useState<Status>('idle');
  const [result, setResult]             = useState<TestDataOutput | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [provider, setProvider]         = useState('');
  const [filterCat, setFilter]          = useState<string>('all');
  const [expanded, setExpanded]         = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId]         = useState<string | null>(null);

  const run = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 115_000);

    try {
      const res = await fetch('/api/generate/test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectDescription: description.trim() || undefined,
          datasetCount,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as { data: TestDataOutput; provider: string; model: string };
      setResult(json.data);
      setProvider(`${json.provider} / ${json.model}`);
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
  }, [projectId, description, datasetCount]);

  const filtered: DataScenario[] = (result?.scenarios ?? []).filter(
    (s) => filterCat === 'all' || s.category === filterCat,
  );

  // Use actual scenarios array length, not the AI-reported total_count (may differ)
  const actualTotal = result?.scenarios.length ?? 0;

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyScenario = async (s: DataScenario) => {
    const text = `${s.scenario_id}: ${s.name}\n` +
      s.fields.map((f) => `  ${f.field_name}: ${f.value}`).join('\n') +
      `\n\nExpected: ${s.expected_outcome}`;
    await navigator.clipboard.writeText(text).catch(() => null);
    setCopiedId(s.scenario_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="tf-fade-in">
      {/* Header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.Data size={20} style={{ color: 'var(--accent-2)' }} />
            Test Data Generator
          </div>
          <div className="tf-page-sub">
            Generate realistic synthetic datasets for all form fields — valid, boundary, invalid, and edge cases.
          </div>
        </div>
        {provider && (
          <span className="tf-provider-badge">
            <span className="tf-dot" />
            {provider}
          </span>
        )}
      </div>

      {/* Config card */}
      <div className="tf-card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="tf-label" style={{ marginBottom: 6, display: 'block' }}>
              Project description
              <span className="tf-label-hint" style={{ marginLeft: 8 }}>optional — AI uses your analyzed screens if omitted</span>
            </label>
            <textarea
              className="tf-input"
              placeholder="e.g. 'E-commerce checkout with shipping and payment forms'…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={status === 'loading'}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="tf-row">
            <div>
              <label className="tf-label" style={{ marginBottom: 6, display: 'block' }}>
                Scenarios to generate
              </label>
              <input
                type="number"
                className="tf-input"
                value={datasetCount}
                min={1}
                max={20}
                disabled={status === 'loading'}
                onChange={(e) => setDatasetCount(Math.min(20, Math.max(1, Number(e.target.value) || 5)))}
                style={{ width: 100 }}
              />
            </div>
            <div style={{ marginLeft: 'auto', marginTop: 20 }}>
              <button
                className="tf-btn tf-btn-primary"
                disabled={status === 'loading'}
                onClick={run}
              >
                {status === 'loading'
                  ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Generating…</>
                  : <><I.Data size={14} /> Generate Test Data</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

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
          {/* Coverage summary */}
          <div className="tf-card" style={{ padding: 14, marginBottom: 16 }}>
            <p style={{ marginBottom: result.fields_identified.length > 0 ? 10 : 0, fontSize: 13, lineHeight: 1.6 }}>
              <strong>{result.coverage_summary}</strong>
            </p>
            {result.fields_identified.length > 0 && (
              <div className="tf-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {result.fields_identified.map((f) => (
                  <span key={f} className="tf-badge" style={{ background: 'var(--bg-2)', color: 'var(--text-1)', fontSize: 11 }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Filter row */}
          <div className="tf-row" style={{ marginBottom: 12 }}>
            <select className="tf-select" style={{ minWidth: 160 }} value={filterCat} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <span style={{ marginLeft: 'auto', color: 'var(--text-2)', fontSize: 12 }}>
              {filtered.length} of {actualTotal} scenarios
            </span>
          </div>

          {/* Scenario accordion */}
          {filtered.length === 0 ? (
            <div className="tf-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>
              No scenarios match the current filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((s) => {
                const isOpen = expanded.has(s.scenario_id);
                return (
                  <div key={s.scenario_id} className="tf-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Accordion header */}
                    <div
                      className="tf-row"
                      style={{ padding: '12px 14px', cursor: 'pointer', gap: 10 }}
                      onClick={() => toggleExpanded(s.scenario_id)}
                    >
                      <span
                        className="tf-badge"
                        style={{ background: CATEGORY_COLOR[s.category] + '22', color: CATEGORY_COLOR[s.category], borderColor: CATEGORY_COLOR[s.category] + '44', fontSize: 10 }}
                      >
                        {CATEGORY_LABELS[s.category]}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-2)' }}>
                        {s.scenario_id}
                      </span>
                      <strong style={{ flex: 1, fontSize: 13 }}>{s.name}</strong>
                      <button
                        className="tf-btn tf-btn-icon tf-btn-sm tf-btn-ghost"
                        title="Copy to clipboard"
                        onClick={(e) => { e.stopPropagation(); void copyScenario(s); }}
                      >
                        {copiedId === s.scenario_id ? <I.Check size={13} /> : <I.Copy size={13} />}
                      </button>
                      <I.ChevronDown
                        size={15}
                        style={{ color: 'var(--text-2)', transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s', flexShrink: 0 }}
                      />
                    </div>

                    {/* Accordion body */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
                          {s.description}
                        </p>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Field', 'Type', 'Value', 'Notes'].map((h) => (
                                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-2)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {s.fields.map((f) => (
                              <tr key={f.field_name} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '7px 8px', fontWeight: 600 }}>{f.field_name}</td>
                                <td style={{ padding: '7px 8px', color: 'var(--text-2)' }}>{f.field_type}</td>
                                <td style={{ padding: '7px 8px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-2)' }}>{f.value}</td>
                                <td style={{ padding: '7px 8px', color: 'var(--text-2)' }}>{f.notes ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)', fontSize: 13 }}>
                          <div style={{ color: 'var(--text-2)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>
                            Expected outcome
                          </div>
                          <p style={{ lineHeight: 1.6 }}>{s.expected_outcome}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Idle empty state */}
      {status === 'idle' && (
        <div className="tf-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          <I.Data size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Generate synthetic test data based on your project&#39;s UI.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Includes valid, boundary, invalid, and edge case scenarios.</p>
        </div>
      )}
    </div>
  );
}
