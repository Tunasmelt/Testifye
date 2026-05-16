import { z } from 'zod';

export const BugReportSchema = z.object({
  bug_id: z.string(),
  title: z.string(),
  severity: z.enum(['blocker', 'critical', 'major', 'minor', 'trivial']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']),
  component: z.string().describe('App area e.g. Checkout, Auth, Search'),
  environment: z.object({
    platform: z.string().describe('Android, iOS, Web, Desktop'),
    os: z.string(),
    browser: z.string(),
    app_version: z.string(),
    screen_size: z.string().optional(),
  }),
  steps_to_reproduce: z.array(z.string()).describe('Plain-string steps'),
  expected_result: z.string(),
  actual_result: z.string(),
  frequency: z.enum(['always', 'often', 'sometimes', 'rarely', 'once']),
  root_cause_hypothesis: z.string().describe('AI-inferred probable root cause'),
  suggested_fix: z.string(),
  labels: z.array(z.string()).default([]).describe('Searchable tags'),
  screenshot_refs: z.array(z.string()).default([]),
});

export type BugReport = z.infer<typeof BugReportSchema>;
