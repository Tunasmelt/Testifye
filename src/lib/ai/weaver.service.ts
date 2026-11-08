import { createAdminClient } from '@/lib/supabase/admin';
import { generateWithFallback } from './generate-with-fallback';
import { streamWithFallback } from './stream-with-fallback';
import { buildFullContext } from './context-budget';
import { getModel, FEATURE_MODEL_MAP } from './providers';
import { SCOUT_SYSTEM_PROMPT } from './prompts/scout';
import { buildGeneratorPrompt } from './prompts/generator';
import { JUDGE_SYSTEM_PROMPT } from './prompts/judge';
import { UX_AUDITOR_SYSTEM_PROMPT, buildUXAuditorPrompt } from './prompts/ux-auditor';
import { BUG_REPORT_SYSTEM_PROMPT, buildBugReportPrompt } from './prompts/bug-report';
import { GAP_ANALYSIS_SYSTEM_PROMPT, buildGapAnalysisPrompt } from './prompts/gap-analysis';
import { SEMANTIC_LINK_SYSTEM_PROMPT, buildSemanticLinkPrompt } from './prompts/semantic-link';
import { TEST_DATA_SYSTEM_PROMPT, buildTestDataPrompt } from './prompts/test-data';
import { PERSONA_FRICTION_SYSTEM_PROMPT, buildPersonaFrictionPrompt } from './prompts/persona-friction';
import { I18N_AUDIT_SYSTEM_PROMPT, buildI18nAuditPrompt } from './prompts/i18n-audit';
import { ScreenElementMapSchema, type ScreenElementMap } from '@/lib/schemas/screen-element-map';
import { TestSuiteOutputSchema, type TestSuiteOutput } from '@/lib/schemas/test-case';
import { UXReviewOutputSchema, type UXReviewOutput } from '@/lib/schemas/ux-review';
import { BugReportSchema, type BugReport } from '@/lib/schemas/bug-report';
import { GapAnalysisOutputSchema, type GapAnalysisOutput } from '@/lib/schemas/gap-analysis';
import { SemanticLinkOutputSchema, type SemanticLinkOutput } from '@/lib/schemas/semantic-link';
import { TestDataOutputSchema, type TestDataOutput } from '@/lib/schemas/test-data';
import { PersonaFrictionOutputSchema, type PersonaFrictionOutput } from '@/lib/schemas/persona-friction';
import { I18nAuditOutputSchema, type I18nAuditOutput } from '@/lib/schemas/i18n-audit';
import type { Project, GeneratedArtifact } from '@/lib/supabase/types';
import { PROMPT_VERSION } from './prompt-version';

// ── SCOUT ─────────────────────────────────────────────────────────────────────

interface ScoutOptions {
  projectId: string;
  userId: string;
  assetId: string;
  /** Base64 data URL or HTTPS URL */
  imageUrl: string;
  /** If true, re-run even if a cached result exists */
  force?: boolean;
  allowGoogleFallback?: boolean;
}

export async function runScout(opts: ScoutOptions): Promise<ScreenElementMap> {
  const { projectId, userId, assetId, imageUrl, force = false, allowGoogleFallback = false } = opts;
  const supabase = createAdminClient();

  // Check cache unless forced
  if (!force) {
    const { data: cached } = await supabase
      .from('generated_artifacts')
      .select('content')
      .eq('project_id', projectId)
      .eq('artifact_type', 'vision_map')
      .eq('is_latest', true)
      .contains('input_snapshot', { asset_id: assetId })
      .maybeSingle();

    if (cached?.content) {
      return cached.content as ScreenElementMap;
    }
  }

  const startMs = Date.now();

  // Build multimodal message so the model actually sees the image
  const imageContent: Parameters<typeof generateWithFallback>[1]['messages'] = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          ...(imageUrl.startsWith('data:')
            ? { image: imageUrl }
            : { image: new URL(imageUrl) }),
        },
        {
          type: 'text',
          text: 'Analyze this screenshot and produce a ScreenElementMap.',
        },
      ],
    },
  ];

  const { result, provider, model } = await generateWithFallback<ScreenElementMap>(
    'vision_scout',
    {
      schema: ScreenElementMapSchema,
      system: SCOUT_SYSTEM_PROMPT,
      messages: imageContent,
      allowGoogleFallback,
    },
  );

  // Flip previous vision_map for this specific asset to non-latest
  await supabase.from('generated_artifacts')
    .update({ is_latest: false })
    .eq('project_id', projectId)
    .eq('artifact_type', 'vision_map')
    .contains('input_snapshot', { asset_id: assetId });

  // Persist artifact
  await supabase.from('generated_artifacts').insert({
    project_id: projectId,
    user_id: userId,
    artifact_type: 'vision_map',
    content: result,
    input_snapshot: { asset_id: assetId, image_url: imageUrl },
    model_used: model,
    provider,
    generation_time_ms: Date.now() - startMs,
    prompt_version: PROMPT_VERSION,
    is_verified: true,
    is_latest: true,
    status: 'complete',
  });

  // Mark asset as verified — merge into existing metadata to preserve label/dimensions/etc.
  const { data: currentAsset } = await supabase
    .from('project_assets').select('metadata').eq('id', assetId).maybeSingle();
  const mergedMeta = { ...(currentAsset?.metadata as Record<string, unknown> ?? {}), vision_map_status: 'ready' };
  await supabase
    .from('project_assets')
    .update({ is_verified: true, metadata: mergedMeta })
    .eq('id', assetId);

  return result;
}

