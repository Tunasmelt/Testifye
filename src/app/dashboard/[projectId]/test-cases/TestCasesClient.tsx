'use client';

import { useState } from 'react';
import { useGenerationStore } from '@/lib/stores/generation.store';
import { useStreamTestCases } from '@/lib/hooks/useStreamTestCases';
import { TestCaseList } from '@/components/test-cases/TestCaseList';
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
  const { status, cases, streaming, meta, error, partial, resumeFrom } = useGenerationStore();
  const { generate, cancel } = useStreamTestCases();

  const [role,      setRole]      = useState<string>('manual_tester');
  const [focusAreas, setFocus]   = useState<string[]>([]);

  const isRunning = status === 'starting' || status === 'streaming';

  function toggleFocus(area: string) {
    setFocus((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function handleGenerate() {
    generate({ projectId, focusAreas: focusAreas.length > 0 ? focusAreas : undefined });
  }

  function handleResume() {
    generate({ projectId, focusAreas: focusAreas.length > 0 ? focusAreas : undefined, resumeFrom: resumeFrom ?? undefined });
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
                <span style={{ marginLeft: 6, color: 'var(--text-2)', fontWeight: 400 }}>
                  ({focusAreas.length} selected)
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

      {/* Partial / error banners */}
      {partial && status === 'partial' && (
        <PartialBanner
          count={cases.length}
          onResume={handleResume}
          onKeep={() => useGenerationStore.getState().complete()}
        />
      )}

      {status === 'error' && error && (
        <ErrorBanner message={error} onRetry={handleGenerate} />
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
            {count} of ~12 test cases generated. Stream dropped — falling back to Google Gemini available.
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
