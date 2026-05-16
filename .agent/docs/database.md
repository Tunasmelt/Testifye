# Database Schema
Last updated: 2026-05-09

## Overview
Supabase Postgres with RLS on every table. CQRS-inspired: `generated_artifacts` is the truth store (append-only rows), `projects.manifest_snapshot` is the JSONB read cache auto-synced by a Postgres trigger.

## Key files
- `SCHEMA.md` — all SQL DDL, Zod schemas, TypeScript interfaces (primary reference)
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — server client (cookies)
- `src/lib/supabase/admin.ts` — service role (bypasses RLS)
- `src/lib/schemas/*.ts` — Zod validation schemas

## Patterns
- Always use factory files (client.ts / server.ts / admin.ts) — never call createBrowserClient directly
- `server.ts` and `admin.ts` have `import 'server-only'`
- RLS: every table checks `auth.uid() = user_id`
- Trigger `on_artifact_insert` auto-sets is_latest=FALSE on older same-type artifacts and updates manifest_snapshot
- Storage bucket: `testifye-assets` (private), path: `{user_id}/{project_id}/screenshots/{hash}.webp`

## Gotchas
- `manifest_snapshot` is a READ CACHE ONLY — never query it for data integrity checks
- Enums are lowercase in Zod (severity: 'critical' not 'Critical')
- BugReport steps_to_reproduce is `string[]` (not objects with step_number)
- SemanticLink status enum: verified | missing | mismatch | untested (NOT linked | unverified | missing_ui | missing_prd)
- GapFinding has 7 `type` values including contradiction, untestable, undefined_error_state

## Do not
- Write AI output directly to projects table — always write to generated_artifacts
- Query generated_artifacts without filtering by is_latest=TRUE (for current state)
- Use createBrowserClient in server components