// ── GENERATOR (streaming) ─────────────────────────────────────────────────────

interface GeneratorOptions {
  project: Project;
  focusAreas?: string[];
  artifacts: GeneratedArtifact[];
  screenMaps: ScreenElementMap[];
  userId: string;
  allowGoogleFallback?: boolean;
  resumeFrom?: number;
  /** True when no screen maps exist — injects a warning into the user message */
  noScreensWarning?: boolean;
}

export async function streamTestCases(opts: GeneratorOptions) {
  const {
    project,
    focusAreas,
    artifacts,
    screenMaps,
    allowGoogleFallback = false,
    resumeFrom,
    noScreensWarning = false,
  } = opts;

  const modelKey = FEATURE_MODEL_MAP.test_suite.generator;
  const role = project.user_role ?? 'manual_tester';
  const systemPrompt = buildGeneratorPrompt('test cases', role);

  const ctx = await buildFullContext({
    project,
    screenMaps,
    artifacts,
    featureType: 'test_suite',
    systemPrompt,
    userMessage: [
      noScreensWarning
        ? 'NOTE: No screen analysis available for this project. Generate test cases from the project description only. Mark any UI element references as ASSUMPTIONS.'
        : '',
      focusAreas?.length
        ? `Focus areas: ${focusAreas.join(', ')}.`
        : 'Cover all relevant test areas.',
      resumeFrom ? `Continue from TC-${String(resumeFrom).padStart(3, '0')}. Generate the remaining test cases only.` : '',
    ].filter(Boolean).join(' '),
  });

  const { stream, provider, model } = await streamWithFallback(modelKey, {
    schema: TestSuiteOutputSchema,
    system: ctx.systemPrompt,
    prompt: `${ctx.contextBlock}\n\nUser request: ${ctx.userMessage}`,
    allowGoogleFallback,
  });

  return { stream, provider, model, estimatedTokens: ctx.estimatedTokens };
}

// ── JUDGE ─────────────────────────────────────────────────────────────────────

export async function runJudge(
  artifact: TestSuiteOutput,
  screenMaps: ScreenElementMap[],
  allowGoogleFallback = false,
): Promise<TestSuiteOutput> {
  const judgePrompt = [
    JUDGE_SYSTEM_PROMPT,
    '\n\n=== Artifact to verify ===\n',
    JSON.stringify(artifact, null, 2),
    '\n\n=== ScreenElementMaps ===\n',
    JSON.stringify(screenMaps, null, 2),
  ].join('');

  const { result } = await generateWithFallback<TestSuiteOutput>('fast_format', {
    schema: TestSuiteOutputSchema,
    prompt: judgePrompt,
    allowGoogleFallback,
  });

  return result;
}

// ── UX AUDITOR (streaming) ────────────────────────────────────────────────────

interface UXAuditOptions {
  project: Project;
  screenMaps: ScreenElementMap[];
  artifacts: GeneratedArtifact[];
  userId: string;
  auditFocus?: string;
  /** Pre-computed screen metrics string (from canvas analysis) */
  screenMetricsSummary?: string;
  allowGoogleFallback?: boolean;
}

