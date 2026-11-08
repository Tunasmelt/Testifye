'use client';

import { useState } from 'react';
import type { TestCase } from '@/lib/schemas/test-case';
import * as I from '@/components/ui/Icons';

interface Props {
  tc:         TestCase;
  index:      number;
  isVerifying?: boolean;
  isStreaming?: boolean;
}

const PRIORITY_BADGE: Record<TestCase['priority'], string> = {
  critical: 'tf-badge-critical',
  high:     'tf-badge-high',
  medium:   'tf-badge-medium',
  low:      'tf-badge-low',
};

export function TestCaseRow({ tc, index, isVerifying, isStreaming }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="tf-tcrow tf-fade-in"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      {/* ID */}
      <div className="tf-tcrow-id">{tc.tc_id}</div>

      {/* Body */}
      <div className="tf-tcrow-body">
        <button
          className="tf-tcrow-title"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {tc.title}
          <I.ChevronDown
            size={12}
            style={{
              marginLeft: 6,
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
              opacity: 0.5,
            }}
          />
        </button>

        <div className="tf-tcrow-meta">
          <span className={`tf-badge ${PRIORITY_BADGE[tc.priority] ?? ''}`}>{tc.priority ?? '—'}</span>
          <span className="tf-chip">{tc.category}</span>
          <span style={{ fontSize: 11, color: 'var(--text-1)' }}>
            · {tc.step_count} steps
            {tc.screen_label && (
              <> · screen: <b style={{ color: 'var(--text-0)' }}>{tc.screen_label}</b></>
            )}
          </span>
          {!tc.is_verified && tc.verification_note && (
            <span className="tf-badge tf-badge-high" title={tc.verification_note}>
              <I.Alert size={9} /> unverified
            </span>
          )}
        </div>

        {/* Expanded steps */}
        {expanded && (
          <div className="tf-tcrow-steps tf-fade-in">
            {tc.preconditions && (
              <div className="tf-tcrow-precond">
                <span style={{ color: 'var(--text-2)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preconditions</span>
                <p style={{ margin: '2px 0 8px', fontSize: 12, color: 'var(--text-1)' }}>{tc.preconditions}</p>
              </div>
            )}
            <div className="tf-tcrow-steps-list">
              {(tc.steps ?? []).map((step) => (
                <div key={step.step_number} className="tf-tcrow-step">
                  <span className="tf-tcrow-step-num">{step.step_number}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12 }}>{step.action}</div>
                    <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>
                      ✓ {step.expected_result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {tc.test_data_suggestion && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace', padding: '6px 8px', background: 'var(--bg-1)', borderRadius: 6 }}>
                💡 {tc.test_data_suggestion}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status badge + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {isVerifying ? (
          <span className="tf-badge tf-badge-violet">
            <span className="tf-spin" style={{ display: 'inline-flex' }}>
              <I.Refresh size={9} />
            </span>{' '}
            verifying
          </span>
        ) : isStreaming ? (
          <span className="tf-badge" style={{ opacity: 0.5 }}>streaming</span>
        ) : tc.is_verified ? (
          <span className="tf-badge tf-badge-success"><I.Check size={9} /> verified</span>
        ) : null}

        <button className="tf-btn tf-btn-icon tf-btn-ghost" aria-label="More options">
          <I.More size={13} />
        </button>
      </div>
    </div>
  );
}

/** Skeleton placeholder shown while streaming */
export function TestCaseRowSkeleton({ index }: { index: number }) {
  return (
    <div className="tf-tcrow" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="tf-tcrow-id">
        <div className="tf-skeleton" style={{ height: 10, width: 40 }} />
      </div>
      <div className="tf-tcrow-body">
        <div className="tf-skeleton" style={{ height: 12, width: '65%', marginBottom: 6 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="tf-skeleton" style={{ height: 9, width: 50, borderRadius: 4 }} />
          <div className="tf-skeleton" style={{ height: 9, width: 70, borderRadius: 4 }} />
          <div className="tf-skeleton" style={{ height: 9, width: 100, borderRadius: 4 }} />
        </div>
      </div>
      <div className="tf-skeleton" style={{ height: 18, width: 60, borderRadius: 4 }} />
    </div>
  );
}
