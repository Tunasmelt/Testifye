import { z } from 'zod';

export const GapFindingSchema = z.object({
  id: z.string().describe('GAP-01, GAP-02, etc.'),
  type: z.enum([
    'contradiction',
    'missing_flow',
    'ambiguity',
    'untestable',
    'undefined_error_state',
    'missing_from_ui',
    'undocumented_feature',
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  location: z.string().describe('PRD section reference e.g. §2.4'),
  description: z.string(),
  suggestion: z.string(),
});

export const GapAnalysisOutputSchema = z.object({
  findings: z.array(GapFindingSchema),
  requirements_count: z.number().describe('Total requirements parsed from PRD'),
  summary: z.object({
    contradictions: z.number(),
    missing_flows: z.number(),
    ambiguities: z.number(),
    untestable: z.number(),
  }),
});

export type GapFinding        = z.infer<typeof GapFindingSchema>;
export type GapAnalysisOutput = z.infer<typeof GapAnalysisOutputSchema>;
