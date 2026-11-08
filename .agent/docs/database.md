# Database Schema
Last updated: 2026-11-08

## Overview
Supabase Postgres with RLS on every table. CQRS-inspired hybrid: `generated_artifacts` is the truth store, `projects.manifest_snapshot` is a JSONB read cache maintained by trigger `on_artifact_insert`. Real DDL is in `supabase/migrations/`; where SCHEMA.md and the migrations disagree, the migrations win.

## Key files
- `supabase/migrations/001_initial_schema.sql` — `profiles`, `projects`, `project_assets`, `generated_artifacts`, trigger functions, `chat_sessions`, storage-policy notes
- `supabase/migrations/002_chat_sessions.sql` — `chat_sessions` (with unique key + `updated_at` trigger)
- `supabase/migrations/003_fix_vision_map_latest_and_chat_unique.sql` — replaces `handle_new_artifact()` (per-asset `vision_map` `is_latest` flip), backfills `vision_map` `is_latest`, dedupes `chat_sessions` and adds `chat_sessions_unique_active` if missing. Idempotent. **NOT yet applied to any live DB** (must be run in the Supabase SQL editor); not executed or tested.
- `src/lib/supabase/client.ts` (browser), `server.ts` (cookie client, `server-only`), `admin.ts` (service role, `server-only`)
- `src/lib/supabase/types.ts` — hand-written row types (`Project`, `ProjectAsset`, `GeneratedArtifact`, `ArtifactType`, `ManifestSnapshot`, `ChatMessage`)
- `src/lib/schemas/*.ts` — Zod schemas: `test-case`, `ux-review`, `bug-report`, `gap-analysis`, `semantic-link`, `test-data`, `persona-friction`, `i18n-audit`, `launch-readiness`, `screen-element-map`

## Tables
- `profiles(id → auth.users, email, display_name, plan free|pro|team, settings)` — auto-created by trigger `on_auth_user_created`.
- `projects(... app_type, user_role, platform, status active|archived|deleted, manifest_snapshot, extended_providers_enabled)`. `user_role` values: manual_tester, automation_engineer, qa_lead, product_manager, ux_designer.
- `project_assets(asset_type screenshot|document|prd, content_hash, perceptual_hash, metadata JSONB, is_dirty, is_verified)`; unique `(project_id, content_hash)`.
- `generated_artifacts(artifact_type, content JSONB, input_snapshot, prompt_version, model_used, provider, is_verified, is_latest, status complete|partial|error, ...)`. `artifact_type` CHECK allows: test_suite, ux_review, bug_report, gap_analysis, semantic_link, test_data, persona_friction, i18n_audit, launch_readiness, vision_map, chat_response. (`launch_readiness` is never written today; results are not stored.)
- `chat_sessions(project_id, user_id, messages JSONB, is_active)` — one row per `(project_id, user_id)`.

## Patterns
- RLS on every table (`auth.uid() = user_id`). API routes mostly use the service-role client, so each query must filter by `user_id` itself.
- Trigger `on_artifact_insert`: sets older same-type artifacts `is_latest = FALSE` (for `vision_map`, only those with the same `input_snapshot->>'asset_id'`, per migration 003) and updates `manifest_snapshot[artifact_type]` (extra metrics for test_suite `tc_count`, ux_review `overall_score`, gap_analysis `gaps_count`). Routes ALSO flip `is_latest` themselves before inserting (redundant but harmless).
- Storage: private bucket **`project-assets`** (not `testifye-assets`); path `{user_id}/{project_id}/{content_hash}.webp` (no `screenshots/` segment). Storage RLS policies are provided only as commented SQL — they must be applied manually in the Supabase dashboard.
- Soft delete: projects use `status` (archive/delete), queries filter `status = 'active'`.

## Gotchas
- `manifest_snapshot` is a read cache for dashboards (project list, overview). Feature logic (including Launch Readiness and AI context) reads `generated_artifacts` instead.
- **Fixed in migration 003 (apply to live DB; not yet applied):** the trigger's `is_latest` flip was per `(project_id, artifact_type)`, so inserting a new `vision_map` (one row per screenshot) flipped every other screen's map to `is_latest = FALSE` and `getProjectScreenMaps` returned only the latest screenshot's map. 003 scopes the `vision_map` flip per `input_snapshot->>'asset_id'` and backfills `is_latest = TRUE` on the newest complete `vision_map` per surviving asset. Other artifact types still flip per `(project_id, artifact_type)`. `manifest_snapshot.vision_map` still holds only the most recently inserted one. SQL was not run against a live DB.
- Because other types still flip per project, only the newest `bug_report` carries `is_latest`; Launch Readiness no longer relies on that and loads all complete `bug_report` rows (see features/launch-readiness.md).
- `chat_sessions`: 001 creates the table WITHOUT a unique constraint and 002's `CREATE TABLE IF NOT EXISTS` skips it when 001 ran first, which would break `upsert(... onConflict: 'project_id,user_id')` in `/api/chat/[projectId]`. **Fixed in migration 003 (not yet applied):** dedupes rows (keeps the newest per `(project_id, user_id)`) and adds `UNIQUE (project_id, user_id)` as `chat_sessions_unique_active` if missing. Until 003 is applied on a DB that ran 001 first, the upsert can fail.
- `ManifestSnapshot` TS type lists `screen_count`, `issues_count`, `coverage_score` that the trigger never sets.
- Enums are lowercase in Zod (`severity: 'critical'`). Specific enums: BugReport `steps_to_reproduce: string[]`; SemanticLink status `verified|missing|mismatch|untested`; GapFinding has 7 `type` values (contradiction, missing_flow, ambiguity, untestable, undefined_error_state, missing_from_ui, undocumented_feature).
- `updated_at` on `project_assets`/`projects` has no auto-update trigger (only `chat_sessions` does).

## Do not
- Write AI output to `projects` — write `generated_artifacts` rows.
- Query `generated_artifacts` for current state without `is_latest = TRUE`.
- Use `createBrowserClient` in server code or skip the `user_id` filter when using the admin client.
