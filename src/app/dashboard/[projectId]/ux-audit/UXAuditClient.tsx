'use client';

/**
 * UX Audit client page — Task 2.1
 * Streams a UX/UI audit via SSE and renders findings, scores, and a11y flags.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStreamUXAudit } from '@/lib/hooks/useStreamUXAudit';
import { useStaleArtifact } from '@/lib/hooks/useStaleArtifact';
import type { UXFinding, A11yFlag, UXReviewOutput } from '@/lib/schemas/ux-review';
import type { DeepPartial } from 'ai';
import * as I from '@/components/ui/Icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const AUDIT_FOCUS_OPTIONS = [
  'Full Audit',
  'Onboarding & First-Time UX',
  'Checkout & Conversion Flow',
  'Forms & Input Validation',
  'Error Handling & Recovery',
  'Information Architecture',
  'Mobile Usability',
] as const;

const SEVERITY_COLORS: Record<string, string> = {
  critical:    '#f87171',
  major:       '#fbbf24',
  minor:       '#60a5fa',
  enhancement: '#94a3b8',
};

const EFFORT_LABELS: Record<string, string> = {
  'quick-win':  '⚡ Quick Win',
  'moderate':   '⏱ Moderate',
  'significant': '🔧 Significant',
};

interface Props { projectId: string }

export function UXAuditClient({ projectId }: Props) {
  const { status, result, partial, error, provider, model, run, cancel } = useStreamUXAudit();
  const [auditFocus, setFocus]   = useState('Full Audit');
  const [activeTab, setActiveTab] = useState<'findings' | 'scores' | 'a11y' | 'strengths'>('findings');
  const [filterSev, setFilterSev] = useState<string>('all');
  const [quickWinsOnly, setQuickWins] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [staleKey, setStaleKey]    = useState(0);
  const stale = useStaleArtifact(projectId, 'ux_review', staleKey);

  const isRunning = status === 'starting' || status === 'streaming';

  // Bump history chart + stale key each time an audit completes
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== 'complete' && status === 'complete') {
      setHistoryKey((k) => k + 1);
      setStaleKey((k) => k + 1);
    }
    prevStatus.current = status;
  }, [status]);

  const handleRun = useCallback(() => {
    run({ projectId, auditFocus });
  }, [projectId, auditFocus, run]);

  // Use partial data during stream, result when done
  const display: DeepPartial<UXReviewOutput> | UXReviewOutput | null = result ?? partial;

  const findings: UXFinding[] = ((display?.findings ?? []) as UXFinding[]).filter((f): f is UXFinding => !!f?.heuristic_name);
  const a11yFlags: A11yFlag[] = ((display?.accessibility_flags ?? []) as A11yFlag[]).filter((f): f is A11yFlag => !!f?.type);
  const scoreBreakdown = display?.score_breakdown as Record<string, number> | undefined;
  const strengths = (display?.strengths ?? []) as string[];

  const filteredFindings = findings.filter((f) => {
    if (filterSev !== 'all' && f.severity !== filterSev) return false;
    if (quickWinsOnly && f.effort !== 'quick-win') return false;
    return true;
  });

  const overallScore = display?.overall_score ?? null;
  const grade        = display?.grade ?? null;

  function scoreColor(score: number) {
    if (score >= 8) return 'var(--success)';
    if (score >= 5) return 'var(--warning)';
    return 'var(--error)';
  }

  function overallGradeColor(g: string) {
    if (g?.startsWith('A')) return 'var(--success)';
    if (g?.startsWith('B')) return 'var(--info)';
    if (g?.startsWith('C')) return 'var(--warning)';
    return 'var(--error)';
  }

  return (
    <div className="tf-fade-in">
      {/* Page header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.UX size={20} style={{ color: 'var(--accent-2)' }} />
            UX / UI Auditor
          </div>
          <div className="tf-page-sub">
            Nielsen's 10 Heuristics · WCAG 2.1 AA · Pre-AI canvas metrics
          </div>
        </div>
        <div className="tf-row">
          {isRunning && (
            <button className="tf-btn tf-btn-ghost" onClick={cancel}>
              <I.X size={14} /> Cancel
            </button>
          )}
          <button
            className="tf-btn tf-btn-primary"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning
              ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Auditing…</>
              : <><I.Sparkle size={14} /> Run Audit</>
            }
          </button>
        </div>
      </div>

      {/* Config */}
      <div className="tf-card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="tf-label" style={{ marginBottom: 6 }}>Audit focus</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AUDIT_FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`tf-chip${auditFocus === opt ? ' active' : ''}`}
                  onClick={() => setFocus(opt)}
                  disabled={isRunning}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {provider && model && (
            <div style={{ alignSelf: 'flex-end' }}>
              <span className="tf-provider-badge">
                <span className="tf-dot" />
                {provider} · {model.split('/').pop()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stale prompt nudge */}
      {stale?.stale && stale.exists && !isRunning && (
        <div
          className="tf-card tf-fade-in"
          style={{ marginBottom: 12, padding: 12, borderColor: 'var(--accent-strong)', background: 'var(--accent-glow)', display: 'flex', gap: 10, alignItems: 'center' }}
        >
          <I.Sparkle size={14} style={{ color: 'var(--accent-2)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, flex: 1 }}>
            This audit was generated with an older prompt version. Re-run for improved results.
          </span>
          <button className="tf-btn tf-btn-sm" onClick={handleRun}>Re-run</button>
        </div>
      )}

      {/* Score history chart — refreshKey bumps only when an audit completes */}
      <ScoreHistoryChart projectId={projectId} refreshKey={historyKey} />

      {/* Error banner */}
      {status === 'error' && error && (
        <div className="tf-card tf-fade-in" style={{ marginBottom: 16, padding: 14, borderColor: 'rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <I.X size={16} style={{ color: '#f87171', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-1)' }}>{error}</div>
            <button className="tf-btn tf-btn-sm" onClick={handleRun}>Retry</button>
          </div>
        </div>
      )}

      {/* Score hero — shown while streaming and after complete */}
      {display && (
        <>
          {/* Score row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {/* Overall score */}
            <div className="tf-card" style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Overall Score</div>
              {overallScore !== null ? (
                <>
                  <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: scoreColor(overallScore / 10) }}>{overallScore}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 4 }}>/ 100</div>
                </>
              ) : (
                <div className="tf-skeleton" style={{ width: 80, height: 56 }} />
              )}
            </div>

            {/* Grade */}
            <div className="tf-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Grade</div>
              {grade ? (
                <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: overallGradeColor(grade) }}>{grade}</div>
              ) : (
                <div className="tf-skeleton" style={{ width: 50, height: 48 }} />
              )}
            </div>

            {/* Stats chips */}
            <div className="tf-card" style={{ padding: '16px 20px', flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(['critical', 'major', 'minor'] as const).map((sev) => {
                  const count = findings.filter((f) => f.severity === sev).length;
                  return (
                    <span key={sev} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: SEVERITY_COLORS[sev], background: `${SEVERITY_COLORS[sev]}18`, border: `1px solid ${SEVERITY_COLORS[sev]}30`, borderRadius: 6, padding: '4px 8px', fontWeight: 600 }}>
                      {count} {sev}
                    </span>
                  );
                })}
                {a11yFlags.length > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--info)', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 6, padding: '4px 8px', fontWeight: 600 }}>
                    {a11yFlags.length} a11y
                  </span>
                )}
                {strengths.length > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--success)', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, padding: '4px 8px', fontWeight: 600 }}>
                    {strengths.length} strengths
                  </span>
                )}
              </div>
              {isRunning && (
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  <span className="tf-dot" style={{ display: 'inline-block', marginRight: 6 }} />
                  Streaming audit…
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="tf-tabs" style={{ marginBottom: 12 }}>
            {(['findings', 'scores', 'a11y', 'strengths'] as const).map((tab) => (
              <button
                key={tab}
                className={`tf-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ textTransform: 'capitalize' }}
              >
                {tab === 'a11y' ? 'Accessibility' : tab}
                {tab === 'findings' && findings.length > 0 && <span style={{ marginLeft: 4, opacity: 0.6 }}>{findings.length}</span>}
                {tab === 'a11y'     && a11yFlags.length > 0 && <span style={{ marginLeft: 4, opacity: 0.6 }}>{a11yFlags.length}</span>}
              </button>
            ))}
          </div>

          {/* ── FINDINGS TAB ── */}
          {activeTab === 'findings' && (
            <>
              {/* Filter row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {['all', 'critical', 'major', 'minor', 'enhancement'].map((sev) => (
                  <button
                    key={sev}
                    className={`tf-chip${filterSev === sev ? ' active' : ''}`}
                    onClick={() => setFilterSev(sev)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {sev}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-1)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={quickWinsOnly} onChange={(e) => setQuickWins(e.target.checked)} />
                    Quick wins only
                  </label>
                </div>
              </div>

              <div className="tf-col" style={{ gap: 8 }}>
                {filteredFindings.length === 0 && !isRunning && (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-1)', fontSize: 13 }}>
                    {findings.length === 0 ? 'No findings yet — run the audit to start.' : 'No findings match the current filter.'}
                  </div>
                )}
                {filteredFindings.map((finding, i) => (
                  <FindingCard key={`${finding.heuristic_number}-${i}`} finding={finding} />
                ))}
                {isRunning && findings.length === 0 && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="tf-card" style={{ padding: 14, gap: 8, display: 'flex', flexDirection: 'column' }}>
                        <div className="tf-skeleton" style={{ height: 14, width: '40%' }} />
                        <div className="tf-skeleton" style={{ height: 12, width: '80%' }} />
                        <div className="tf-skeleton" style={{ height: 12, width: '65%' }} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}

          {/* ── SCORES TAB ── */}
          {activeTab === 'scores' && (
            <div className="tf-card" style={{ padding: 16 }}>
              {scoreBreakdown && Object.keys(scoreBreakdown).length > 0 ? (
                <div className="tf-col" style={{ gap: 10 }}>
                  {Object.entries(scoreBreakdown)
                    .sort(([, a], [, b]) => (a as number) - (b as number))
                    .map(([name, score]) => (
                      <ScoreBar key={name} name={name} score={score as number} />
                    ))}
                </div>
              ) : isRunning ? (
                <div className="tf-col" style={{ gap: 10 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="tf-skeleton" style={{ height: 12, width: 180, flexShrink: 0 }} />
                      <div className="tf-skeleton" style={{ height: 8, flex: 1 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-1)' }}>Run the audit to see heuristic scores.</p>
              )}
            </div>
          )}

          {/* ── A11Y TAB ── */}
          {activeTab === 'a11y' && (
            <div className="tf-col" style={{ gap: 8 }}>
              {a11yFlags.length === 0 && !isRunning && (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-1)', fontSize: 13 }}>
                  {status === 'complete' ? '✓ No accessibility issues found.' : 'Run the audit to check accessibility.'}
                </div>
              )}
              {a11yFlags.map((flag, i) => (
                <A11yFlagCard key={i} flag={flag} />
              ))}
            </div>
          )}

          {/* ── STRENGTHS TAB ── */}
          {activeTab === 'strengths' && (
            <div className="tf-card" style={{ padding: 16 }}>
              {strengths.length === 0 && !isRunning && (
                <p style={{ fontSize: 13, color: 'var(--text-1)' }}>
                  {status === 'complete' ? 'No strengths identified.' : 'Run the audit first.'}
                </p>
              )}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {strengths.map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}>
                    <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Empty state — never run */}
      {status === 'idle' && !display && (
        <EmptyState onRun={handleRun} />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: UXFinding }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="tf-card"
      style={{ padding: 14, cursor: 'pointer', borderColor: open ? 'var(--border-strong)' : undefined }}
      onClick={() => setOpen((v) => !v)}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Severity dot */}
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS[finding.severity] ?? 'var(--text-2)', flexShrink: 0, marginTop: 5 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{finding.heuristic_name}</span>
            <span style={{ fontSize: 11, color: SEVERITY_COLORS[finding.severity], background: `${SEVERITY_COLORS[finding.severity]}18`, border: `1px solid ${SEVERITY_COLORS[finding.severity]}30`, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
              {finding.severity}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-2)', background: 'var(--bg-2)', borderRadius: 4, padding: '2px 6px' }}>
              {EFFORT_LABELS[finding.effort] ?? finding.effort}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 'auto' }}>
              {finding.screen}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 4 }}>{finding.description}</div>

          {open && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--accent-2)' }}>Suggestion</div>
              <div style={{ color: 'var(--text-1)' }}>{finding.suggestion}</div>
              {finding.element && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
                  Element: <code style={{ background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 4 }}>{finding.element}</code>
                </div>
              )}
            </div>
          )}
        </div>

        <span style={{ fontSize: 14, color: 'var(--text-2)', flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
      </div>
    </div>
  );
}

function ScoreBar({ name, score }: { name: string; score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  const color =
    score >= 8 ? 'var(--success)' :
    score >= 5 ? 'var(--warning)' :
    'var(--error)';

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ width: 200, fontSize: 12, color: 'var(--text-1)', flexShrink: 0 }}>{name}</div>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ width: 28, fontSize: 12, fontWeight: 600, color, textAlign: 'right', flexShrink: 0 }}>{score}</div>
    </div>
  );
}

function A11yFlagCard({ flag }: { flag: A11yFlag }) {
  const typeColors: Record<string, string> = {
    contrast:     '#f87171',
    touch_target: '#fbbf24',
    alt_text:     '#60a5fa',
    focus_order:  '#fbbf24',
    keyboard_nav: '#fbbf24',
    aria_label:   '#60a5fa',
  };
  const color = typeColors[flag.type] ?? 'var(--text-1)';
  return (
    <div className="tf-card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 4, padding: '2px 6px', fontWeight: 600, textTransform: 'uppercase' }}>
              {flag.type.replace('_', ' ')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>{flag.criterion}</span>
            <span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 'auto' }}>{flag.screen}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 4 }}>{flag.detail}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            Element: <code style={{ background: 'var(--bg-2)', padding: '1px 5px', borderRadius: 4 }}>{flag.element}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Score History Chart ────────────────────────────────────────────────────────

interface HistoryPoint {
  id:         string;
  created_at: string;
  score:      number;
  provider:   string;
  model:      string;
}

function ScoreHistoryChart({ projectId, refreshKey }: { projectId: string; refreshKey: number }) {
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/artifacts/ux-history/${projectId}`)
      .then((r) => r.json())
      .then((d: { points?: HistoryPoint[] }) => {
        if (!cancelled) setPoints(d.points ?? []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, refreshKey]);

  if (loading) return null;
  if (points.length === 0) return null;
  if (points.length < 2) {
    return (
      <div className="tf-card" style={{ marginBottom: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-1)' }}>
          Score history will appear after your second audit. Current score: <strong>{points[0].score}</strong>
        </span>
      </div>
    );
  }

  const chartData = points.map((p, i) => ({
    label: new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (points.filter((x) => x.created_at.slice(0, 10) === p.created_at.slice(0, 10)).length > 1 ? ` #${i + 1}` : ''),
    score: p.score,
    provider: p.provider,
  }));

  const latest  = points[points.length - 1].score;
  const prev    = points[points.length - 2].score;
  const delta   = latest - prev;
  const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
  const deltaColor = delta >= 0 ? 'var(--success)' : 'var(--error)';

  return (
    <div className="tf-card" style={{ marginBottom: 16, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Score History</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{points.length} audits · Last score: <strong>{latest}</strong></div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: deltaColor }}>{deltaStr} from previous</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'var(--text-1)', fontWeight: 600 }}
            formatter={(v) => [`${v} / 100`, 'Score']}
          />
          <ReferenceLine y={70} stroke="var(--warning)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6 }}>Dashed line = 70 (target threshold)</div>
    </div>
  );
}

function EmptyState({ onRun }: { onRun: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 20px', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-2)' }}>
        <I.UX size={24} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16 }}>No audit yet</div>
      <div style={{ color: 'var(--text-1)', fontSize: 13, maxWidth: 360 }}>
        Select an audit focus above, then click <strong>Run Audit</strong> to analyse your screens against Nielsen's 10 Heuristics and WCAG 2.1 AA.
      </div>
      <button className="tf-btn tf-btn-primary" style={{ marginTop: 8 }} onClick={onRun}>
        <I.Sparkle size={14} /> Run Audit
      </button>
    </div>
  );
}
