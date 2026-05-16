# Image Pipeline
Last updated: 2026-05-09

## Overview
4-layer dual-hash pipeline: exact SHA-256 dedup → perceptual pHash similarity → IndexedDB cache → Supabase Storage promotion. All compressed to ≤150KB WebP before storage.

## Key files
- `src/lib/utils/hash.ts` — computeSHA256(), computePerceptualHash(), hammingDistance()
- `src/lib/utils/compression.ts` — compressImage() via browser-image-compression
- `src/lib/services/asset.service.ts` — checkDuplicate, checkSimilar, cacheToIDB, promoteToSupabase, getSignedUrl
- `src/components/project/AssetUploader.tsx` — drag-drop UI
- `src/components/project/ScreenThumbnail.tsx` — phone/browser frame thumbnail component
- `src/app/api/assets/upload/route.ts` — thin upload handler

## Patterns
- Upload flow: SHA256 hash → DB dedup check → pHash similarity check → compress → IDB cache → promote to Supabase Storage
- IDB key format: `{project_id}:{content_hash}`
- Storage path: `{user_id}/{project_id}/screenshots/{content_hash}.webp`
- Hamming distance threshold: < 10 = "similar image detected"
- Phase 2: `after()` from 'next/server' fires Shadow Scout after upload response

## Gotchas
- Compress BEFORE pHash check (pHash runs on original; compression is for storage only)
- IDB cache is cleared after promote — never treat IDB as the source of truth
- project_assets.is_dirty = true when project description/scope changes AFTER upload
- project_assets.is_verified = true once Scout has produced a valid ScreenElementMap for it

## Do not
- Upload raw uncompressed images to Supabase Storage
- Skip the SHA256 dedup check (causes duplicate DB rows)
- Load images directly from Supabase Storage in UI — always use signed URLs with 1hr TTL
