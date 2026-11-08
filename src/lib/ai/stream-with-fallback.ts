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

function isRateLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit');
}

/**
 * Streams a structured object with GROQ → Google AI fallback on 429.
 *
 * NOTE: streamObject() from the AI SDK returns immediately without throwing —
 * errors are deferred until the stream is consumed. To detect rate-limit errors
 * early we do a first-chunk probe: we request the partialObjectStream, peek at
 * the first chunk, and if it throws with a 429 we fall back to Google.
 */
export async function streamWithFallback<T>(
  modelKey: ModelKey,
  options: StreamOptions<T>,
) {
  const { schema, prompt, system, temperature = 0.4, allowGoogleFallback = false, onFinish } = options;

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

  const groqModel = getModel(modelKey, false);
  const stream = streamObject(buildOpts(groqModel) as any); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Probe the first chunk to detect immediate rate-limit errors.
  // If the stream throws synchronously (some SDK versions) or on first read, catch it here.
  if (allowGoogleFallback) {
    try {
      // Trigger error materialisation — if the model rejected immediately this throws.
      // Always release the reader after the probe so the stream is not left locked.
      const probeReader = stream.partialObjectStream.getReader();
      await probeReader.read().then(
        () => { /* first chunk read OK — stream is live */ },
        (err: unknown) => { throw err; }       // propagate read error
      ).catch((err: unknown) => { throw err; });
      probeReader.releaseLock();
    } catch (err: unknown) {
      if (!isRateLimitError(err)) throw err;   // non-429: re-throw

      console.warn(`[AI] GROQ rate-limited for ${modelKey}, falling back to Google AI`);
      const googleModel = getModel(modelKey, true);
      return {
        stream: streamObject(buildOpts(googleModel) as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        provider: 'google' as const,
        model: googleModel.modelId,
        estimatedTokens: 0,
      };
    }
  }

  return {
    stream,
    provider: 'groq' as const,
    model: groqModel.modelId,
    estimatedTokens: 0,
  };
}
