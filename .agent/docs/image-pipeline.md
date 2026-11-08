# Image Pipeline
Last updated: 2026-11-08

## Overview
Browser-side compress → hash → IndexedDB cache → server upload, with exact (SHA-256) and perceptual (pHash) dedup, then Shadow Scout analysis in the background. Images are compressed to ≤150 KB WebP before storage.

## Key files
- `src/lib/utils/compression.ts` — `compressImage` (browser-image-compression; `maxSizeMB 0.15`, webp, quality 0.75, max 1920px), `blobToArrayBuffer`
- `src/lib/utils/hash.ts` — `computeSHA256`, `computePerceptualHash` (8×8 grayscale canvas mean-threshold → 16-hex; returns `''` outside the browser), `hammingDistance`, `SIMILAR_THRESHOLD = 10`
- `src/lib/services/asset.service.ts` — `cacheToIDB`, `getFromIDB`, `checkDuplicate`, `uploadAsset`, `getSignedUrl` (client module, `idb-keyval`)
- `src/components/project/AssetUploader.tsx` — drag/drop UI, 25 MB raw limit, pre-flight dedup, similar-image confirm
- `src/components/project/ScreenThumbnail.tsx` — thumbnail with dirty indicator and inline label edit
- `src/app/api/assets/upload/route.ts` — validates (≤200 KB), server-side exact dedup, Storage upload, DB insert, schedules Shadow Scout
- `src/app/api/assets/signed-url/route.ts` — signed URL (60 s TTL)
- `src/app/api/assets/[assetId]/route.ts` — PATCH label (`metadata.label`)

## Upload flow (actual)
1. `AssetUploader` compresses the file, computes SHA-256 + pHash **of the compressed blob**, and runs `checkDuplicate` against existing assets: exact hash → error; Hamming distance ≤ 10 → “looks similar… Upload anyway?” confirmation.
2. `uploadAsset`: compress → hash → `cacheToIDB(sha256, pHash, blob)` (non-fatal) → POST multipart (`file`, `project_id`, `sha256`, `pHash`, `original_name`, `label`).
3. Route: ownership check → exact-hash DB dedup (`fromCache: true`) → upload to bucket **`project-assets`** at `{user_id}/{project_id}/{sha256}.webp` → insert `project_assets` (`is_dirty: true`, `is_verified: false`, `metadata.vision_map_status: 'pending'`).
4. `after()` from `next/server` runs Shadow Scout (`runScout`) with a 1-hour signed URL; on failure sets `metadata.vision_map_status = 'failed'`. Success sets `is_verified = true`, status `'ready'`.

## Gotchas
- Compression happens BEFORE hashing; both hashes are of the compressed WebP (not the original). Older docs said pHash used the original.
- IDB entries (`tf:asset:{sha256}`) are written but **never read or cleared**; no code calls `getFromIDB` or deletes entries. IDB is only a write-through cache today.
- Signed URL TTL: 60 s for UI fetches (`/api/assets/signed-url`), 3600 s only for the Scout call. Never use public URLs (private bucket).
- Upload route limit is 200 KB; the 150 KB compression target leaves headroom.
- `is_dirty` is set `true` on upload and set `true` for all assets when project `description`/`scope` actually change (`PATCH /api/projects/[projectId]/settings`). **Nothing ever resets it to `false`** — the Overview “Re-analyze” button only links to the test-cases page, and `runScout`'s `force` option is never passed. Re-analysis after context change is therefore not implemented; the dirty banner persists.
- Pending/failed Scout state lives in `metadata.vision_map_status`, not a column.
- Migration 003 scopes the trigger's `vision_map` `is_latest` flip per `asset_id`, so each screenshot keeps its own latest map (fixed; **migration 003 must still be applied to the live DB**, not yet applied or tested). Before 003 the trigger flipped per `(project_id, artifact_type)` and hid earlier screens' maps from generators (see database.md).

## Do not
- Upload uncompressed images or skip the SHA-256 dedup.
- Load screenshots from Storage without a signed URL.
- Treat IndexedDB as a source of truth.
