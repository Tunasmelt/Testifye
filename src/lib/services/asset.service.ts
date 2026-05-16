/**
 * Asset service — browser-side layer of the image pipeline.
 *
 * Stages:
 *  1. Compress → ≤150 KB WebP
 *  2. Hash     → SHA-256 (exact) + pHash (perceptual)
 *  3. IDB      → IndexedDB cache (key = sha256)
 *  4. Promote  → Upload to Supabase Storage via route handler
 *
 * Server-side dedup happens in the route handler (checks DB for content_hash).
 */
'use client';

import { get, set } from 'idb-keyval';
import { computeSHA256, computePerceptualHash, hammingDistance, SIMILAR_THRESHOLD } from '@/lib/utils/hash';
import { compressImage, blobToArrayBuffer } from '@/lib/utils/compression';
import type { ProjectAsset } from '@/lib/supabase/types';

// ── IDB cache ─────────────────────────────────────────────────────────────────

const IDB_PREFIX = 'tf:asset:';

interface CachedAsset {
  sha256: string;
  pHash: string;
  blob: Blob;
  cachedAt: number;
}

/** Store a compressed asset blob in IndexedDB, keyed by SHA-256. */
export async function cacheToIDB(sha256: string, pHash: string, blob: Blob): Promise<void> {
  const entry: CachedAsset = { sha256, pHash, blob, cachedAt: Date.now() };
  await set(`${IDB_PREFIX}${sha256}`, entry);
}

/** Retrieve a cached blob from IndexedDB by SHA-256. Returns null if not found. */
export async function getFromIDB(sha256: string): Promise<CachedAsset | null> {
  return (await get<CachedAsset>(`${IDB_PREFIX}${sha256}`)) ?? null;
}

// ── Dedup checks ─────────────────────────────────────────────────────────────

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  /** Exact byte match */
  exactMatch?: ProjectAsset;
  /** Similar-looking image (pHash distance ≤ threshold) */
  similarMatch?: { asset: ProjectAsset; distance: number };
}

/**
 * Checks a list of existing project assets for exact or perceptual duplicates.
 * Pure client-side — no network call needed.
 */
export function checkDuplicate(
  sha256: string,
  pHash: string,
  existing: ProjectAsset[],
): DuplicateCheckResult {
  // Exact match via SHA-256
  const exactMatch = existing.find((a) => a.content_hash === sha256);
  if (exactMatch) return { isDuplicate: true, exactMatch };

  // Perceptual match via Hamming distance
  for (const asset of existing) {
    if (!asset.perceptual_hash) continue;
    try {
      const dist = hammingDistance(pHash, asset.perceptual_hash);
      if (dist <= SIMILAR_THRESHOLD) {
        return { isDuplicate: false, similarMatch: { asset, distance: dist } };
      }
    } catch {
      // Skip if hash lengths differ (old assets without pHash)
    }
  }

  return { isDuplicate: false };
}

// ── Full pipeline ─────────────────────────────────────────────────────────────

export interface UploadResult {
  asset: ProjectAsset;
  fromCache: boolean;
  sha256: string;
  pHash: string;
}

export interface UploadOptions {
  projectId: string;
  userId: string;
  file: File;
  label?: string;
  /** Called with 0–100 progress */
  onProgress?: (pct: number) => void;
}

/**
 * Full pipeline: compress → hash → IDB cache → server upload.
 * Returns the persisted ProjectAsset record from the server.
 */
export async function uploadAsset(opts: UploadOptions): Promise<UploadResult> {
  const { projectId, file, onProgress } = opts;

  onProgress?.(5);

  // 1. Compress
  const { blob } = await compressImage(file);
  onProgress?.(20);

  // 2. Hash
  const buffer = await blobToArrayBuffer(blob);
  const [sha256, pHash] = await Promise.all([
    computeSHA256(buffer),
    computePerceptualHash(blob),
  ]);
  onProgress?.(35);

  // 3. IDB cache (non-blocking — don't fail upload if IDB unavailable)
  try {
    await cacheToIDB(sha256, pHash, blob);
  } catch {
    // IDB unavailable (e.g. private browsing) — not fatal
  }
  onProgress?.(45);

  // 4. Send to server route handler
  const formData = new FormData();
  formData.append('file', new File([blob], file.name, { type: 'image/webp' }));
  formData.append('project_id', projectId);
  formData.append('sha256', sha256);
  formData.append('pHash', pHash);
  formData.append('original_name', file.name);
  if (opts.label) formData.append('label', opts.label);

  onProgress?.(50);

  const res = await fetch('/api/assets/upload', {
    method: 'POST',
    body: formData,
  });

  onProgress?.(90);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? `Upload failed: ${res.status}`);
  }

  const { asset, fromCache } = await res.json() as { asset: ProjectAsset; fromCache: boolean };
  onProgress?.(100);

  return { asset, fromCache, sha256, pHash };
}

// ── Signed URL helper ─────────────────────────────────────────────────────────

/**
 * Fetches a short-lived signed URL for a stored asset.
 * Uses the server route to avoid exposing the service key.
 */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const res = await fetch(`/api/assets/signed-url?path=${encodeURIComponent(storagePath)}`);
  if (!res.ok) throw new Error('Failed to fetch signed URL');
  const { url } = await res.json() as { url: string };
  return url;
}
