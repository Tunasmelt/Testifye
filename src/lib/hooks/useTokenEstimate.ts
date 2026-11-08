/**
 * Fetches a pre-generation token estimate for budget awareness (Task 3.7).
 * Only fetches when the project has screens (hasScreens guard on the server too).
 * Returns null while loading or when screens are not yet available.
 */
import { useState, useEffect } from 'react';

interface EstimateResult {
  estimatedTokens: number;
  hasScreens: boolean;
}

export function useTokenEstimate(projectId: string, featureType: 'test_suite' | 'ux_review') {
  const [estimate, setEstimate] = useState<number | null>(null);
  const [hasScreens, setHasScreens] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEstimate(null);
    setHasScreens(null);

    fetch('/api/generate/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, featureType }),
    })
      .then((r) => (r.ok ? r.json() as Promise<EstimateResult> : null))
      .then((d) => {
        if (cancelled || !d) return;
        setHasScreens(d.hasScreens);
        // Only set estimate when > 0 (hasScreens && real context exists)
        if (d.estimatedTokens > 0) setEstimate(d.estimatedTokens);
      })
      .catch(() => null);

    return () => { cancelled = true; };
  }, [projectId, featureType]);

  return { estimate, hasScreens };
}
