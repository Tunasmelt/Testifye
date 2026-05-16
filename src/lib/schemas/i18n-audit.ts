import { z } from 'zod';

export const I18nFindingSchema = z.object({
  category: z.enum(['text_expansion', 'rtl', 'date_format', 'currency', 'number_format', 'cultural_assumption']),
  severity: z.enum(['critical', 'major', 'minor']),
  screen: z.string(),
  element: z.string(),
  detail: z.string(),
  locales: z.array(z.string()).describe('Affected locale codes e.g. ["ar-SA", "de-DE"]'),
});

export const I18nAuditOutputSchema = z.object({
  readiness_score: z.number().min(0).max(100).describe('Overall i18n readiness 0–100'),
  readiness_label: z.string().describe('e.g. "Partially Ready", "Production Ready"'),
  recommended_locales: z.array(z.string()).describe('Suggested priority test locales'),
  findings: z.array(I18nFindingSchema),
  summary: z.object({
    critical: z.number(),
    major: z.number(),
    minor: z.number(),
  }),
});

export type I18nFinding      = z.infer<typeof I18nFindingSchema>;
export type I18nAuditOutput  = z.infer<typeof I18nAuditOutputSchema>;
