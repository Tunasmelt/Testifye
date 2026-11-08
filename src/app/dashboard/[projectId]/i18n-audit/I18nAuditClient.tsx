'use client';

/**
 * i18n / RTL Audit — Phase 4 Task 4.2
 * Checks UI for internationalization readiness.
 */

import { useState, useCallback, useRef, KeyboardEvent } from 'react';
import { useStreamI18nAudit } from '@/lib/hooks/useStreamI18nAudit';
import type { I18nFinding } from '@/lib/schemas/i18n-audit';
import * as I from '@/components/ui/Icons';

// ── Colors ────────────────────────────────────────────────────────────────────

const SEVERITY_HEX: Record<string, string> = {
  critical: '#f87171',
  major:    '#fbbf24',
  minor:    '#94a3b8',
};

const CATEGORY_LABELS: Record<string, string> = {
  text_expansion:      'Text Expansion',
  rtl:                 'RTL Layout',
  date_format:         'Date Format',
  currency:            'Currency',
  number_format:       'Number Format',
  cultural_assumption: 'Cultural Assumption',
};

const CATEGORY_ICONS: Record<string, string> = {
  text_expansion:      '↔',
  rtl:                 '⇄',
  date_format:         '📅',
  currency:            '💱',
  number_format:       '#',
  cultural_assumption: '🌍',
};

// Pre-set locale chips for quick selection
const PRESET_LOCALES = [
  { code: 'ar-SA', label: 'Arabic (RTL)' },
  { code: 'he-IL', label: 'Hebrew (RTL)' },
  { code: 'de-DE', label: 'German' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'fr-FR', label: 'French' },
];

interface Props { projectId: string }

