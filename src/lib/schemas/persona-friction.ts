import { z } from 'zod';

export const FrictionItemSchema = z.object({
  screen: z.string(),
  element: z.string(),
  friction_type: z.enum(['cognitive_load', 'trust_issue', 'missing_affordance', 'accessibility', 'confusion', 'visual_hierarchy']),
  severity: z.enum(['blocking', 'frustrating', 'annoying', 'minor']),
  description: z.string(),
  suggestion: z.string(),
});

export const PersonaOutputSchema = z.object({
  persona_id: z.string(),
  persona_name: z.string(),
  empathy_statement: z.string().describe('One-line empathy summary for this persona'),
  ux_score: z.number().min(0).max(100),
  drop_off_risk: z.enum(['high', 'medium', 'low']),
  friction_items: z.array(FrictionItemSchema),
});

export const PersonaFrictionOutputSchema = z.object({
  personas: z.array(PersonaOutputSchema),
});

export type FrictionItem           = z.infer<typeof FrictionItemSchema>;
export type PersonaOutput          = z.infer<typeof PersonaOutputSchema>;
export type PersonaFrictionOutput  = z.infer<typeof PersonaFrictionOutputSchema>;
