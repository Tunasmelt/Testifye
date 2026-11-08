/**
 * Pre-AI screen metrics — Task 2.2 (Phase 2)
 *
 * Extracts factual, deterministic data from screenshots BEFORE sending to AI.
 * These are injected into the UX Auditor prompt as facts, not AI opinions.
 *
 * Browser-only (Canvas API + extract-colors required).
 */
'use client';

import type { ScreenElementMap } from '@/lib/schemas/screen-element-map';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContrastResult {
  pair: string;
  ratio: number;
  passes_aa: boolean;
}

export interface ScreenMetrics {
  dominant_colors: string[];
  contrast_ratios: ContrastResult[];
  element_density: number;
  whitespace_ratio?: number;
}

// ── Dominant Colors ───────────────────────────────────────────────────────────

/**
 * Extracts up to 5 dominant colors from an image URL.
 * Uses extract-colors library; degrades gracefully in non-browser environments.
 */
export async function extractDominantColors(imageUrl: string): Promise<string[]> {
  if (typeof window === 'undefined') return [];
  try {
    const { extractColors } = await import('extract-colors');
    const colors = await extractColors(imageUrl, { pixels: 10000, distance: 0.2 });
    return colors
      .slice(0, 5)
      .map((c) => c.hex ?? (c as { value?: string }).value ?? '#000000');
  } catch {
    return [];
  }
}

// ── WCAG Contrast Ratios ──────────────────────────────────────────────────────

/** Converts a hex color string to sRGB luminance (0–1). */
function hexToLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const linearise = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** Computes WCAG 2.1 contrast ratio between two hex colors. */
function contrastRatio(hexA: string, hexB: string): number {
  const lumA = hexToLuminance(hexA);
  const lumB = hexToLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker  = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Computes contrast ratios for all pairs of dominant colors.
 * Pairs with ratio < 3:1 are likely text/background pairs worth flagging.
 */
export function computeContrastRatios(colors: string[]): ContrastResult[] {
  const results: ContrastResult[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      try {
        const ratio = contrastRatio(colors[i], colors[j]);
        results.push({
          pair:      `${colors[i]} / ${colors[j]}`,
          ratio:     Math.round(ratio * 100) / 100,
          passes_aa: ratio >= 4.5,
        });
      } catch {
        // Skip malformed color values
      }
    }
  }
  // Return only pairs with ratio < 7:1 (relevant range for text readability)
  return results.filter((r) => r.ratio < 7).sort((a, b) => a.ratio - b.ratio);
}

// ── Element Density ───────────────────────────────────────────────────────────

/**
 * Computes a rough element density score from a ScreenElementMap.
 * Higher = more crowded. Unitless normalised value (elements per "screen unit").
 */
export function computeElementDensity(visionMap: ScreenElementMap): number {
  const count = visionMap.elements?.length ?? 0;
  // Normalise: 0-10 scale where 10 = very dense (>40 elements)
  return Math.min(10, Math.round((count / 40) * 10 * 10) / 10);
}

// ── Full Metrics Pipeline ─────────────────────────────────────────────────────

/**
 * Runs the full pre-AI metrics pipeline for a single image + its vision map.
 * Returns metrics ready to be injected into the UX Auditor prompt.
 */
export async function computeScreenMetrics(
  imageUrl: string,
  visionMap: ScreenElementMap,
): Promise<ScreenMetrics> {
  const dominant_colors = await extractDominantColors(imageUrl);
  const contrast_ratios = computeContrastRatios(dominant_colors);
  const element_density = computeElementDensity(visionMap);

  return { dominant_colors, contrast_ratios, element_density };
}

/**
 * Formats screen metrics as a human-readable string for injection into AI prompts.
 */
export function formatScreenMetricsForPrompt(metrics: ScreenMetrics): string {
  const lines: string[] = [];

  if (metrics.dominant_colors.length > 0) {
    lines.push(`Dominant colors: ${metrics.dominant_colors.join(', ')}`);
  }

  if (metrics.contrast_ratios.length > 0) {
    const failing = metrics.contrast_ratios.filter((r) => !r.passes_aa);
    lines.push(`Contrast pairs analyzed: ${metrics.contrast_ratios.length}`);
    if (failing.length > 0) {
      lines.push(`Failing AA contrast (< 4.5:1): ${failing.map((r) => `${r.pair} = ${r.ratio}:1`).join('; ')}`);
    } else {
      lines.push('All analyzed color pairs pass WCAG AA contrast (≥ 4.5:1).');
    }
  }

  lines.push(`Element density score: ${metrics.element_density}/10 (${
    metrics.element_density >= 8 ? 'very dense' :
    metrics.element_density >= 5 ? 'moderate' : 'spacious'
  })`);

  return lines.join('\n');
}
