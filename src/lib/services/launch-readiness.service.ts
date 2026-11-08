/**
 * Launch Readiness — deterministic composite score (no AI call).
 * Reads generated_artifacts; scoring is a pure function so it can be unit-tested.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { LaunchReadinessOutput, BlockingIssue } from '@/lib/schemas/launch-readiness';
import type { TestSuiteOutput } from '@/lib/schemas/test-case';
import type { UXReviewOutput } from '@/lib/schemas/ux-review';
import type { GapAnalysisOutput } from '@/lib/schemas/gap-analysis';
import type { BugReport } from '@/lib/schemas/bug-report';

export interface LaunchReadinessInputs {
  testSuite:   TestSuiteOutput | null;
  uxReview:    UXReviewOutput | null;
  gapAnalysis: GapAnalysisOutput | null;
  /** Every bug report filed for the project (not just the latest). */
  bugReports:  BugReport[];
}

const BUG_PENALTY: Record<string, number> = {
  blocker: 40, critical: 30, major: 15, minor: 5, trivial: 2,
};

/** Test coverage = volume (50) + category breadth (30) + judge-verified ratio (20). */
function scoreTests(ts: TestSuiteOutput | null): { score: number; detail: string } {
  if (!ts) return { score: 0, detail: 'No test suite generated yet' };
  const cases = ts.test_cases ?? [];
  const count = ts.total_count ?? cases.length;
  const categories = new Set(cases.map((c) => c.category).filter(Boolean)).size;
  const verified = cases.filter((c) => c.is_verified).length;
  const verifiedRatio = cases.length > 0 ? verified / cases.length : 0;

  const score = Math.min(100, Math.round(
    (Math.min(count, 50) / 50) * 50 +
    (Math.min(categories, 6) / 6) * 30 +
    verifiedRatio * 20,
  ));
  return {
    score,
    detail: `${count} test cases · ${categories} categories · ${Math.round(verifiedRatio * 100)}% verified`,
  };
}

function scoreUx(ux: UXReviewOutput | null): { score: number; detail: string } {
  if (!ux) return { score: 0, detail: 'No UX audit run yet' };
  const score = typeof ux.overall_score === 'number' ? ux.overall_score : 0;
  const critical = (ux.findings ?? []).filter((f) => f.severity === 'critical').length;
  return { score, detail: `Score: ${score}/100 · ${critical} critical issues` };
}

function scoreGaps(g: GapAnalysisOutput | null): { score: number; detail: string } {
  if (!g) return { score: 100, detail: 'No gap analysis run — assuming 100%' };
  const total = g.findings?.length ?? 0;
  const critical = (g.findings ?? []).filter((f) => f.severity === 'critical').length;
  return {
    score: Math.max(0, 100 - critical * 20 - (total - critical) * 5),
    detail: `${total} gaps found · ${critical} critical`,
  };
}

function scoreBugs(bugs: BugReport[]): { score: number; detail: string } {
  if (bugs.length === 0) return { score: 100, detail: 'No bug reports filed' };
  const penalty = bugs.reduce((sum, b) => sum + (BUG_PENALTY[b.severity] ?? 0), 0);
  const severe = bugs.filter((b) => b.severity === 'blocker' || b.severity === 'critical').length;
  return {
    score: Math.max(0, 100 - penalty),
    detail: `${bugs.length} bug report${bugs.length === 1 ? '' : 's'} · ${severe} blocker/critical`,
  };
}

const label = (score: number, [a, b, c]: [string, string, string], d: string) =>
  score >= 80 ? a : score >= 60 ? b : score >= 40 ? c : d;

export function computeLaunchReadiness(inputs: LaunchReadinessInputs): LaunchReadinessOutput {
  const { testSuite, uxReview, gapAnalysis, bugReports } = inputs;
  const t = scoreTests(testSuite);
  const u = scoreUx(uxReview);
  const g = scoreGaps(gapAnalysis);
  const b = scoreBugs(bugReports);

  const overall = Math.round(t.score * 0.3 + u.score * 0.3 + g.score * 0.2 + b.score * 0.2);

  const blocking: BlockingIssue[] = [];

  (uxReview?.findings ?? [])
    .filter((f) => f.severity === 'critical')
    .slice(0, 3)
    .forEach((f) => blocking.push({
      type: 'ux_issue',
      source: `Heuristic ${f.heuristic_number}${f.heuristic_name ? ` — ${f.heuristic_name}` : ''}`,
      description: f.description || f.element || 'Critical UX finding',
      severity: 'critical',
    }));

  (gapAnalysis?.findings ?? [])
    .filter((f) => f.severity === 'critical')
    .slice(0, 3)
    .forEach((f) => blocking.push({
      type: 'missing_requirement',
      source: f.id || 'Gap',
      description: f.description || 'Critical requirement gap',
      severity: 'critical',
    }));

  bugReports
    .filter((r) => r.severity === 'blocker' || r.severity === 'critical')
    .slice(0, 5)
    .forEach((r) => blocking.push({
      type: 'critical_bug',
      source: r.bug_id || 'BUG',
      description: r.title || 'Critical bug',
      severity: r.severity === 'blocker' ? 'critical' : 'high',
    }));

  return {
    overall_score: overall,
    readiness_label:
      overall >= 80 ? 'Ready' : overall >= 60 ? 'Needs Attention' : overall >= 40 ? 'Not Ready' : 'Critical Issues',
    dimensions: {
      test_coverage: { score: t.score, label: label(t.score, ['Good', 'Fair', 'Needs work'], 'Missing'), detail: t.detail },
      ux_score:      { score: u.score, label: label(u.score, ['Good', 'Needs attention', 'Poor'], 'Not audited'), detail: u.detail },
      gap_count:     { score: g.score, label: g.score >= 90 ? 'Clean' : g.score >= 70 ? 'Minor gaps' : g.score >= 50 ? 'Gaps found' : 'Critical gaps', detail: g.detail },
      bug_severity:  { score: b.score, label: b.score >= 90 ? 'No blockers' : b.score >= 70 ? 'Minor bugs' : b.score >= 40 ? 'Major bugs' : 'Blockers', detail: b.detail },
    },
    blocking_issues: blocking,
    computed_at: new Date().toISOString(),
  };
}

/** Loads artifacts for a project and computes the score. Caller must verify ownership. */
export async function loadAndComputeLaunchReadiness(projectId: string): Promise<LaunchReadinessOutput> {
  const supabase = createAdminClient();

  const [{ data: latest }, { data: bugRows }] = await Promise.all([
    supabase
      .from('generated_artifacts')
      .select('artifact_type, content')
      .eq('project_id', projectId)
      .eq('is_latest', true)
      .in('artifact_type', ['test_suite', 'ux_review', 'gap_analysis']),
    // Bug reports are one-per-artifact, so is_latest would only ever return the newest one.
    supabase
      .from('generated_artifacts')
      .select('content')
      .eq('project_id', projectId)
      .eq('artifact_type', 'bug_report')
      .eq('status', 'complete'),
  ]);

  const pick = <T,>(type: string): T | null =>
    ((latest ?? []).find((a) => a.artifact_type === type)?.content as T | undefined) ?? null;

  return computeLaunchReadiness({
    testSuite:   pick<TestSuiteOutput>('test_suite'),
    uxReview:    pick<UXReviewOutput>('ux_review'),
    gapAnalysis: pick<GapAnalysisOutput>('gap_analysis'),
    bugReports:  (bugRows ?? []).map((r) => r.content as BugReport),
  });
}
