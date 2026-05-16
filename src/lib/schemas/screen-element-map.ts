import { z } from 'zod';

export const UIElementSchema = z.object({
  type: z.enum(['button', 'input', 'link', 'nav', 'text', 'image', 'icon', 'toggle', 'dropdown', 'modal', 'tab', 'card', 'list']),
  label: z.string().describe('Visible text or inferred label'),
  inferred_function: z.string().describe('What this element likely does'),
  location: z.string().describe('Position: top-left, center, bottom-nav, etc.'),
  is_interactive: z.boolean(),
});

export const PlatformSignalsSchema = z.object({
  is_mobile: z.boolean(),
  has_bottom_nav: z.boolean(),
  has_hamburger_menu: z.boolean(),
  has_status_bar: z.boolean(),
  estimated_platform: z.enum(['ios', 'android', 'web', 'desktop', 'unknown']),
});

export const ScreenElementMapSchema = z.object({
  screen_label: z.string().describe('E.g., "Login Screen", "Dashboard"'),
  description: z.string().describe('One-sentence description of the screen'),
  elements: z.array(UIElementSchema),
  inferred_flow: z.string().describe('Where this screen fits in the user journey'),
  platform_signals: PlatformSignalsSchema,
});

export type UIElement       = z.infer<typeof UIElementSchema>;
export type PlatformSignals = z.infer<typeof PlatformSignalsSchema>;
export type ScreenElementMap = z.infer<typeof ScreenElementMapSchema>;
