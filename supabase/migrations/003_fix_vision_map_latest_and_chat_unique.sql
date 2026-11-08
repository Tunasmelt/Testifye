-- ============================================================
-- Migration 003
--  1. handle_new_artifact(): scope the is_latest flip per screenshot for
--     vision_map artifacts (one row per asset), instead of per project.
--     Before this, scouting screenshot N flipped every other screen's map to
--     is_latest = FALSE, so generators only saw the most recent screen.
--  2. Backfill: restore is_latest on the newest vision_map per existing asset.
--  3. chat_sessions: guarantee UNIQUE (project_id, user_id). Migration 002's
--     CREATE TABLE IF NOT EXISTS is a no-op when 001 already created the table
--     (without the constraint), which makes the upsert in /api/chat/[projectId] fail.
-- Idempotent: safe to run more than once.
-- ============================================================

-- 1. Trigger function ---------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_artifact() RETURNS TRIGGER AS $$
DECLARE
  v_tc_count      INTEGER;
  v_ux_score      NUMERIC;
  v_gaps_count    INTEGER;
BEGIN
  -- Mark previous artifacts of the same type as not latest.
  -- vision_map is per-asset: only supersede maps of the SAME asset.
  UPDATE generated_artifacts
    SET is_latest = FALSE
    WHERE project_id = NEW.project_id
      AND artifact_type = NEW.artifact_type
      AND id != NEW.id
      AND is_latest = TRUE
      AND (
        NEW.artifact_type <> 'vision_map'
        OR (input_snapshot->>'asset_id') IS NOT DISTINCT FROM (NEW.input_snapshot->>'asset_id')
      );

  IF NEW.artifact_type = 'test_suite' THEN
    v_tc_count := COALESCE((NEW.content->>'total_count')::INTEGER, 0);
  ELSIF NEW.artifact_type = 'ux_review' THEN
    v_ux_score := COALESCE((NEW.content->>'overall_score')::NUMERIC, 0);
  ELSIF NEW.artifact_type = 'gap_analysis' THEN
    v_gaps_count := COALESCE(jsonb_array_length(NEW.content->'findings'), 0);
  END IF;

  UPDATE projects
    SET manifest_snapshot = jsonb_set(
      COALESCE(manifest_snapshot, '{}'),
      ARRAY[NEW.artifact_type],
      CASE NEW.artifact_type
        WHEN 'test_suite' THEN jsonb_build_object(
          'artifact_id', NEW.id,
          'generated_at', NEW.created_at,
          'model_used', NEW.model_used,
          'is_verified', NEW.is_verified,
          'tc_count', COALESCE(v_tc_count, 0)
        )
        WHEN 'ux_review' THEN jsonb_build_object(
          'artifact_id', NEW.id,
          'generated_at', NEW.created_at,
          'model_used', NEW.model_used,
          'is_verified', NEW.is_verified,
          'overall_score', COALESCE(v_ux_score, 0)
        )
        WHEN 'gap_analysis' THEN jsonb_build_object(
          'artifact_id', NEW.id,
          'generated_at', NEW.created_at,
          'model_used', NEW.model_used,
          'is_verified', NEW.is_verified,
          'gaps_count', COALESCE(v_gaps_count, 0)
        )
        ELSE jsonb_build_object(
          'artifact_id', NEW.id,
          'generated_at', NEW.created_at,
          'model_used', NEW.model_used,
          'is_verified', NEW.is_verified
        )
      END
    ),
    updated_at = NOW()
    WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Backfill vision_map is_latest (newest complete map per surviving asset) --
UPDATE generated_artifacts g
SET is_latest = TRUE
FROM (
  SELECT DISTINCT ON (ga.project_id, ga.input_snapshot->>'asset_id') ga.id
  FROM generated_artifacts ga
  JOIN project_assets pa
    ON pa.id::text = ga.input_snapshot->>'asset_id'
   AND pa.project_id = ga.project_id
  WHERE ga.artifact_type = 'vision_map'
    AND ga.status = 'complete'
  ORDER BY ga.project_id, ga.input_snapshot->>'asset_id', ga.created_at DESC
) latest
WHERE g.id = latest.id
  AND g.is_latest = FALSE;

-- 3. chat_sessions unique constraint -----------------------------------------
-- Keep only the most recently updated row per (project_id, user_id).
DELETE FROM chat_sessions a
USING chat_sessions b
WHERE a.project_id = b.project_id
  AND a.user_id = b.user_id
  AND (a.updated_at, a.id) < (b.updated_at, b.id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'chat_sessions'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'chat_sessions'::regclass AND attname = 'project_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'chat_sessions'::regclass AND attname = 'user_id')
      ]
  ) THEN
    ALTER TABLE chat_sessions
      ADD CONSTRAINT chat_sessions_unique_active UNIQUE (project_id, user_id);
  END IF;
END $$;
