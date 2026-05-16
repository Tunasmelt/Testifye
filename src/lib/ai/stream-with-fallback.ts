import { streamObject, type LanguageModelUsage } from 'ai';
import { z } from 'zod';
import { getModel, type ModelKey } from './providers';

// AI SDK v6: StreamObjectOnFinishCallback expects { usage: LanguageModelUsage; object: T | undefined; ... }
type FinishCallback<T> = (event: {
  usage: LanguageModelUsage;
  object: T | undefined;
  error?: unknown;
}) => void | Promise<void>;

interface StreamOptions<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<T, any, any>;
  prompt: string;
  system?: string;
  temperature?: number;
  allowGoogleFallback?: boolean;
  onFinish?: FinishCallback<T>;
}

/**
 * Streams a structured object with GROQ → Google AI fallback on 429.
 */
export async function streamWithFallback<T>(
  modelKey: ModelKey,
  options: StreamOptions<T>,
) {
  const { schema, prompt, system, temperature = 0.4, allowGoogleFallback = false, onFinish } = options;

  // Build base options (avoid passing undefined to streamObject)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildOpts(model: any) {
    return {
      model,
      schema,
      prompt,
      temperature,
      ...(system   ? { system }   : {}),
      ...(onFinish ? { onFinish } : {}),
    };
  }

  try {
    const model = getModel(modelKey, false);
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stream: streamObject(buildOpts(model) as any),
      provider: 'groq' as const,
      model: model.modelId,
    };
  } catch (err: unknown) {
    const isRateLimit = err instanceof Error && (
      err.message.includes('429') ||
      err.message.toLowerCase().includes('rate limit')
    );
    if (!isRateLimit || !allowGoogleFallback) throw err;
  }

  console.warn(`[AI] GROQ rate-limited for ${modelKey}, streaming via Google AI`);
  const googleModel = getModel(modelKey, true);
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream: streamObject(buildOpts(googleModel) as any),
    provider: 'google' as const,
    model: googleModel.modelId,
  };
}