export function I18nAuditClient({ projectId }: Props) {
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [localeInput, setLocaleInput]     = useState('');
  const [filterCat, setFilterCat]         = useState('all');
  const [filterSev, setFilterSev]         = useState('all');
  const localeInputRef = useRef<HTMLInputElement>(null);

  const { status, result, partial, error, provider, model, run, cancel } =
    useStreamI18nAudit();

  const isRunning = status === 'starting' || status === 'streaming';

  const addLocale = useCallback((code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setTargetLocales((prev) => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setLocaleInput('');
  }, []);

  const removeLocale = useCallback((code: string) => {
    setTargetLocales((prev) => prev.filter((l) => l !== code));
  }, []);

  const handleLocaleKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && localeInput.trim()) {
      e.preventDefault();
      addLocale(localeInput.replace(',', ''));
    }
    if (e.key === 'Backspace' && !localeInput && targetLocales.length > 0) {
      setTargetLocales((prev) => prev.slice(0, -1));
    }
  }, [localeInput, targetLocales, addLocale]);

  const handleRun = useCallback(() => {
    run({ projectId, targetLocales: targetLocales.length > 0 ? targetLocales : undefined });
  }, [run, projectId, targetLocales]);

  const activeResult = result ?? partial;
  const findings: I18nFinding[] = (activeResult?.findings ?? []) as I18nFinding[];

  const filtered = findings.filter((f) => {
    if (filterCat !== 'all' && f.category !== filterCat) return false;
    if (filterSev !== 'all' && f.severity !== filterSev) return false;
    return true;
  });

  const readinessScore  = typeof activeResult?.readiness_score === 'number' ? activeResult.readiness_score : null;
  const readinessLabel  = activeResult?.readiness_label ?? '';
  const recommendedLocales = (activeResult?.recommended_locales ?? []) as string[];
  const summary         = activeResult?.summary;

  const scoreColor =
    readinessScore === null ? 'var(--text-2)'
    : readinessScore >= 80  ? 'var(--success)'
    : readinessScore >= 60  ? 'var(--warning)'
    : 'var(--error)';

  return (
    <div className="tf-fade-in">
      {/* Header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.Globe size={20} style={{ color: 'var(--accent-2)' }} />
            i18n / RTL Audit
          </div>
          <div className="tf-page-sub">
            Check your UI for internationalization readiness — text expansion, RTL layouts, date formats, and cultural assumptions.
          </div>
        </div>
        {(provider && model) && (
          <span className="tf-provider-badge">
            <span className="tf-dot" />
            {provider} / {model}
          </span>
        )}
      </div>

      {/* Config card */}
      <div className="tf-card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-1)' }}>
          Target locales <span style={{ fontWeight: 400, color: 'var(--text-2)', fontSize: 12 }}>(optional — leave empty for broad coverage)</span>
        </div>

        {/* Preset chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {PRESET_LOCALES.map((l) => {
            const active = targetLocales.includes(l.code);
            return (
              <button
                key={l.code}
                className="tf-btn tf-btn-sm"
                onClick={() => active ? removeLocale(l.code) : addLocale(l.code)}
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background:  active ? 'var(--accent-glow)' : 'transparent',
                  color:       active ? 'var(--accent-2)' : 'var(--text-2)',
                }}
              >
                {active && <I.Check size={11} />} {l.label}
              </button>
            );
          })}
        </div>

        {/* Tag input for custom locales */}
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'text', minHeight: 40 }}
          onClick={() => localeInputRef.current?.focus()}
        >
          {targetLocales.map((l) => (
            <span
              key={l}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--accent-glow)', borderRadius: 20, fontSize: 12, color: 'var(--accent-2)', border: '1px solid var(--accent-strong)' }}
            >
              {l}
              <button onClick={(e) => { e.stopPropagation(); removeLocale(l); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-2)', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          ))}
          <input
            ref={localeInputRef}
            value={localeInput}
            onChange={(e) => setLocaleInput(e.target.value)}
            onKeyDown={handleLocaleKey}
            placeholder={targetLocales.length === 0 ? 'Type a locale code (e.g. ar-SA) and press Enter…' : ''}
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--text-1)', minWidth: 120 }}
          />
        </div>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {isRunning && (
            <button className="tf-btn" onClick={cancel}>
              <I.X size={14} /> Cancel
            </button>
          )}
          <button
            className="tf-btn tf-btn-primary"
            disabled={isRunning}
            onClick={handleRun}
          >
            {isRunning
              ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Auditing…</>
              : <><I.Globe size={14} /> Run i18n Audit</>
            }
          </button>
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

      {/* Streaming skeleton */}
      {(status === 'starting' || (status === 'streaming' && !activeResult?.readiness_score)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="tf-card" style={{ padding: 14 }}>
              <div className="tf-skeleton" style={{ width: `${60 + i * 10}%`, height: 14, borderRadius: 4, marginBottom: 8 }} />
              <div className="tf-skeleton" style={{ width: '40%', height: 11, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {(status === 'streaming' || status === 'complete') && activeResult?.readiness_score !== undefined && (
        <>
          {/* Score row */}
          <div className="tf-grid-4" style={{ marginBottom: 20 }}>
            {/* Readiness score */}
            <div className="tf-card" style={{ padding: 14, textAlign: 'center', gridColumn: 'span 1' }}>
              <div className="tf-stat" style={{ color: scoreColor, fontSize: 36 }}>{readinessScore ?? '—'}</div>
              <div className="tf-stat-label" style={{ marginTop: 2 }}>Readiness Score</div>
              {readinessLabel && (
                <div style={{ marginTop: 6, fontSize: 11, color: scoreColor, fontWeight: 600 }}>{readinessLabel}</div>
              )}
            </div>

            {/* Summary badges */}
            {[
              { label: 'Critical', value: summary?.critical ?? 0, color: '#f87171' },
              { label: 'Major',    value: summary?.major ?? 0,    color: '#fbbf24' },
              { label: 'Minor',    value: summary?.minor ?? 0,    color: '#94a3b8' },
            ].map(({ label, value, color }) => (
              <div key={label} className="tf-card" style={{ padding: 14, textAlign: 'center' }}>
                <div className="tf-stat" style={{ color }}>{value}</div>
                <div className="tf-stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Recommended locales */}
          {recommendedLocales.length > 0 && (
            <div className="tf-card" style={{ padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, flexShrink: 0 }}>Priority test locales:</span>
              {recommendedLocales.map((loc) => (
                <span
                  key={loc}
                  style={{ padding: '2px 10px', background: 'var(--accent-glow)', border: '1px solid var(--accent-strong)', borderRadius: 20, fontSize: 12, color: 'var(--accent-2)' }}
                >
                  {loc}
                </span>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="tf-row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <select
              className="tf-select"
              style={{ minWidth: 160 }}
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
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
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
            <span style={{ marginLeft: 'auto', color: 'var(--text-2)', fontSize: 12, alignSelf: 'center' }}>
              {filtered.length} of {findings.length} findings
            </span>
          </div>

          {/* Findings */}
          {filtered.length === 0 ? (
            <div className="tf-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>
              {findings.length === 0
                ? <><I.CheckCircle size={24} style={{ marginBottom: 8, color: 'var(--success)' }} /><p style={{ fontSize: 14 }}>No issues found.</p></>
                : <p style={{ fontSize: 14 }}>No findings match the current filters.</p>
              }
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((f, i) => (
                <div key={i} className="tf-card" style={{ padding: 14 }}>
                  <div className="tf-row" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <span
                      className="tf-badge"
                      style={{ background: SEVERITY_HEX[f.severity] + '22', color: SEVERITY_HEX[f.severity], borderColor: SEVERITY_HEX[f.severity] + '44' }}
                    >
                      {f.severity.toUpperCase()}
                    </span>
                    <span className="tf-badge" style={{ background: 'var(--bg-2)', color: 'var(--text-1)' }}>
                      {CATEGORY_ICONS[f.category] ?? ''} {CATEGORY_LABELS[f.category] ?? f.category}
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-2)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                      {f.screen} · {f.element}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{f.detail}</p>
                  {f.locales?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {f.locales.map((loc: string) => (
                        <span
                          key={loc}
                          style={{ padding: '1px 8px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11, color: 'var(--text-2)' }}
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Idle empty state */}
      {status === 'idle' && (
        <div className="tf-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          <I.Globe size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Run an i18n audit to check your UI for internationalization issues.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Optionally specify target locales, or leave empty for broad coverage.</p>
        </div>
      )}
    </div>
  );
}
