import { generateText } from 'ai';
import { getModel } from './providers';
import { buildContextSummaryPrompt } from './prompts/generator';
import type { Project, GeneratedArtifact } from '@/lib/supabase/types';
import type { ScreenElementMap } from '@/lib/schemas/screen-element-map';

// Token budget slots (max ~14K input tokens)
export const TOKEN_BUDGET = {
  system_prompt:      2_000,
  screen_maps:        5_000,
  active_artifact:    4_000,
  historical_summary: 2_000,
  user_message:       1_000,
  total:             14_000,
} as const;

/** Rough token estimator: ~4 chars per token */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Compresses older artifacts into a bullet-point summary via the 8B fast model.
 * Result is ≤ 2K tokens.
 */
export async function buildCompressedHistory(
  artifacts: GeneratedArtifact[],
  currentType: string,
): Promise<string> {
  // Separate current-type (full fidelity) from others (compress)
  const others = artifacts.filter(
    (a) => a.artifact_type !== currentType && a.is_latest
  );

  if (others.length === 0) return '';

  const raw = others
    .map((a) => `[${a.artifact_type}] ${JSON.stringify(a.content).slice(0, 2000)}`)
    .join('\n\n');

  const rawTokens = estimateTokens(raw);

  // If already under 2K, return as-is
  if (rawTokens <= TOKEN_BUDGET.historical_summary) return raw;

  // Otherwise compress via 8B model
  try {
    const model = getModel('fast_format');
    const { text } = await generateText({
      model,
      prompt: buildContextSummaryPrompt(raw),
      maxOutputTokens: 800,
    });
    return text;
  } catch {
    // If compression fails, return first 2K of raw
    return raw.slice(0, TOKEN_BUDGET.historical_summary * 4);
  }
}

export interface ContextPayload {
  systemPrompt: string;
  contextBlock: string;
  userMessage: string;
  estimatedTokens: number;
}

/**
 * Assembles the full context payload for a Generator call.
 * Respects the 14K token budget.
 */
export async function buildFullContext(opts: {
  project: Project;
  screenMaps: ScreenElementMap[];
  artifacts: GeneratedArtifact[];
  featureType: string;
  userMessage: string;
  systemPrompt: string;
}): Promise<ContextPayload> {
  const { project, screenMaps, artifacts, featureType, userMessage, systemPrompt } = opts;

  // Screen maps — truncate to budget
  let screenMapsBlock = screenMaps
    .map((m) => `Screen: "${m.screen_label}"\n${JSON.stringify(m, null, 2)}`)
    .join('\n\n---\n\n');

  if (estimateTokens(screenMapsBlock) > TOKEN_BUDGET.screen_maps) {
    // Truncate the JSON representation proportionally
    const maxChars = TOKEN_BUDGET.screen_maps * 4;
    screenMapsBlock = screenMapsBlock.slice(0, maxChars) + '\n... [truncated]';
  }

  // Historical summary
  const historySummary = await buildCompressedHistory(artifacts, featureType);

  // Active artifact (current type, latest)
  const activeArtifact = artifacts.find(
    (a) => a.artifact_type === featureType && a.is_latest
  );
  let activeBlock = activeArtifact
    ? `Previous ${featureType}:\n${JSON.stringify(activeArtifact.content, null, 2)}`
    : '';

  if (estimateTokens(activeBlock) > TOKEN_BUDGET.active_artifact) {
    activeBlock = activeBlock.slice(0, TOKEN_BUDGET.active_artifact * 4) + '\n... [truncated]';
  }

  // Assemble context block
  const contextBlock = [
    `Project: ${project.name}`,
    `Description: ${project.description}`,
    project.scope            ? `Scope: ${project.scope}` : '',
    project.target_audience  ? `Audience: ${project.target_audience}` : '',
    project.app_type         ? `App type: ${project.app_type}` : '',
    project.user_role        ? `Tester role: ${project.user_role}` : '',
    '',
    '=== Analyzed Screens ===',
    screenMapsBlock,
    activeBlock ? `\n=== Previous ${featureType} ===\n${activeBlock}` : '',
    historySummary ? `\n=== Project History Summary ===\n${historySummary}` : '',
  ].filter(Boolean).join('\n');

  const truncatedMessage = userMessage.slice(0, TOKEN_BUDGET.user_message * 4);

  const estimatedTokens =
    estimateTokens(systemPrompt) +
    estimateTokens(contextBlock) +
    estimateTokens(truncatedMessage);

  return {
    systemPrompt,
    contextBlock,
    userMessage: truncatedMessage,
    estimatedTokens,
  };
}
