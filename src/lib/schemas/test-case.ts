import { z } from 'zod';

export const TestStepSchema = z.object({
  step_number: z.number(),
  action: z.string(),
  expected_result: z.string(),
});

export const TestCaseSchema = z.object({
  tc_id: z.string().describe('TC-001, TC-002, etc.'),
  title: z.string(),
  category: z.string().describe('Focus area: Authentication, Navigation, etc.'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  preconditions: z.string(),
  steps: z.array(TestStepSchema),
  step_count: z.number().describe('Denormalized count of steps for list-view rendering'),
  screen_label: z.string().describe('Which analyzed screen this test case is grounded in'),
  test_data_suggestion: z.string().optional(),
  ui_elements_referenced: z.array(z.string()).describe('Element labels from ScreenElementMap'),
  is_verified: z.boolean().default(false),
  verification_note: z.string().optional(),
});

export const TestSuiteOutputSchema = z.object({
  test_cases: z.array(TestCaseSchema),
  coverage_summary: z.string().describe('Brief summary of what is and isn\'t covered'),
  total_count: z.number(),
  priority_breakdown: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
});

export type TestStep        = z.infer<typeof TestStepSchema>;
export type TestCase        = z.infer<typeof TestCaseSchema>;
export type TestSuiteOutput = z.infer<typeof TestSuiteOutputSchema>;
