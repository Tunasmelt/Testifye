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
  const esc = (v: string | number | boolean) =>
    `"${String(v).replace(/"/g, '""')}"`;
  const headers = ['TC ID', 'Title', 'Category', 'Priority', 'Screen', 'Steps', 'Preconditions', 'Verified'];
  const rows = suite.test_cases.map((tc) => [
    esc(tc.tc_id),
    esc(tc.title),
    esc(tc.category),
    esc(tc.priority),
    esc(tc.screen_label ?? ''),
    esc(tc.step_count),
    esc(tc.preconditions ?? ''),
    esc(tc.is_verified ? 'yes' : 'no'),
  ]);
  return [headers.map(esc).join(','), ...rows.map((r) => r.join(','))].join('\n');
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
    // Given
    if (tc.preconditions) {
      lines.push(`    Given ${tc.preconditions}`);
    } else {
      lines.push(`    Given the application is in a valid state`);
    }
    // When — all actions first
    for (const [idx, step] of tc.steps.entries()) {
      lines.push(`    ${idx === 0 ? 'When' : 'And'} ${step.action}`);
    }
    // Then — all expected results after
    for (const [idx, step] of tc.steps.entries()) {
      lines.push(`    ${idx === 0 ? 'Then' : 'And'} ${step.expected_result}`);
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
  // Normalise to ASCII: decompose unicode, strip combining marks, replace unsafe chars
  const safeName = projectName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')        // replace non-alphanumeric runs with hyphen
    .replace(/^-+|-+$/g, '')            // trim leading/trailing hyphens
    || 'project';
  const fileName  = `${safeName}-tests.${ext}`;

  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  // Must be in DOM before .click() for Firefox compatibility
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
