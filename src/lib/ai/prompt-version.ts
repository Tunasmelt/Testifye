/**
 * Prompt versioning — Task 3.6
 *
 * Bump PROMPT_VERSION when any system prompt changes in a way that would
 * materially affect output quality/schema.  Old artifacts with a lower version
 * are considered "stale" and surfaced to the user with a re-generate option.
 *
 * Convention: "YYYY-MM-DD.n" where n is a daily patch counter (1-based).
 */

export const PROMPT_VERSION = '2026-05-25.1';

/**
 * Minimum version still considered fresh.
 * Artifacts at or above this version are NOT shown the re-generate nudge.
 * Bump this (not PROMPT_VERSION) only when a prompt change materially affects
 * output quality or schema — minor wording tweaks do not warrant a bump.
 *
 * NOTE: PROMPT_VERSION and MIN_FRESH_VERSION start equal; bump MIN_FRESH_VERSION
 * independently when you want to invalidate existing artifacts.
 */
export const MIN_FRESH_VERSION = '2026-05-25.1';

/**
 * Compares two "YYYY-MM-DD.n" version strings numerically.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 * Handles any patch number (1, 2, … 10, 11 …) correctly unlike raw `<` comparison.
 */
export function compareVersions(a: string, b: string): number {
  // Split on the last '.' to separate date portion from patch number
  const splitVersion = (v: string) => {
    const lastDot = v.lastIndexOf('.');
    if (lastDot === -1) return [v, '0'];
    return [v.slice(0, lastDot), v.slice(lastDot + 1)];
  };

  const [aDate, aPatch] = splitVersion(a);
  const [bDate, bPatch] = splitVersion(b);

  // Date portion is YYYY-MM-DD — lexicographic sort is correct for ISO dates
  if (aDate !== bDate) return aDate < bDate ? -1 : 1;

  // Patch portion must be numeric
  return Number(aPatch) - Number(bPatch);
}

/**
 * Returns true when an artifact was generated with an older prompt version
 * and should show the re-generate nudge.
 */
export function isStale(artifactPromptVersion: string | null | undefined): boolean {
  if (!artifactPromptVersion) return true; // pre-versioning artifact is always stale
  return compareVersions(artifactPromptVersion, MIN_FRESH_VERSION) < 0;
}
