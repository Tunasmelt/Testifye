'use client';

import { useMemo, useState } from 'react';
import { TestCaseRow, TestCaseRowSkeleton } from './TestCaseRow';
import type { TestCase } from '@/lib/schemas/test-case';
import type { GenerationStatus } from '@/lib/stores/generation.store';
import * as I from '@/components/ui/Icons';

const CATEGORIES = ['all', 'functional', 'edge', 'negative', 'accessibility', 'performance'] as const;

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high:     1,
  medium:   2,
  low:      3,
};

interface Props {
  cases:       TestCase[];
  streaming:   TestCase[];
  status:      GenerationStatus;
  verifyingIds?: Set<string>;
  projectId:   string;
}

export function TestCaseList({ cases, streaming, status, verifyingIds = new Set(), projectId }: Props) {
  const [filter, setFilter]   = useState<string>('all');
  const [search, setSearch]   = useState('');

  const isStreaming = status === 'streaming' || status === 'starting' || status === 'judging';
  const isComplete  = status === 'complete' || status === 'partial';

  // Decide which list to display: during stream show streaming[], after done show cases[]
  const displayList = isComplete ? cases : streaming;

  const filtered = useMemo(() => {
    let list = displayList;
    if (filter !== 'all') {
      list = list.filter((tc) => (tc.category ?? '').toLowerCase().includes(filter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((tc) =>
        (tc.title ?? '').toLowerCase().includes(q) ||
        (tc.tc_id ?? '').toLowerCase().includes(q) ||
        (tc.category ?? '').toLowerCase().includes(q)
      );
    }
    // Sort by priority within the filtered result (SCOPE.md: "sort by priority within groups")
    // Only sort complete results — leave streaming order intact so new cases appear at bottom
    if (isComplete) {
      list = [...list].sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority?.toLowerCase() ?? ''] ?? 99;
        const pb = PRIORITY_ORDER[b.priority?.toLowerCase() ?? ''] ?? 99;
        return pa - pb;
      });
    }
    return list;
  }, [displayList, filter, search, isComplete]);

  // How many skeleton rows to show during streaming
  const skeletonCount = isStreaming ? Math.max(0, Math.min(3, 12 - streaming.length)) : 0;

  // Category counts for filter chips
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: displayList.length };
    for (const tc of displayList) {
      const cat = (tc.category ?? '').toLowerCase();
      for (const c of CATEGORIES.slice(1)) {
        if (cat.includes(c)) counts[c] = (counts[c] ?? 0) + 1;
      }
    }
    return counts;
  }, [displayList]);

  return (
    <div>
      {/* Filter + search row */}
      <div
        className="tf-row"
        style={{ marginBottom: 14, justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`tf-chip${filter === c ? ' active' : ''}`}
              onClick={() => setFilter(c)}
              style={{ textTransform: 'capitalize' }}
            >
              {c}
              {catCounts[c] ? (
                <span style={{ opacity: 0.6, marginLeft: 4 }}>{catCounts[c]}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <I.Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-2)' }} />
            <input
              className="tf-input"
              style={{ paddingLeft: 28, height: 30, fontSize: 12, width: 180 }}
              placeholder="Search cases…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="tf-provider-badge">
            <span className="tf-dot" />
            {isStreaming ? 'Generating…' : `${displayList.length} cases`}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="tf-col" style={{ gap: 6 }}>
        {filtered.map((tc, i) => (
          <TestCaseRow
            key={tc.tc_id}
            tc={tc}
            index={i}
            isVerifying={verifyingIds.has(tc.tc_id)}
            isStreaming={isStreaming && i === streaming.length - 1}
          />
        ))}

        {/* Skeleton rows during streaming */}
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <TestCaseRowSkeleton key={`sk-${i}`} index={i} />
        ))}

        {/* Empty state */}
        {!isStreaming && filtered.length === 0 && displayList.length > 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-1)', fontSize: 13 }}>
            No cases match the current filter.
          </div>
        )}

        {!isStreaming && displayList.length === 0 && status === 'idle' && (
          <EmptyState projectId={projectId} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ projectId }: { projectId: string }) {
  void projectId;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-2)' }}>
        <I.TestCases size={22} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>No test cases yet</div>
      <div style={{ color: 'var(--text-1)', fontSize: 13, maxWidth: 340 }}>
        Configure your options above and hit <strong>Generate Suite</strong> to start the Scout → Generator → Judge pipeline.
      </div>
    </div>
  );
}
