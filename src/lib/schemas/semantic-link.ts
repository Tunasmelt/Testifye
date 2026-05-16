import { z } from 'zod';

export const SemanticLinkSchema = z.object({
  req: z.string().describe('Requirement text from PRD'),
  loc: z.string().describe('PRD section reference e.g. §2.1'),
  element: z.string().nullable().describe('Matched UI element label — null if missing'),
  screen: z.string().nullable().describe('Screen where element was found — null if missing'),
  status: z.enum(['verified', 'missing', 'mismatch', 'untested']),
  confidence: z.number().min(0).max(1).describe('Match confidence 0–1'),
  note: z.string().optional().describe('Explanation for mismatch or untested status'),
});

export const SemanticLinkOutputSchema = z.object({
  links: z.array(SemanticLinkSchema),
  summary: z.object({
    verified: z.number(),
    missing: z.number(),
    mismatch: z.number(),
    untested: z.number(),
  }),
});

export type SemanticLink       = z.infer<typeof SemanticLinkSchema>;
export type SemanticLinkOutput = z.infer<typeof SemanticLinkOutputSchema>;
