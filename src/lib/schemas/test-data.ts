import { z } from 'zod';

export const DataFieldSchema = z.object({
  field_name:   z.string().describe('Input field label from the UI'),
  field_type:   z.enum(['text', 'email', 'password', 'phone', 'number', 'date', 'select', 'boolean', 'file']),
  value:        z.string().describe('The test value for this field'),
  notes:        z.string().optional().describe('Why this value was chosen (e.g. "boundary: max length")'),
});

export const DataScenarioSchema = z.object({
  scenario_id:  z.string().describe('DS-001, DS-002, etc.'),
  name:         z.string().describe('e.g. "Happy Path — Standard User"'),
  category:     z.enum(['valid', 'boundary', 'invalid', 'edge_case']),
  description:  z.string().describe('What this scenario tests'),
  fields:       z.array(DataFieldSchema),
  expected_outcome: z.string().describe('What should happen when this data is submitted'),
});

export const TestDataOutputSchema = z.object({
  scenarios:        z.array(DataScenarioSchema),
  total_count:      z.number(),
  coverage_summary: z.string().describe('What input fields and scenarios are covered'),
  fields_identified: z.array(z.string()).describe('All input fields found in the UI'),
});

export type DataField       = z.infer<typeof DataFieldSchema>;
export type DataScenario    = z.infer<typeof DataScenarioSchema>;
export type TestDataOutput  = z.infer<typeof TestDataOutputSchema>;
