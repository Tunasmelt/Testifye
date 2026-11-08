/**
 * Checks whether the latest artifact of a given type is stale (prompt version behind current).
 * Used to surface "Re-generate with latest prompts" nudge — Task 3.6.
 */
import { useState, useEffect } from 'react';

interface StaleResult {
  stale: boolean;
  exists: boolean;
}

export function useStaleArtifact(
  projectId: string,
  artifactType: string,
  /** Re-check after generation completes by incrementing this counter */
  refreshKey = 0,
) {
  const [result, setResult] = useState<StaleResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);

    fetch(`/api/artifacts/stale?projectId=${encodeURIComponent(projectId)}&artifactType=${encodeURIComponent(artifactType)}`)
      .then((r) => (r.ok ? r.json() as Promise<StaleResult> : null))
      .then((d) => { if (!cancelled && d) setResult(d); })
      .catch(() => null);

    return () => { cancelled = true; };
  }, [projectId, artifactType, refreshKey]);

  return result;
}