export async function streamUXAudit(opts: UXAuditOptions) {
  const {
    project,
    screenMaps,
    artifacts,
    auditFocus = 'Full Audit',
    screenMetricsSummary,
    allowGoogleFallback = false,
  } = opts;

  const modelKey = FEATURE_MODEL_MAP.ux_review.generator;
  const systemPrompt = UX_AUDITOR_SYSTEM_PROMPT;
  // Inject single-screen limitation note per SCOPE.md edge case
  const singleScreenNote = screenMaps.length === 1;
  const userPrompt = buildUXAuditorPrompt(auditFocus, screenMetricsSummary, singleScreenNote);

  const ctx = await buildFullContext({
    project,
    screenMaps,
    artifacts,
    featureType: 'ux_review',
    systemPrompt,
    userMessage: userPrompt,
  });

  const { stream, provider, model } = await streamWithFallback(modelKey, {
    schema: UXReviewOutputSchema,
    system: ctx.systemPrompt,
    prompt: `${ctx.contextBlock}\n\nAudit request: ${ctx.userMessage}`,
    allowGoogleFallback,
  });

  return { stream, provider, model, estimatedTokens: ctx.estimatedTokens };
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Fetch the latest ScreenElementMaps for all verified assets in a project */
export async function getProjectScreenMaps(projectId: string): Promise<ScreenElementMap[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('generated_artifacts')
    .select('content')
    .eq('project_id', projectId)
    .eq('artifact_type', 'vision_map')
    .eq('is_latest', true)
    .eq('status', 'complete');

  return (data ?? []).map((row) => row.content as ScreenElementMap);
}

/** Fetch all latest artifacts for context budget assembly */
export async function getProjectArtifacts(projectId: string): Promise<GeneratedArtifact[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('generated_artifacts')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_latest', true)
    .order('created_at', { ascending: false });

  return (data ?? []) as GeneratedArtifact[];
}

// ── BUG REPORT (non-streaming, fast) ─────────────────────────────────────────

interface BugReportOptions {
  description: string;
  bugIndex?: number;           // for BUG-001, BUG-002 numbering
  platform?: string;
  os?: string;
  browser?: string;
  appVersion?: string;
  component?: string;
  allowGoogleFallback?: boolean;
}

export async function generateBugReport(opts: BugReportOptions): Promise<{ report: BugReport; provider: string; model: string }> {
  const { description, bugIndex = 1, allowGoogleFallback = false, ...context } = opts;
  const prompt = buildBugReportPrompt(description, context);

  const { result, provider, model } = await generateWithFallback<BugReport>(
    FEATURE_MODEL_MAP.bug_report.generator,
    {
      schema: BugReportSchema,
      system: BUG_REPORT_SYSTEM_PROMPT,
      prompt,
      allowGoogleFallback,
    },
  );

  // Renumber bug_id sequentially
  result.bug_id = `BUG-${String(bugIndex).padStart(3, '0')}`;
  return { report: result, provider, model };
}

// ── GAP ANALYSIS ──────────────────────────────────────────────────────────────

export interface GapAnalysisOptions {
  projectId:           string;
  userId:              string;
  prdText:             string;
  allowGoogleFallback?: boolean;
}

export async function generateGapAnalysis(
  opts: GapAnalysisOptions,
): Promise<{ analysis: GapAnalysisOutput; provider: string; model: string }> {
  const { projectId, userId, prdText, allowGoogleFallback = false } = opts;

  const screenMaps = await getProjectScreenMaps(projectId);
  const mapSummary = screenMaps.map((m) => ({
    screen_label: m.screen_label,
    elements: (m.elements ?? []).map((e: { label: string; type: string; inferred_function?: string }) => ({ label: e.label, type: e.type, inferred_function: e.inferred_function })),
  }));

  const prompt = buildGapAnalysisPrompt(prdText, mapSummary);

  const { result, provider, model } = await generateWithFallback<GapAnalysisOutput>(
    FEATURE_MODEL_MAP.gap_analysis.generator,
    {
      schema: GapAnalysisOutputSchema,
      system: GAP_ANALYSIS_SYSTEM_PROMPT,
      prompt,
      allowGoogleFallback,
    },
  );

  return { analysis: result, provider, model };
}

// ── SEMANTIC LINK ─────────────────────────────────────────────────────────────

export interface SemanticLinkOptions {
  projectId:           string;
  userId:              string;
  prdText:             string;
  allowGoogleFallback?: boolean;
}

export async function generateSemanticLink(
  opts: SemanticLinkOptions,
): Promise<{ output: SemanticLinkOutput; provider: string; model: string }> {
  const { projectId, prdText, allowGoogleFallback = false } = opts;

  const screenMaps = await getProjectScreenMaps(projectId);
  const mapSummary = screenMaps.map((m) => ({
    screen_label: m.screen_label,
    elements: (m.elements ?? []).map((e: { label: string; type: string; inferred_function: string }) => ({
      label: e.label, type: e.type, inferred_function: e.inferred_function,
    })),
  }));

  const prompt = buildSemanticLinkPrompt(prdText, mapSummary);

  const { result, provider, model } = await generateWithFallback<SemanticLinkOutput>(
    FEATURE_MODEL_MAP.semantic_link.generator,
    {
      schema: SemanticLinkOutputSchema,
      system: SEMANTIC_LINK_SYSTEM_PROMPT,
      prompt,
      allowGoogleFallback,
    },
  );

  return { output: result, provider, model };
}

// ── TEST DATA GENERATOR ───────────────────────────────────────────────────────

export interface TestDataOptions {
  projectId:           string;
  userId:              string;
  projectDescription:  string;
  datasetCount?:       number;
  allowGoogleFallback?: boolean;
}

export async function generateTestData(
  opts: TestDataOptions,
): Promise<{ data: TestDataOutput; provider: string; model: string }> {
  const { projectId, userId, projectDescription, datasetCount = 5, allowGoogleFallback = false } = opts;

  const screenMaps = await getProjectScreenMaps(projectId);
  const mapSummary = screenMaps.map((m) => ({
    screen_label: m.screen_label,
    elements: (m.elements ?? []).map((e: { label: string; type: string; inferred_function: string }) => ({
      label: e.label, type: e.type, inferred_function: e.inferred_function,
    })),
  }));

  const prompt = buildTestDataPrompt(projectDescription, mapSummary, datasetCount);

  const { result, provider, model } = await generateWithFallback<TestDataOutput>(
    FEATURE_MODEL_MAP.test_data.generator,
    {
      schema: TestDataOutputSchema,
      system: TEST_DATA_SYSTEM_PROMPT,
      prompt,
      allowGoogleFallback,
    },
  );

  return { data: result, provider, model };
}

// ── PERSONA FRICTION (streaming) ──────────────────────────────────────────────

interface PersonaFrictionOptions {
  project: Project;
  screenMaps: ScreenElementMap[];
  artifacts: GeneratedArtifact[];
  userId: string;
  selectedPersonas: string[];
  allowGoogleFallback?: boolean;
}

export async function streamPersonaFriction(opts: PersonaFrictionOptions) {
  const {
    project,
    screenMaps,
    artifacts,
    selectedPersonas,
    allowGoogleFallback = false,
  } = opts;

  const modelKey    = FEATURE_MODEL_MAP.persona_friction.generator;
  const systemPrompt = PERSONA_FRICTION_SYSTEM_PROMPT;
  const userPrompt   = buildPersonaFrictionPrompt(selectedPersonas);

  const ctx = await buildFullContext({
    project,
    screenMaps,
    artifacts,
    featureType: 'persona_friction',
    systemPrompt,
    userMessage: userPrompt,
  });

  const { stream, provider, model } = await streamWithFallback(modelKey, {
    schema: PersonaFrictionOutputSchema,
    system: ctx.systemPrompt,
    prompt: `${ctx.contextBlock}\n\nAnalysis request: ${ctx.userMessage}`,
    allowGoogleFallback,
  });

  return { stream, provider, model, estimatedTokens: ctx.estimatedTokens };
}

// ── i18n AUDIT (streaming) ────────────────────────────────────────────────────

interface I18nAuditOptions {
  project: Project;
  screenMaps: ScreenElementMap[];
  artifacts: GeneratedArtifact[];
  userId: string;
  targetLocales?: string[];
  allowGoogleFallback?: boolean;
}

export async function streamI18nAudit(opts: I18nAuditOptions) {
  const {
    project,
    screenMaps,
    artifacts,
    targetLocales,
    allowGoogleFallback = false,
  } = opts;

  const modelKey     = FEATURE_MODEL_MAP.i18n_audit.generator;
  const systemPrompt = I18N_AUDIT_SYSTEM_PROMPT;
  const userPrompt   = buildI18nAuditPrompt(targetLocales);

  const ctx = await buildFullContext({
    project,
    screenMaps,
    artifacts,
    featureType: 'i18n_audit',
    systemPrompt,
    userMessage: userPrompt,
  });

  const { stream, provider, model } = await streamWithFallback(modelKey, {
    schema: I18nAuditOutputSchema,
    system: ctx.systemPrompt,
    prompt: `${ctx.contextBlock}\n\nAudit request: ${ctx.userMessage}`,
    allowGoogleFallback,
  });

  return { stream, provider, model, estimatedTokens: ctx.estimatedTokens };
}

