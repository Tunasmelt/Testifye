import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// ── Model Registry ────────────────────────────────────────────────────────────
export const MODEL_REGISTRY = {
  vision_scout:    'meta-llama/llama-4-scout-17b-16e-instruct',
  reasoning_large: 'llama-3.3-70b-versatile',
  ux_narrative:    'meta-llama/llama-4-maverick-17b-128e-instruct',
  long_context:    'mixtral-8x7b-32768',
  fast_format:     'llama-3.1-8b-instant',
  quick_labels:    'gemma2-9b-it',
} as const;

export type ModelKey = keyof typeof MODEL_REGISTRY;

// ── Feature → Model Mapping ───────────────────────────────────────────────────
export const FEATURE_MODEL_MAP = {
  test_suite:        { scout: 'vision_scout', generator: 'reasoning_large', judge: 'fast_format' },
  ux_review:         { scout: 'vision_scout', generator: 'ux_narrative',    judge: 'fast_format' },
  bug_report:        { scout: null,           generator: 'fast_format',     judge: null          },
  gap_analysis:      { scout: null,           generator: 'long_context',    judge: null          },
  semantic_link:     { scout: 'vision_scout', generator: 'reasoning_large', judge: null          },
  test_data:         { scout: null,           generator: 'fast_format',     judge: null          },
  sidekick:          { scout: null,           generator: 'reasoning_large', judge: null          },
  persona_friction:  { scout: 'vision_scout', generator: 'reasoning_large', judge: 'fast_format' },
  i18n_audit:        { scout: 'vision_scout', generator: 'reasoning_large', judge: 'fast_format' },
} as const;

// ── Capability Chains ─────────────────────────────────────────────────────────
// Each entry is [primaryModel, fallbackModel]
export const FALLBACK_CHAINS = {
  vision:    ['vision_scout',    null             ] as [ModelKey, ModelKey | null],
  reasoning: ['reasoning_large', null             ] as [ModelKey, ModelKey | null],
  ux_review: ['ux_narrative',    'reasoning_large'] as [ModelKey, ModelKey | null],
  fast:      ['fast_format',     null             ] as [ModelKey, ModelKey | null],
  long:      ['long_context',    'reasoning_large'] as [ModelKey, ModelKey | null],
} as const;

export type ChainKey = keyof typeof FALLBACK_CHAINS;

// ── Provider Factories ────────────────────────────────────────────────────────
export function getGroqProvider() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set. Add it to .env.local.');
  return createGroq({ apiKey: key });
}

export function getGoogleProvider() {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY is not set. Add it to .env.local.');
  return createGoogleGenerativeAI({ apiKey: key });
}

/** Returns a Vercel AI SDK model instance for a given model key */
export function getModel(key: ModelKey, useGoogle = false) {
  if (useGoogle) {
    const google = getGoogleProvider();
    // Map our keys to Gemini equivalents
    const geminiMap: Record<ModelKey, string> = {
      vision_scout:    'gemini-2.0-flash',
      reasoning_large: 'gemini-2.0-flash',
      ux_narrative:    'gemini-2.0-flash',
      long_context:    'gemini-2.0-flash',
      fast_format:     'gemini-2.0-flash',
      quick_labels:    'gemini-2.0-flash',
    };
    return google(geminiMap[key]);
  }

  const groq = getGroqProvider();
  return groq(MODEL_REGISTRY[key]);
}
