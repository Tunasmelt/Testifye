import { generateObject } from 'ai';
import type { ZodSchema } from 'zod';
import { getModel, type ModelKey } from './providers';

interface GenerateOptions<T> {
  schema: ZodSchema<T>;
  prompt: string;
  system?: string;
  temperature?: number;
  /** When true, allow falling back to Google AI if GROQ rate-limits */
  allowGoogleFallback?: boolean;
}

interface GenerateResult<T> {
  result: T;
  provider: string;
  model: string;
  modelKey: ModelKey;
}

/**
 * Calls generateObject with automatic GROQ → Google AI fallback on 429.
 * All AI logic in this file — NEVER import generateObject directly in route handlers.
 */
export async function generateWithFallback<T>(
  modelKey: ModelKey,
  options: GenerateOptions<T>,
): Promise<GenerateResult<T>> {
  const { schema, prompt, system, temperature = 0.3, allowGoogleFallback = false } = options;

  // Try GROQ first
  try {
    const model = getModel(modelKey, false);
    const { object } = await generateObject({
      model,
      schema,
      prompt,
      system,
      temperature,
    });
    return { result: object, provider: 'groq', model: model.modelId, modelKey };
  } catch (err: unknown) {
    const isRateLimit = err instanceof Error && (
      err.message.includes('429') ||
      err.message.toLowerCase().includes('rate limit') ||
      err.message.toLowerCase().includes('too many requests')
    );

    if (!isRateLimit) throw err;
    if (!allowGoogleFallback) throw err;
  }

  // Fallback: Google AI
  console.warn(`[AI] GROQ rate-limited for ${modelKey}, falling back to Google AI`);
  const googleModel = getModel(modelKey, true);
  const { object } = await generateObject({
    model: googleModel,
    schema,
    prompt,
    system,
    temperature,
  });
  return { result: object, provider: 'google', model: googleModel.modelId, modelKey };
}
