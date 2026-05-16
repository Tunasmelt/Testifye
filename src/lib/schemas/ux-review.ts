import { z } from 'zod';

export const UXFindingSchema = z.object({
  heuristic_number: z.number().min(1).max(10),
  heuristic_name: z.string(),
  severity: z.enum(['critical', 'major', 'minor', 'enhancement']),
  effort: z.enum(['quick-win', 'moderate', 'significant']).describe('Implementation effort — powers the Quick Wins filter'),
  element: z.string().describe('Which UI element this finding relates to'),
  screen: z.string().describe('Which analyzed screen this finding appears on'),
  description: z.string(),
  suggestion: z.string().describe('Actionable improvement'),
  screenshot_ref: z.string().optional(),
  is_verified: z.boolean().default(false),
});

export const A11yFlagSchema = z.object({
  type: z.enum(['contrast', 'touch_target', 'alt_text', 'focus_order', 'keyboard_nav', 'aria_label']),
  criterion: z.string().describe('WCAG criterion e.g. 1.4.3'),
  element: z.string(),
  screen: z.string(),
  detail: z.string().describe('Specific measurement or description'),
});

export const UXReviewOutputSchema = z.object({
  overall_score: z.number().min(0).max(100),
  grade: z.string().describe('Letter grade: A+, A, B+, B, C, D, F'),
  findings: z.array(UXFindingSchema),
  score_breakdown: z.record(z.string(), z.number()).describe('Per-heuristic scores 0–10'),
  accessibility_flags: z.array(A11yFlagSchema),
  strengths: z.array(z.string()),
  screen_metrics: z.object({
    dominant_colors: z.array(z.string()).optional(),
    contrast_ratios: z.array(z.object({
      pair: z.string(),
      ratio: z.number(),
      passes_aa: z.boolean(),
    })).optional(),
    whitespace_ratio: z.number().optional(),
    element_density: z.number().optional(),
  }).optional(),
});

export type UXFinding       = z.infer<typeof UXFindingSchema>;
export type A11yFlag        = z.infer<typeof A11yFlagSchema>;
export type UXReviewOutput  = z.infer<typeof UXReviewOutputSchema>;
