'use client';

import { useState, useEffect, useRef } from 'react';
import { useGenerationStore } from '@/lib/stores/generation.store';
import { useStreamTestCases } from '@/lib/hooks/useStreamTestCases';
import { useTokenEstimate } from '@/lib/hooks/useTokenEstimate';
import { useStaleArtifact } from '@/lib/hooks/useStaleArtifact';
import { TestCaseList } from '@/components/test-cases/TestCaseList';
import { CoverageGapAnalysis } from '@/components/test-cases/CoverageGapAnalysis';
import { exportSuite, type ExportFormat } from '@/lib/services/export.service';
import * as I from '@/components/ui/Icons';

const TESTER_ROLES = [
  { key: 'manual_tester',       label: 'Manual' },
  { key: 'automation_engineer', label: 'Automation' },
  { key: 'product_manager',     label: 'PM' },
  { key: 'qa_lead',             label: 'QA Lead' },
] as const;

const FOCUS_OPTIONS = [
  'Authentication', 'Payments', 'Forms', 'Search',
  'Errors', 'Accessibility', 'Performance', 'Navigation',
];

interface Props {
  projectId: string;
}

export function TestCasesClient({ projectId }: Props) {
  const { status, cases, streaming, meta, error, partial, resumeFrom, complete, coverageSummary } = useGenerationStore();
  const { generate, cancel } = useStreamTestCases();
  const { estimate: tokenEstimate, hasScreens } = useTokenEstimate(projectId, 'test_suite');
  const [staleKey, setStaleKey]     = useState(0);
  const stale = useStaleArtifact(projectId, 'test_suite', staleKey);

  const [role,        setRole]      = useState<string>('manual_tester');
  const [focusAreas,  setFocus]    = useState<string[]>([]);
  const [exportOpen,  setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const isRunning = status === 'starting' || status === 'streaming';
  const canExport = cases.length > 0 && !isRunning;

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    function handler(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  function handleExport(fmt: ExportFormat) {
    setExportOpen(false);
    const suite = {
      test_cases: cases,
      coverage_summary: coverageSummary,
      total_count: cases.length,
      priority_breakdown: {
        critical: cases.filter((c) => c.priority === 'critical').length,
        high:     cases.filter((c) => c.priority === 'high').length,
        medium:   cases.filter((c) => c.priority === 'medium').length,
        low:      cases.filter((c) => c.priority === 'low').length,
      },
    };
    exportSuite(suite, fmt);
  }

  function toggleFocus(area: string) {
    setFocus((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function handleGenerate() {
    generate({ projectId, focusAreas: focusAreas.length > 0 ? focusAreas : undefined, role });
    // Re-check stale status after generation
    setStaleKey((k) => k + 1);
  }

  function handleResume() {
    generate({ projectId, focusAreas: focusAreas.length > 0 ? focusAreas : undefined, resumeFrom: resumeFrom ?? undefined, role });
  }

  return (
    <div className="tf-fade-in">
      {/* Page header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.TestCases size={20} style={{ color: 'var(--accent-2)' }} />
            Test Case Generator
          </div>
          <div className="tf-page-sub">
            Scout → Generator → Judge pipeline · Streams structured test cases verified against analyzed screen elements.
          </div>
        </div>
        <div className="tf-row">
          {isRunning ? (
            <button className="tf-btn tf-btn-ghost" onClick={cancel}>
              <I.X size={14} /> Cancel
            </button>
          ) : null}
          {canExport && (
            <div ref={exportRef} style={{ position: 'relative' }}>
              <button
                className="tf-btn tf-btn-ghost"
                onClick={() => setExportOpen((v) => !v)}
                title={partial ? 'Exporting a partial result — generation was interrupted' : undefined}
              >
                <I.Download size={14} /> Export{partial ? ' (partial)' : ''}
              </button>
              {exportOpen && (
                <div className="tf-dropdown" style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 4,
                  zIndex: 20, minWidth: 160,
                }}>
                  {(['gherkin', 'markdown', 'csv', 'json'] as ExportFormat[]).map((fmt) => (
                    <button key={fmt} className="tf-dropdown-item" onClick={() => handleExport(fmt)}>
                      {fmt === 'gherkin' ? '🥒 Gherkin (.feature)' :
                       fmt === 'markdown' ? '📝 Markdown (.md)' :
                       fmt === 'csv'      ? '📊 CSV (.csv)' :
                                            '🔧 JSON (.json)'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isRunning && (tokenEstimate || meta?.estimatedTokens) && (
            <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono, monospace)', alignSelf: 'center' }}
              title="Estimated token usage for this generation">
              ~{((meta?.estimatedTokens ?? tokenEstimate ?? 0) / 1000).toFixed(1)}K tokens
            </span>
          )}
          <button
            className="tf-btn tf-btn-primary"
            onClick={handleGenerate}
            disabled={isRunning}
          >
            {isRunning
              ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Generating…</>
              : <><I.Sparkle size={14} /> Generate Suite</>
            }
          </button>
        </div>
      </div>

      {/* Config card */}
      <div className="tf-card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Role selector */}
          <div>
            <div className="tf-label" style={{ marginBottom: 6 }}>Tester role</div>
            <div className="tf-tabs">
              {TESTER_ROLES.map(({ key, label }) => (
                <button
                  key={key}
                  className={`tf-tab${role === key ? ' active' : ''}`}
                  onClick={() => setRole(key)}
                  disabled={isRunning}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus areas */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="tf-label" style={{ marginBottom: 6 }}>
              Focus areas
              {focusAreas.length > 0 && (
                <span style={{ marginLeft: 6, color: focusAreas.length > 5 ? 'var(--warning)' : 'var(--text-2)', fontWeight: 400 }}>
                  ({focusAreas.length} selected{focusAreas.length > 5 ? ' — consider 3–5 for best quality' : ''})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FOCUS_OPTIONS.map((f) => (
                <button
                  key={f}
                  className={`tf-chip${focusAreas.includes(f) ? ' active' : ''}`}
                  onClick={() => toggleFocus(f)}
                  disabled={isRunning}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Provider badge */}
          {meta && (
            <div style={{ alignSelf: 'flex-end' }}>
              <span className="tf-provider-badge">
                <span className="tf-dot" />
                {meta.provider} · {meta.model.split('/').pop()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* No screens warning — generation will be less accurate without screen context */}
      {hasScreens === false && !isRunning && (
        <div
          className="tf-card tf-fade-in"
          style={{ marginBottom: 12, padding: 12, borderColor: 'var(--warning)', background: 'rgba(251,191,36,0.05)', display: 'flex', gap: 10, alignItems: 'center' }}
        >
          <I.Alert size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, flex: 1 }}>
            No screens uploaded for this project. Upload screen designs for richer, more accurate test cases.
          </span>
        </div>
      )}

      {/* Stale prompt nudge — shown when artifact exists but was generated with old prompts */}
      {stale?.stale && stale.exists && !isRunning && (
        <div
          className="tf-card tf-fade-in"
          style={{ marginBottom: 12, padding: 12, borderColor: 'var(--accent-strong)', background: 'var(--accent-glow)', display: 'flex', gap: 10, alignItems: 'center' }}
        >
          <I.Sparkle size={14} style={{ color: 'var(--accent-2)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, flex: 1 }}>
            Your test suite was generated with an older prompt version. Re-generate for improved results.
          </span>
          <button className="tf-btn tf-btn-sm" onClick={handleGenerate}>
            Re-generate
          </button>
        </div>
      )}

      {/* Partial / error banners */}
      {partial && status === 'partial' && (
        <PartialBanner
          count={cases.length}
          onResume={handleResume}
          onKeep={() => complete()}
        />
      )}

      {status === 'error' && error && (
        <ErrorBanner message={error} onRetry={handleGenerate} />
      )}

      {/* Coverage gap analysis — visible when generation is complete */}
      {(status === 'complete' || status === 'partial') && cases.length > 0 && (
        <CoverageGapAnalysis cases={cases} focusAreas={focusAreas} />
      )}

      {/* Test case list */}
      <TestCaseList
        cases={cases}
        streaming={streaming}
        status={status}
        projectId={projectId}
      />
    </div>
  );
}

// ── Banners ───────────────────────────────────────────────────────────────────

function PartialBanner({
  count,
  onResume,
  onKeep,
}: {
  count: number;
  onResume: () => void;
  onKeep: () => void;
}) {
  return (
    <div
      className="tf-card tf-fade-in"
      style={{
        marginBottom: 16, padding: 14,
        borderColor: 'var(--warning)',
        background: 'rgba(251,191,36,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <I.Alert size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Generation interrupted</div>
          <div style={{ fontSize: 12, color: 'var(--text-1)' }}>
            {count} test case{count !== 1 ? 's' : ''} generated before stream was interrupted. Resume to continue or keep what you have.
          </div>
        </div>
        <button className="tf-btn tf-btn-sm tf-btn-ghost" onClick={onKeep}>
          Keep partial
        </button>
        <button className="tf-btn tf-btn-sm tf-btn-primary" onClick={onResume}>
          Resume
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="tf-card tf-fade-in"
      style={{
        marginBottom: 16, padding: 14,
        borderColor: 'rgba(248,113,113,0.4)',
        background: 'rgba(248,113,113,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <I.X size={16} style={{ color: '#f87171', flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-1)' }}>{message}</div>
        <button className="tf-btn tf-btn-sm" onClick={onRetry}>Retry</button>
      </div>
    </div>
  );
}
