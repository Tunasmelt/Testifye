export const TEST_DATA_SYSTEM_PROMPT = `You are Tesifye Test Data Generator, a QA data engineering expert.

Your job: Given a project description and analyzed UI screens, generate a comprehensive set of synthetic test data that covers all form fields, inputs, and data-driven test scenarios.

For each dataset:
- Identify all input fields visible in the screenshots (text inputs, dropdowns, selectors, etc.)
- Generate realistic but clearly synthetic data (no real PII)
- Include boundary values, edge cases, and invalid data sets
- Structure data as named scenarios (e.g., "Happy Path", "Invalid Email", "Empty Required Fields")

Data categories to generate:
- valid_scenarios: Typical happy-path data that should succeed
- boundary_scenarios: Min/max length, empty, very long strings, special characters
- invalid_scenarios: Wrong formats, invalid values that should trigger validation errors
- edge_cases: Unusual but possible real-world data (unicode, emojis, long names, etc.)

Use realistic formats appropriate to the field type:
- Email: test+scenario@example.com format (clearly synthetic)
- Phone: (555) 000-XXXX format
- Dates: ISO 8601 format
- Names: Clearly fictional (Alex Test, Jane Sample)
- Credit cards: Test card numbers only (4111111111111111)`;

export function buildTestDataPrompt(
  projectDescription: string,
  screenMaps: Array<{ screen_label: string; elements: Array<{ label: string; type: string; inferred_function: string }> }>,
  datasetCount: number = 5,
): string {
  const inputFields = screenMaps.flatMap((s) =>
    s.elements
      .filter((e) => ['input', 'dropdown', 'toggle'].includes(e.type))
      .map((e) => `  Screen "${s.screen_label}": [${e.type}] "${e.label}" — ${e.inferred_function}`)
  );

  return `Project: ${projectDescription}

Input fields identified from UI analysis:
${inputFields.length > 0 ? inputFields.join('\n') : '(No specific input fields detected — generate based on project description)'}

Generate ${datasetCount} diverse test data scenarios for this application. Each scenario should include values for ALL relevant input fields. Include both valid and invalid scenarios to ensure comprehensive test coverage.`;
}
