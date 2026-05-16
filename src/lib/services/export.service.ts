/**
 * Export service — converts generated artifacts to downloadable formats.
 * All transformations are pure client-side; no server round-trip needed.
 */
import type { TestCase, TestSuiteOutput } from '@/lib/schemas/test-case';

export type ExportFormat = 'markdown' | 'csv' | 'json' | 'gherkin' | 'jira' | 'linear';

// ── Markdown ──────────────────────────────────────────────────────────────────

function toMarkdown(suite: TestSuiteOutput): string {
  const lines: string[] = [
    '# Test Suite',
    '',
    `> ${suite.coverage_summary}`,
    '',
    `**Total:** ${suite.total_count} cases · Critical: ${suite.priority_breakdown.critical} · High: ${suite.priority_breakdown.high} · Medium: ${suite.priority_breakdown.medium} · Low: ${suite.priority_breakdown.low}`,
    '',
  ];

  for (const tc of suite.test_cases) {
    lines.push(`## ${tc.tc_id}: ${tc.title}`);
    lines.push('');
    lines.push(`**Priority:** ${tc.priority} | **Category:** ${tc.category} | **Screen:** ${tc.screen_label}`);
    lines.push('');
    if (tc.preconditions) {
      lines.push(`**Preconditions:** ${tc.preconditions}`);
      lines.push('');
    }
    lines.push('**Steps:**');
    lines.push('');
    for (const step of tc.steps) {
      lines.push(`${step.step_number}. ${step.action}`);
      lines.push(`   - Expected: ${step.expected_result}`);
    }
    lines.push('');
    if (tc.test_data_suggestion) {
      lines.push(`**Test Data:** ${tc.test_data_suggestion}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

// ── CSV ───────────────────────────────────────────────────────────────────────

function toCsv(suite: TestSuiteOutput): string {
  const headers = ['TC ID', 'Title', 'Category', 'Priority', 'Screen', 'Steps', 'Preconditions', 'Verified'];
  const rows = suite.test_cases.map((tc) => [
    tc.tc_id,
    `"${tc.title.replace(/"/g, '""')}"`,
    tc.category,
    tc.priority,
    tc.screen_label,
    tc.step_count.toString(),
    `"${(tc.preconditions ?? '').replace(/"/g, '""')}"`,
    tc.is_verified ? 'yes' : 'no',
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ── JSON ──────────────────────────────────────────────────────────────────────

function toJson(suite: TestSuiteOutput): string {
  return JSON.stringify(suite, null, 2);
}

// ── Gherkin (.feature) ────────────────────────────────────────────────────────

function toGherkin(suite: TestSuiteOutput): string {
  const lines: string[] = ['Feature: Generated Test Suite', `  # ${suite.coverage_summary}`, ''];

  for (const tc of suite.test_cases) {
    lines.push(`  @${tc.priority} @${tc.category.toLowerCase().replace(/\s+/g, '-')}`);
    lines.push(`  Scenario: ${tc.title}`);
    if (tc.preconditions) {
      lines.push(`    Given ${tc.preconditions}`);
    }
    for (const step of tc.steps) {
      const keyword = step.step_number === 1 ? 'When' : 'And';
      lines.push(`    ${keyword} ${step.action}`);
      lines.push(`    Then ${step.expected_result}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Jira markup ───────────────────────────────────────────────────────────────

function toJira(suite: TestSuiteOutput): string {
  const lines: string[] = [
    'h1. Test Suite',
    `${suite.coverage_summary}`,
    '',
    `*Total:* ${suite.total_count} | *Critical:* ${suite.priority_breakdown.critical} | *High:* ${suite.priority_breakdown.high}`,
    '',
  ];

  for (const tc of suite.test_cases) {
    lines.push(`h2. ${tc.tc_id}: ${tc.title}`);
    lines.push(`*Priority:* ${tc.priority} | *Category:* ${tc.category} | *Screen:* ${tc.screen_label}`);
    lines.push('');
    if (tc.preconditions) {
      lines.push(`*Preconditions:* ${tc.preconditions}`);
      lines.push('');
    }
    lines.push('*Steps:*');
    lines.push('{noformat}');
    for (const step of tc.steps) {
      lines.push(`${step.step_number}. ${step.action}`);
      lines.push(`   → ${step.expected_result}`);
    }
    lines.push('{noformat}');
    lines.push('----');
    lines.push('');
  }

  return lines.join('\n');
}

// ── Linear ────────────────────────────────────────────────────────────────────

function toLinear(suite: TestSuiteOutput): string {
  // Linear uses Markdown with specific issue format
  return toMarkdown(suite);
}

// ── Public API ────────────────────────────────────────────────────────────────

const CONVERTERS: Record<ExportFormat, (s: TestSuiteOutput) => string> = {
  markdown: toMarkdown,
  csv:      toCsv,
  json:     toJson,
  gherkin:  toGherkin,
  jira:     toJira,
  linear:   toLinear,
};

const MIME: Record<ExportFormat, string> = {
  markdown: 'text/markdown',
  csv:      'text/csv',
  json:     'application/json',
  gherkin:  'text/plain',
  jira:     'text/plain',
  linear:   'text/markdown',
};

const EXTENSION: Record<ExportFormat, string> = {
  markdown: 'md',
  csv:      'csv',
  json:     'json',
  gherkin:  'feature',
  jira:     'txt',
  linear:   'md',
};

export function exportSuite(suite: TestSuiteOutput, format: ExportFormat, projectName = 'project'): void {
  const content   = CONVERTERS[format](suite);
  const mime      = MIME[format];
  const ext       = EXTENSION[format];
  const fileName  = `${projectName.toLowerCase().replace(/\s+/g, '-')}-tests.${ext}`;

  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** Returns the formatted string without downloading (for copy-to-clipboard). */
export function formatSuite(suite: TestSuiteOutput, format: ExportFormat): string {
  return CONVERTERS[format](suite);
}

/** Build a zip-like bundle of all formats as a JSON manifest. */
export function buildExportBundle(suite: TestSuiteOutput): Record<ExportFormat, string> {
  const result = {} as Record<ExportFormat, string>;
  for (const [fmt, fn] of Object.entries(CONVERTERS)) {
    result[fmt as ExportFormat] = fn(suite);
  }
  return result;
}

// Re-export TestCase for convenience
export type { TestCase };
