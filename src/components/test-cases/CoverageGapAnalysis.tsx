'use client';

/**
 * Coverage Gap Analysis — Phase 3 Task 3.8
 * Compares generated test cases against project scope areas.
 * Shows a breakdown of which scope areas are well-covered vs under-tested.
 */

import type { TestCase } from '@/lib/schemas/test-case';

const DEFAULT_SCOPE_AREAS = [
  'Authentication',
  'Navigation',
  'Forms',
  'Payments',
  'Search',
  'Errors',
  'Accessibility',
  'Performance',
  'Data validation',
  'User management',
] as const;

interface Props {
  cases: TestCase[];
  focusAreas?: string[];
}

interface ScopeAreaCoverage {
  area: string;
  count: number;
  pct: number;
}

/**
 * Each matching test case contributes 10 coverage points, capped at 100.
 * This means 10+ matching cases = "fully covered" for that scope area.
 * The threshold is intentionally lenient — we want to encourage, not discourage.
 */
const POINTS_PER_CASE = 10;

/**
 * Synonyms/aliases — maps display area name (lowercase) to a set of tokens that
 * indicate coverage for that area. Without this, 'Authentication' only matches
 * test cases whose text literally contains "authentication"; in practice AI generates
 * categories like "auth", "login", "signup", "password", etc.
 */
const AREA_SYNONYMS: Record<string, string[]> = {
  authentication: ['auth', 'login', 'logout', 'signup', 'sign up', 'sign in', 'password', 'credential', 'register', 'session', 'token'],
  navigation:     ['nav', 'menu', 'routing', 'redirect', 'breadcrumb', 'back button', 'link'],
  forms:          ['form', 'input', 'field', 'submit', 'validation', 'text box', 'checkbox', 'radio', 'select', 'dropdown'],
  payments:       ['payment', 'checkout', 'billing', 'card', 'stripe', 'purchase', 'order', 'invoice', 'subscription'],
  search:         ['search', 'query', 'filter', 'sort', 'results', 'find'],
  errors:         ['error', 'exception', '404', '500', 'fail', 'invalid', 'not found', 'timeout'],
  accessibility:  ['a11y', 'aria', 'screen reader', 'keyboard', 'contrast', 'wcag', 'alt text', 'focus'],
  performance:    ['perf', 'load', 'speed', 'latency', 'timeout', 'slow', 'cache'],
  'data validation': ['validate', 'validation', 'constraint', 'required', 'max length', 'min length', 'format'],
  'user management': ['user', 'profile', 'account', 'role', 'permission', 'admin', 'invite'],
};

function matchesArea(text: string, area: string): boolean {
  const areaLower = area.toLowerCase();
  if (text.includes(areaLower)) return true;
  const synonyms = AREA_SYNONYMS[areaLower] ?? [];
  return synonyms.some((s) => text.includes(s));
}

function computeCoverage(cases: TestCase[], areas: readonly string[]): ScopeAreaCoverage[] {
  return areas.map((area) => {
    const count = cases.filter((tc) => {
      const text = [tc.title, tc.category, tc.screen_label ?? ''].join(' ').toLowerCase();
      return matchesArea(text, area);
    }).length;
    const pct = cases.length === 0 ? 0 : Math.min(100, count * POINTS_PER_CASE);
    return { area, count, pct };
  });
}

function coverageColor(pct: number): string {
  if (pct >= 66) return 'var(--success)';
  if (pct >= 33) return 'var(--warning)';
  return 'var(--error)';
}

function coverageLabel(pct: number): string {
  if (pct >= 66) return 'Well covered';
  if (pct >= 33) return 'Partial';
  return 'Under-tested';
}

export function CoverageGapAnalysis({ cases, focusAreas }: Props) {
  const areas = focusAreas && focusAreas.length > 0 ? focusAreas : DEFAULT_SCOPE_AREAS;
  const coverage = computeCoverage(cases, areas);
  const sorted   = [...coverage].sort((a, b) => b.count - a.count);

  const wellCovered   = sorted.filter((s) => s.pct >= 66).length;
  const partial       = sorted.filter((s) => s.pct >= 33 && s.pct < 66).length;
  const underTested   = sorted.filter((s) => s.pct < 33).length;

  if (cases.length === 0) return null;

  return (
    <div className="tf-card" style={{ padding: 18, marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Coverage Gap Analysis</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {wellCovered} well-covered · {partial} partial · {underTested} under-tested
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--success)' }}>● Well covered</span>
          <span style={{ color: 'var(--warning)' }}>● Partial</span>
          <span style={{ color: 'var(--error)' }}>● Under-tested</span>
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(({ area, count, pct }) => (
          <div key={area}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span>{area}</span>
              <span style={{ color: 'var(--text-2)' }}>
                {count} case{count !== 1 ? 's' : ''} · <span style={{ color: coverageColor(pct) }}>{coverageLabel(pct)}</span>
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-1)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 3,
                  background: coverageColor(pct),
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
