'use client';

/**
 * Launch Readiness Score — Phase 4 Task 4.6
 * Composite score from: test coverage, UX score, gaps, open bugs.
 */

import { useState, useCallback } from 'react';
import type { LaunchReadinessOutput, BlockingIssue } from '@/lib/schemas/launch-readiness';
import * as I from '@/components/ui/Icons';

// ── Colors / helpers ──────────────────────────────────────────────────────────

function scoreColor(score: number) {
  return score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)';
}

function readinessLabelColor(label: string) {
  switch (label) {
    case 'Ready':           return 'var(--success)';
    case 'Needs Attention': return 'var(--warning)';
    case 'Not Ready':       return 'var(--error)';
    case 'Critical Issues': return '#ff4444';
    default:                return 'var(--text-2)';
  }
}

const BLOCKING_TYPE_LABELS: Record<string, string> = {
  critical_bug:        'Critical Bug',
  ux_issue:            'UX Issue',
  missing_requirement: 'Missing Requirement',
  a11y_blocker:        'Accessibility Blocker',
};

const SEVERITY_HEX: Record<string, string> = {
  critical: '#f87171',
  high:     '#fbbf24',
  medium:   '#60a5fa',
};

interface Props { projectId: string }

type Status = 'idle' | 'loading' | 'done' | 'error';

function DimensionBar({
  label,
  score,
  dimLabel,
  detail,
}: {
  label:    string;
  score:    number;
  dimLabel: string;
  detail:   string;
}) {
  const color = scoreColor(score);
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="tf-row" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1, marginLeft: 8 }}>{dimLabel}</span>
        <span style={{ fontWeight: 700, color, fontSize: 14 }}>{score}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-1)', overflow: 'hidden', marginBottom: 4 }}>
        <div
          style={{
            height: '100%',
            width:  `${score}%`,
            borderRadius: 4,
            background: color,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{detail}</div>
    </div>
  );
}

function BlockingIssueRow({ issue }: { issue: BlockingIssue }) {
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span
        className="tf-badge"
        style={{
          background:  SEVERITY_HEX[issue.severity] + '22',
          color:       SEVERITY_HEX[issue.severity],
          borderColor: SEVERITY_HEX[issue.severity] + '44',
          flexShrink: 0,
          fontSize: 10,
        }}
      >
        {BLOCKING_TYPE_LABELS[issue.type] ?? issue.type}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>{issue.description}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{issue.source}</div>
      </div>
    </div>
  );
}

export function LaunchReadinessClient({ projectId }: Props) {
  const [status, setStatus]   = useState<Status>('idle');
  const [result, setResult]   = useState<LaunchReadinessOutput | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const compute = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch('/api/generate/launch-readiness', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId }),
        signal:  controller.signal,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as LaunchReadinessOutput;
      setResult(data);
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
  }, [projectId]);

  const computedAt = result?.computed_at
    ? new Date(result.computed_at).toLocaleString()
    : null;

  return (
    <div className="tf-fade-in">
      {/* Header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.Zap size={20} style={{ color: 'var(--accent-2)' }} />
            Launch Readiness Score
          </div>
          <div className="tf-page-sub">
            Composite readiness score from your test coverage, UX audit, requirement gaps, and bug reports.
          </div>
        </div>
        {computedAt && (
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
            Computed {computedAt}
          </span>
        )}
      </div>

      {/* Compute button */}
      <div className="tf-card" style={{ marginBottom: 20, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 480 }}>
          Aggregates data from your latest test suite, UX audit, gap analysis, and bug reports. No AI call required — instant computation.
        </div>
        <button
          className="tf-btn tf-btn-primary"
          disabled={status === 'loading'}
          onClick={compute}
          style={{ flexShrink: 0 }}
        >
          {status === 'loading'
            ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Computing…</>
            : <><I.Zap size={14} /> {result ? 'Recompute' : 'Compute Score'}</>
          }
        </button>
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
          {/* Hero score */}
          <div className="tf-card" style={{ padding: 24, marginBottom: 20, textAlign: 'center', background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))' }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: scoreColor(result.overall_score), lineHeight: 1, marginBottom: 8 }}>
              {result.overall_score}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>out of 100</div>
            <div
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap: 8,
                padding:        '6px 16px',
                borderRadius:   20,
                fontSize:       14,
                fontWeight:     600,
                color:          readinessLabelColor(result.readiness_label),
                background:     readinessLabelColor(result.readiness_label) + '18',
                border:         `1px solid ${readinessLabelColor(result.readiness_label)}44`,
              }}
            >
              {result.readiness_label === 'Ready' && <I.CheckCircle size={14} />}
              {result.readiness_label === 'Needs Attention' && <I.Alert size={14} />}
              {(result.readiness_label === 'Not Ready' || result.readiness_label === 'Critical Issues') && <I.AlertCircle size={14} />}
              {result.readiness_label}
            </div>
          </div>

          {/* Dimensions */}
          <div className="tf-card" style={{ padding: '20px 20px 4px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 16, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Score Breakdown
            </div>
            <DimensionBar
              label="Test Coverage"
              score={result.dimensions.test_coverage.score}
              dimLabel={result.dimensions.test_coverage.label}
              detail={result.dimensions.test_coverage.detail}
            />
            <DimensionBar
              label="UX Audit"
              score={result.dimensions.ux_score.score}
              dimLabel={result.dimensions.ux_score.label}
              detail={result.dimensions.ux_score.detail}
            />
            <DimensionBar
              label="Requirement Gaps"
              score={result.dimensions.gap_count.score}
              dimLabel={result.dimensions.gap_count.label}
              detail={result.dimensions.gap_count.detail}
            />
            <DimensionBar
              label="Bug Severity"
              score={result.dimensions.bug_severity.score}
              dimLabel={result.dimensions.bug_severity.label}
              detail={result.dimensions.bug_severity.detail}
            />
          </div>

          {/* Blocking issues */}
          {result.blocking_issues.length > 0 && (
            <div className="tf-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20, borderColor: 'var(--error)' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <I.AlertCircle size={16} style={{ color: 'var(--error)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)' }}>
                  Blocking Issues ({result.blocking_issues.length})
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 4 }}>
                  — resolve before launch
                </span>
              </div>
              {result.blocking_issues.map((issue, i) => (
                <BlockingIssueRow key={i} issue={issue} />
              ))}
            </div>
          )}

          {result.blocking_issues.length === 0 && result.overall_score >= 80 && (
            <div
              className="tf-card tf-fade-in"
              style={{ padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', borderColor: 'var(--success)', background: 'rgba(52,211,153,0.05)' }}
            >
              <I.CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: 'var(--success)', fontWeight: 500 }}>
                No blocking issues found. You're clear for launch! 🚀
              </span>
            </div>
          )}
        </>
      )}

      {/* Idle */}
      {status === 'idle' && (
        <div className="tf-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          <I.Zap size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Click "Compute Score" to generate your launch readiness report.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Requires at least one generated test suite, UX audit, or gap analysis.</p>
        </div>
      )}
    </div>
  );
}
