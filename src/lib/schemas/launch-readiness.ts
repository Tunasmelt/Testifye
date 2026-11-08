import { z } from 'zod';

export const BlockingIssueSchema = z.object({
  type: z.enum(['critical_bug', 'ux_issue', 'missing_requirement', 'a11y_blocker']),
  /** Human-readable source reference, e.g. "BUG-003", "Heuristic 1", "Gap: Login flow" */
  source: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium']),
});

export const DimensionScoreSchema = z.object({
  /** 0–100 */
  score: z.number().min(0).max(100),
  /** Short human label, e.g. "Good", "Needs attention", "Critical issues" */
  label: z.string(),
  /** One-line detail, e.g. "85 test cases · 72% coverage score" */
  detail: z.string(),
});

export const LaunchReadinessOutputSchema = z.object({
  /** Composite weighted score 0–100 */
  overall_score: z.number().min(0).max(100),
  readiness_label: z.enum(['Ready', 'Needs Attention', 'Not Ready', 'Critical Issues']),
  dimensions: z.object({
    test_coverage: DimensionScoreSchema,
    ux_score:      DimensionScoreSchema,
    gap_count:     DimensionScoreSchema,
    bug_severity:  DimensionScoreSchema,
  }),
  blocking_issues: z.array(BlockingIssueSchema),
  /** ISO timestamp when this was computed */
  computed_at: z.string(),
});

export type BlockingIssue         = z.infer<typeof BlockingIssueSchema>;
export type DimensionScore        = z.infer<typeof DimensionScoreSchema>;
export type LaunchReadinessOutput = z.infer<typeof LaunchReadinessOutputSchema>;
