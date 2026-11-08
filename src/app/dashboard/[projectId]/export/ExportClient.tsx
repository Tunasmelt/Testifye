'use client';

import { useState } from 'react';
import { useGenerationStore } from '@/lib/stores/generation.store';
import { exportSuite, formatSuite, type ExportFormat } from '@/lib/services/export.service';
import * as I from '@/components/ui/Icons';

const FORMATS: {
  id:    ExportFormat;
  label: string;
  desc:  string;
  Icon:  React.ComponentType<{ size?: number }>;
  color: string;
}[] = [
  { id: 'markdown', label: 'Markdown',          desc: 'Universal, human-readable',  Icon: I.Copy,      color: 'var(--accent-2)' },
  { id: 'csv',      label: 'CSV',               desc: 'Jira import / spreadsheets', Icon: I.Data,      color: 'var(--info, #60a5fa)' },
  { id: 'json',     label: 'JSON',              desc: 'Automation fixtures',        Icon: I.Layers,    color: 'var(--success)' },
  { id: 'gherkin',  label: 'Gherkin (.feature)', desc: 'Cucumber / BDD ready',      Icon: I.TestCases, color: 'var(--warning)' },
  { id: 'jira',     label: 'Jira Markup',        desc: 'One-click paste',            Icon: I.Bug,       color: '#f87171' },
  { id: 'linear',   label: 'Linear',             desc: 'Linear API formatting',      Icon: I.Link,      color: '#a78bfa' },
];

const INCLUDE_ITEMS = [
  { key: 'test_cases',      label: 'Test cases',      defaultOn: true },
  { key: 'ux_issues',       label: 'UX issues',       defaultOn: true },
  { key: 'bug_reports',     label: 'Bug reports',     defaultOn: true },
  { key: 'prd_findings',    label: 'PRD findings',    defaultOn: false },
  { key: 'persona_friction', label: 'Persona friction', defaultOn: false },
  { key: 'test_data',       label: 'Test data sets',  defaultOn: false },
];

interface Props { projectId: string }

export function ExportClient({ projectId: _projectId }: Props) {
  const { cases, status, coverageSummary } = useGenerationStore();
  const [included, setIncluded] = useState<Set<string>>(
    new Set(INCLUDE_ITEMS.filter((i) => i.defaultOn).map((i) => i.key))
  );
  const [copied, setCopied] = useState<ExportFormat | null>(null);

  const hasCases  = cases.length > 0;
  const mockCount = { test_cases: cases.length, ux_issues: 0, bug_reports: 0, prd_findings: 0, persona_friction: 0, test_data: 0 };

  function buildSuite() {
    return {
      test_cases:         cases,
      coverage_summary:   coverageSummary ?? '',
      total_count:        cases.length,
      priority_breakdown: {
        critical: cases.filter((c) => c.priority === 'critical').length,
        high:     cases.filter((c) => c.priority === 'high').length,
        medium:   cases.filter((c) => c.priority === 'medium').length,
        low:      cases.filter((c) => c.priority === 'low').length,
      },
    };
  }

  function toggleInclude(key: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleDownload(fmt: ExportFormat) {
    if (!hasCases) return;
    exportSuite(buildSuite(), fmt, 'project');
  }

  async function handleCopy(fmt: ExportFormat) {
    if (!hasCases) return;
    const text = formatSuite(buildSuite(), fmt);
    await navigator.clipboard.writeText(text);
    setCopied(fmt);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.Export size={20} style={{ color: 'var(--accent-2)' }} />
            Export Engine
          </div>
          <div className="tf-page-sub">
            Pick a format. We'll bundle your latest artifacts into a downloadable file.
          </div>
        </div>
      </div>

      {!hasCases && status !== 'complete' && (
        <div
          className="tf-card"
          style={{ marginBottom: 20, padding: 20, borderColor: 'var(--accent-strong)', background: 'var(--accent-glow)' }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <I.Alert size={16} style={{ color: 'var(--accent-2)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-1)' }}>
              No artifacts yet — generate test cases first to enable export.
            </span>
          </div>
        </div>
      )}

      {/* Format cards */}
      <div className="tf-grid-3" style={{ marginBottom: 20 }}>
        {FORMATS.map((f) => (
          <div key={f.id} className="tf-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color }}>
                <f.Icon size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-1)' }}>{f.desc}</div>
              </div>
            </div>
            <div className="tf-row" style={{ gap: 6 }}>
              <button
                className="tf-btn tf-btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={!hasCases}
                onClick={() => handleDownload(f.id)}
              >
                <I.Download size={12} /> Download
              </button>
              <button
                className="tf-btn tf-btn-icon tf-btn-sm tf-btn-ghost"
                disabled={!hasCases}
                onClick={() => handleCopy(f.id)}
                title="Copy to clipboard"
              >
                {copied === f.id ? <I.Check size={13} /> : <I.Copy size={13} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* What's included */}
      <div className="tf-card">
        <div className="tf-card-head">
          <div className="tf-card-title"><I.Layers size={14} /> What&apos;s included</div>
          <span className="tf-card-sub">Toggle which artifacts to bundle</span>
        </div>
        <div className="tf-grid-3">
          {INCLUDE_ITEMS.map((item) => {
            const on = included.has(item.key);
            const count = mockCount[item.key as keyof typeof mockCount] ?? 0;
            return (
              <button
                key={item.key}
                onClick={() => toggleInclude(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: 12, background: 'var(--bg-1)',
                  borderRadius: 8, border: `1px solid ${on ? 'var(--accent-strong)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.12s',
                  color: 'var(--text-0)',
                }}
              >
                {/* Toggle */}
                <div style={{ width: 32, height: 18, borderRadius: 9, background: on ? 'var(--accent)' : 'var(--bg-3)', position: 'relative', flexShrink: 0, transition: 'background 0.15s' }}>
                  <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#fff', top: 2, left: on ? 16 : 2, transition: 'left 0.15s' }} />
                </div>
                <div style={{ flex: 1, fontSize: 12 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{count}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
