import { generateObject } from 'ai';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateWithFallback } from './generate-with-fallback';
import { streamWithFallback } from './stream-with-fallback';
import { buildFullContext } from './context-budget';
import { getModel, FEATURE_MODEL_MAP } from './providers';
import { SCOUT_SYSTEM_PROMPT } from './prompts/scout';
import { buildGeneratorPrompt } from './prompts/generator';
import { JUDGE_SYSTEM_PROMPT } from './prompts/judge';
import { ScreenElementMapSchema, type ScreenElementMap } from '@/lib/schemas/screen-element-map';
import { TestSuiteOutputSchema, type TestSuiteOutput } from '@/lib/schemas/test-case';
import type { Project, GeneratedArtifact } from '@/lib/supabase/types';

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

  const { result, provider, model } = await generateWithFallback(
    'vision_scout',
    {
      schema: ScreenElementMapSchema,
      system: SCOUT_SYSTEM_PROMPT,
      prompt: 'Analyze this screenshot and produce a ScreenElementMap.',
      allowGoogleFallback,
    },
  );

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
    is_verified: true,
    status: 'complete',
  });

  // Mark asset as verified
  await supabase
    .from('project_assets')
    .update({ is_verified: true, metadata: { vision_map_status: 'ready' } })
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
}

export async function streamTestCases(opts: GeneratorOptions) {
  const {
    project,
    focusAreas,
    artifacts,
    screenMaps,
    allowGoogleFallback = false,
    resumeFrom,
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

  const { result } = await generateWithFallback('fast_format', {
    schema: TestSuiteOutputSchema,
    prompt: judgePrompt,
    allowGoogleFallback,
  });

  return result;
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

// Unused import guard for generateObject — it's used in runJudge via generateWithFallback
void generateObject;
void getModel;
