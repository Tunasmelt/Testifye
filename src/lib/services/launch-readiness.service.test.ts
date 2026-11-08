import { describe, it, expect, vi } from 'vitest';

// The service imports the admin client at module load; the scoring function is pure.
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }));

import { computeLaunchReadiness, type LaunchReadinessInputs } from './launch-readiness.service';

const EMPTY: LaunchReadinessInputs = { testSuite: null, uxReview: null, gapAnalysis: null, bugReports: [] };

// Fixtures are partial on purpose; the service only reads the fields below.
const cast = <T,>(v: unknown) => v as T;

const testCase = (category: string, verified = true) => ({ category, is_verified: verified });
const suite = (cases: ReturnType<typeof testCase>[], total = cases.length) =>
  cast<NonNullable<LaunchReadinessInputs['testSuite']>>({ test_cases: cases, total_count: total });

const ux = (score: number, findings: unknown[] = []) =>
  cast<NonNullable<LaunchReadinessInputs['uxReview']>>({ overall_score: score, findings });

const gaps = (findings: { id: string; severity: string; description?: string }[]) =>
  cast<NonNullable<LaunchReadinessInputs['gapAnalysis']>>({ findings });

const bug = (severity: string, id = 'BUG-001') =>
  cast<LaunchReadinessInputs['bugReports'][number]>({ bug_id: id, title: `${severity} bug`, severity });

describe('computeLaunchReadiness', () => {
  it('scores an empty project as 40 / Not Ready (gaps and bugs default to 100)', () => {
    const r = computeLaunchReadiness(EMPTY);
    expect(r.dimensions.test_coverage.score).toBe(0);
    expect(r.dimensions.ux_score.score).toBe(0);
    expect(r.dimensions.gap_count.score).toBe(100);
    expect(r.dimensions.bug_severity.score).toBe(100);
    expect(r.overall_score).toBe(40);
    expect(r.readiness_label).toBe('Not Ready');
    expect(r.blocking_issues).toEqual([]);
  });

  it('returns Ready for a strong project', () => {
    const cases = ['auth', 'forms', 'nav', 'search', 'payments', 'errors'].flatMap((c) =>
      Array.from({ length: 9 }, () => testCase(c)),
    );
    const r = computeLaunchReadiness({
      testSuite: suite(cases),
      uxReview: ux(90),
      gapAnalysis: gaps([]),
      bugReports: [],
    });
    expect(r.dimensions.test_coverage.score).toBe(100);
    expect(r.overall_score).toBe(Math.round(100 * 0.3 + 90 * 0.3 + 100 * 0.2 + 100 * 0.2));
    expect(r.readiness_label).toBe('Ready');
  });

  it('computes test coverage from count, category breadth and verified ratio (ignores coverage_score)', () => {
    const base = [testCase('a'), testCase('b', false)];
    const withIgnoredField = cast<NonNullable<LaunchReadinessInputs['testSuite']>>({
      test_cases: base, total_count: 2, coverage_score: 100,
    });
    const r = computeLaunchReadiness({ ...EMPTY, testSuite: withIgnoredField });
    // 2/50*50 = 2, 2/6*30 = 10, 0.5*20 = 10  → 22
    expect(r.dimensions.test_coverage.score).toBe(22);
  });

  it('counts every filed bug report, not just the latest', () => {
    const r = computeLaunchReadiness({
      ...EMPTY,
      bugReports: [bug('critical', 'BUG-001'), bug('major', 'BUG-002'), bug('minor', 'BUG-003')],
    });
    // 100 - (30 + 15 + 5) = 50
    expect(r.dimensions.bug_severity.score).toBe(50);
    expect(r.blocking_issues.filter((i) => i.type === 'critical_bug')).toHaveLength(1);
  });

  it('floors the bug score at 0 and maps blocker→critical, critical→high', () => {
    const r = computeLaunchReadiness({
      ...EMPTY,
      bugReports: [bug('blocker', 'BUG-001'), bug('blocker', 'BUG-002'), bug('blocker', 'BUG-003'), bug('critical', 'BUG-004')],
    });
    expect(r.dimensions.bug_severity.score).toBe(0);
    const sev = Object.fromEntries(r.blocking_issues.map((i) => [i.source, i.severity]));
    expect(sev['BUG-001']).toBe('critical');
    expect(sev['BUG-004']).toBe('high');
  });

  it('caps blocking issues: 3 UX, 3 gaps, 5 bugs', () => {
    const uxFindings = Array.from({ length: 6 }, (_, i) => ({
      severity: 'critical', heuristic_number: i + 1, heuristic_name: `H${i + 1}`, description: 'd', element: 'e',
    }));
    const gapFindings = Array.from({ length: 6 }, (_, i) => ({ id: `GAP-${i}`, severity: 'critical' }));
    const bugs = Array.from({ length: 8 }, (_, i) => bug('critical', `BUG-${i}`));
    const r = computeLaunchReadiness({
      testSuite: null, uxReview: ux(50, uxFindings), gapAnalysis: gaps(gapFindings), bugReports: bugs,
    });
    expect(r.blocking_issues.filter((i) => i.type === 'ux_issue')).toHaveLength(3);
    expect(r.blocking_issues.filter((i) => i.type === 'missing_requirement')).toHaveLength(3);
    expect(r.blocking_issues.filter((i) => i.type === 'critical_bug')).toHaveLength(5);
  });

  it('labels UX blocking issues with the real heuristic number and name', () => {
    const r = computeLaunchReadiness({
      ...EMPTY,
      uxReview: ux(60, [
        { severity: 'critical', heuristic_number: 1, heuristic_name: 'Visibility of system status', description: 'No loader' },
        { severity: 'minor', heuristic_number: 2, heuristic_name: 'x', description: 'ignored' },
      ]),
    });
    expect(r.blocking_issues).toHaveLength(1);
    expect(r.blocking_issues[0].source).toBe('Heuristic 1 — Visibility of system status');
    expect(r.blocking_issues[0].source).not.toContain('?');
  });

  it('penalises critical gaps 20 each and other gaps 5 each', () => {
    const r = computeLaunchReadiness({
      ...EMPTY,
      gapAnalysis: gaps([
        { id: 'G1', severity: 'critical' },
        { id: 'G2', severity: 'high' },
        { id: 'G3', severity: 'low' },
      ]),
    });
    expect(r.dimensions.gap_count.score).toBe(100 - 20 - 5 - 5);
  });

  it('labels: UX 100 on an otherwise empty project is 70 / Needs Attention', () => {
    const r = computeLaunchReadiness({ ...EMPTY, uxReview: ux(100) });
    expect(r.overall_score).toBe(70);
    expect(r.readiness_label).toBe('Needs Attention');
  });

  it('labels: everything failing scores 0 / Critical Issues', () => {
    const r = computeLaunchReadiness({
      testSuite: null,
      uxReview: ux(0),
      gapAnalysis: gaps(Array.from({ length: 5 }, (_, i) => ({ id: `G${i}`, severity: 'critical' }))),
      bugReports: Array.from({ length: 3 }, (_, i) => bug('blocker', `BUG-${i}`)),
    });
    expect(r.overall_score).toBe(0);
    expect(r.readiness_label).toBe('Critical Issues');
  });
});
