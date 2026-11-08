'use client';
/**
 * Bug Report Formatter — Task 2.5
 * Plain-language description → structured bug report via fast_format model.
 */

import { useState, useCallback } from 'react';
import type { BugReport } from '@/lib/schemas/bug-report';
import * as I from '@/components/ui/Icons';

const SEVERITY_COLORS: Record<string, string> = {
  blocker:  '#ff4444',
  critical: '#f87171',
  major:    '#fbbf24',
  minor:    '#60a5fa',
  trivial:  '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#ff4444', P1: '#f87171', P2: '#fbbf24', P3: '#60a5fa', P4: '#94a3b8',
};

const FREQ_LABELS: Record<string, string> = {
  always: '100% repro', often: '~75% repro', sometimes: '~50% repro',
  rarely: '~25% repro', once: 'Seen once',
};

interface Props { projectId: string }

export function BugReportsClient({ projectId }: Props) {
  const [description, setDescription] = useState('');
  const [platform,    setPlatform]     = useState('');
  const [os,          setOs]           = useState('');
  const [browser,     setBrowser]      = useState('');
  const [appVersion,  setAppVersion]   = useState('');
  const [component,   setComponent]    = useState('');

  const [reports,  setReports]  = useState<BugReport[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [model,    setModel]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<'jira' | 'linear' | 'plain'>('plain');

  const generate = useCallback(async () => {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate/bug-report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          description,
          bugIndex: reports.length + 1,
          ...(platform   ? { platform }   : {}),
          ...(os         ? { os }         : {}),
          ...(browser    ? { browser }    : {}),
          ...(appVersion ? { appVersion } : {}),
          ...(component  ? { component }  : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { report: BugReport; provider: string; model: string };
      setReports((prev) => [data.report, ...prev]);
      setProvider(data.provider);
      setModel(data.model);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [description, loading, projectId, reports.length, platform, os, browser, appVersion, component]);

  return (
    <div className="tf-fade-in">
      {/* Header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.Bug size={20} style={{ color: 'var(--accent-2)' }} />
            Bug Report Formatter
          </div>
          <div className="tf-page-sub">
            Describe a bug in plain language — AI structures it into a professional report.
          </div>
        </div>
        {provider && model && (
          <span className="tf-provider-badge"><span className="tf-dot" />{provider} · {model.split('/').pop()}</span>
        )}
      </div>

      {/* Input card */}
      <div className="tf-card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Description */}
          <div>
            <label className="tf-label" style={{ marginBottom: 6, display: 'block' }}>
              Bug description <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <textarea
              className="tf-input"
              rows={4}
              placeholder="e.g. When I tap the checkout button on iOS with an expired card, the app shows a blank screen instead of an error message and the order still shows as pending in my account..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            />
          </div>

          {/* Context fields (collapsible) */}
          <details>
            <summary style={{ fontSize: 12, color: 'var(--text-1)', cursor: 'pointer', userSelect: 'none' }}>
              + Device / environment context (optional)
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginTop: 10 }}>
              {[
                { label: 'Platform',    value: platform,   set: setPlatform,   ph: 'iOS / Android / Web' },
                { label: 'OS',          value: os,         set: setOs,         ph: 'iOS 17.4 / Android 14' },
                { label: 'Browser',     value: browser,    set: setBrowser,    ph: 'Safari 17 / Chrome 122' },
                { label: 'App version', value: appVersion, set: setAppVersion, ph: '2.4.1' },
                { label: 'Component',   value: component,  set: setComponent,  ph: 'Checkout / Auth' },
              ].map(({ label, value, set, ph }) => (
                <div key={label}>
                  <label className="tf-label" style={{ marginBottom: 4, display: 'block' }}>{label}</label>
                  <input
                    className="tf-input"
                    style={{ height: 32, fontSize: 12 }}
                    placeholder={ph}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </details>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="tf-btn tf-btn-primary"
              onClick={generate}
              disabled={loading || !description.trim()}
            >
              {loading
                ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Formatting…</>
                : <><I.Sparkle size={14} /> Format Bug Report</>
              }
            </button>
            {error && (
              <span style={{ fontSize: 12, color: 'var(--error)' }}>{error}</span>
            )}
          </div>
        </div>
      </div>

      {/* Report list */}
      {reports.length === 0 && !loading && (
        <EmptyState />
      )}

      <div className="tf-col" style={{ gap: 14 }}>
        {reports.map((report) => (
          <BugReportCard key={report.bug_id} report={report} tab={tab} onTabChange={setTab} />
        ))}
      </div>
    </div>
  );
}

// ── BugReportCard ─────────────────────────────────────────────────────────────

function BugReportCard({
  report, tab, onTabChange,
}: {
  report: BugReport;
  tab: 'jira' | 'linear' | 'plain';
  onTabChange: (t: 'jira' | 'linear' | 'plain') => void;
}) {
  const [copied, setCopied] = useState(false);

  function getExport() {
    if (tab === 'jira')   return toJira(report);
    if (tab === 'linear') return toLinear(report);
    return toPlainText(report);
  }

  async function copy() {
    await navigator.clipboard.writeText(getExport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="tf-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-2)' }}>{report.bug_id}</span>
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{report.title}</span>

        {/* Severity */}
        <span style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLORS[report.severity] ?? 'var(--text-1)', background: `${SEVERITY_COLORS[report.severity] ?? 'var(--text-1)'}18`, border: `1px solid ${SEVERITY_COLORS[report.severity] ?? 'var(--border)'}30`, borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase' }}>
          {report.severity}
        </span>
        {/* Priority */}
        <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[report.priority] ?? 'var(--text-1)', background: `${PRIORITY_COLORS[report.priority] ?? 'var(--text-1)'}18`, border: `1px solid ${PRIORITY_COLORS[report.priority] ?? 'var(--border)'}30`, borderRadius: 5, padding: '2px 7px' }}>
          {report.priority}
        </span>
        {/* Frequency */}
        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{FREQ_LABELS[report.frequency] ?? report.frequency}</span>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Env */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[report.environment.platform, report.environment.os, report.environment.browser, report.environment.app_version]
            .filter(Boolean)
            .map((v, i) => (
              <span key={i} style={{ fontSize: 11, color: 'var(--text-1)', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>{v}</span>
            ))}
          {report.component && (
            <span style={{ fontSize: 11, color: 'var(--accent-2)', background: 'var(--accent-glow)', border: '1px solid var(--accent-strong)', borderRadius: 5, padding: '2px 7px' }}>{report.component}</span>
          )}
        </div>

        {/* Steps */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Steps to reproduce</div>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {report.steps_to_reproduce.map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--text-0)' }}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Expected / Actual */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 10, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Expected</div>
            <div style={{ fontSize: 12, color: 'var(--text-0)' }}>{report.expected_result}</div>
          </div>
          <div style={{ padding: 10, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Actual</div>
            <div style={{ fontSize: 12, color: 'var(--text-0)' }}>{report.actual_result}</div>
          </div>
        </div>

        {/* Hypothesis + Fix */}
        <div style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-2)' }}>💡 </span>
            {report.root_cause_hypothesis}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-1)' }}>
            <span style={{ fontWeight: 600 }}>Fix: </span>{report.suggested_fix}
          </div>
        </div>

        {/* Labels */}
        {report.labels.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {report.labels.map((lbl) => (
              <span key={lbl} style={{ fontSize: 11, color: 'var(--text-1)', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>
                #{lbl}
              </span>
            ))}
          </div>
        )}

        {/* Export tabs */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="tf-tabs" style={{ flex: 1 }}>
            {(['plain', 'jira', 'linear'] as const).map((t) => (
              <button key={t} className={`tf-tab${tab === t ? ' active' : ''}`} onClick={() => onTabChange(t)} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                {t === 'plain' ? 'Plain Text' : t === 'jira' ? 'Jira' : 'Linear'}
              </button>
            ))}
          </div>
          <button className="tf-btn tf-btn-sm tf-btn-ghost" onClick={copy}>
            {copied ? <><I.Check size={12} /> Copied!</> : <><I.Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Export formatters ─────────────────────────────────────────────────────────

function toPlainText(r: BugReport): string {
  return [
    `${r.bug_id}: ${r.title}`,
    `Severity: ${r.severity} | Priority: ${r.priority} | Frequency: ${r.frequency}`,
    `Component: ${r.component}`,
    `Environment: ${r.environment.platform} / ${r.environment.os} / ${r.environment.browser} / v${r.environment.app_version}`,
    '',
    'Steps to Reproduce:',
    ...r.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`),
    '',
    `Expected: ${r.expected_result}`,
    `Actual: ${r.actual_result}`,
    '',
    `Root Cause: ${r.root_cause_hypothesis}`,
    `Suggested Fix: ${r.suggested_fix}`,
    '',
    `Labels: ${r.labels.map((l) => '#' + l).join(', ')}`,
  ].join('\n');
}

function toJira(r: BugReport): string {
  return [
    `h2. ${r.bug_id}: ${r.title}`,
    `*Severity:* ${r.severity} | *Priority:* ${r.priority} | *Component:* ${r.component} | *Frequency:* ${r.frequency}`,
    `*Environment:* ${r.environment.platform} / ${r.environment.os} / ${r.environment.browser} / v${r.environment.app_version}`,
    '',
    'h3. Steps to Reproduce',
    '{noformat}',
    ...r.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`),
    '{noformat}',
    '',
    `*Expected:* ${r.expected_result}`,
    `*Actual:* ${r.actual_result}`,
    '',
    `*Root Cause Hypothesis:* ${r.root_cause_hypothesis}`,
    `*Suggested Fix:* ${r.suggested_fix}`,
    '',
    `*Labels:* ${r.labels.join(', ')}`,
  ].join('\n');
}

function toLinear(r: BugReport): string {
  return [
    `## ${r.bug_id}: ${r.title}`,
    '',
    `**Severity:** ${r.severity} | **Priority:** ${r.priority} | **Component:** ${r.component}`,
    `**Frequency:** ${r.frequency} | **Environment:** ${r.environment.platform} / ${r.environment.os} / ${r.environment.browser} / v${r.environment.app_version}`,
    '',
    '### Steps to Reproduce',
    '',
    ...r.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`),
    '',
    `**Expected:** ${r.expected_result}`,
    '',
    `**Actual:** ${r.actual_result}`,
    '',
    `**Root Cause:** ${r.root_cause_hypothesis}`,
    '',
    `**Suggested Fix:** ${r.suggested_fix}`,
    '',
    `**Labels:** ${r.labels.map((l) => '`' + l + '`').join(' ')}`,
  ].join('\n');
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 20px', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-2)' }}>
        <I.Bug size={24} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16 }}>No bug reports yet</div>
      <div style={{ color: 'var(--text-1)', fontSize: 13, maxWidth: 360 }}>
        Describe a bug in plain language above and click <strong>Format Bug Report</strong>. Copy as Jira, Linear, or plain text.
      </div>
    </div>
  );
}
