-- ============================================================
-- Tesifye — Initial Schema Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  display_name TEXT,
  avatar_url   TEXT,
  plan         TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  settings     JSONB DEFAULT '{}',
  -- settings.extended_providers: boolean (global default for provider opt-in)
  -- settings.default_role: string
  -- settings.default_export_format: string
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                       TEXT NOT NULL,
  description                TEXT NOT NULL DEFAULT '',
  scope                      TEXT,
  target_audience            TEXT,
  app_type                   TEXT CHECK (app_type IN ('mobile', 'web', 'desktop', 'responsive', 'pwa')),
  user_role                  TEXT CHECK (user_role IN ('manual_tester', 'automation_engineer', 'qa_lead', 'product_manager', 'ux_designer')),
  platform                   TEXT CHECK (platform IN ('ios', 'android', 'web', 'cross_platform')),
  status                     TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  manifest_snapshot          JSONB DEFAULT '{}',
  extended_providers_enabled BOOLEAN DEFAULT FALSE,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects" ON projects FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user   ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(user_id, status);

-- ============================================================
-- PROJECT ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_assets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id),
  asset_type       TEXT NOT NULL CHECK (asset_type IN ('screenshot', 'document', 'prd')),
  file_name        TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  content_hash     TEXT NOT NULL,
  perceptual_hash  TEXT,
  file_size        INTEGER,
  mime_type        TEXT,
  metadata         JSONB DEFAULT '{}',
  is_dirty         BOOLEAN DEFAULT FALSE,
  is_verified      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own assets" ON project_assets FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assets_project     ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_hash        ON project_assets(content_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_unique_hash ON project_assets(project_id, content_hash);

-- ============================================================
-- GENERATED ARTIFACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_artifacts (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES profiles(id),
  artifact_type      TEXT NOT NULL CHECK (artifact_type IN (
    'test_suite', 'ux_review', 'bug_report', 'gap_analysis',
    'semantic_link', 'test_data', 'persona_friction', 'i18n_audit',
    'launch_readiness', 'vision_map', 'chat_response'
  )),
  version            INTEGER DEFAULT 1,
  content            JSONB NOT NULL,
  input_snapshot     JSONB DEFAULT '{}',
  prompt_version     TEXT DEFAULT 'v1.0',
  model_used         TEXT NOT NULL,
  provider           TEXT NOT NULL,
  token_count        INTEGER,
  generation_time_ms INTEGER,
  is_verified        BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  is_latest          BOOLEAN DEFAULT TRUE,
  status             TEXT DEFAULT 'complete' CHECK (status IN ('complete', 'partial', 'error')),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own artifacts" ON generated_artifacts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_artifacts_project ON generated_artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type    ON generated_artifacts(project_id, artifact_type);
CREATE INDEX IF NOT EXISTS idx_artifacts_latest  ON generated_artifacts(project_id, artifact_type, is_latest) WHERE is_latest = TRUE;

-- ============================================================
-- ARTIFACT INSERT TRIGGER
-- Sets previous is_latest=FALSE, updates manifest_snapshot
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_artifact() RETURNS TRIGGER AS $$
DECLARE
  v_tc_count      INTEGER;
  v_ux_score      NUMERIC;
  v_gaps_count    INTEGER;
BEGIN
  -- Mark all previous artifacts of same type as not latest
  UPDATE generated_artifacts
    SET is_latest = FALSE
    WHERE project_id = NEW.project_id
      AND artifact_type = NEW.artifact_type
      AND id != NEW.id
      AND is_latest = TRUE;

  -- Extract content-specific metrics for the snapshot
  IF NEW.artifact_type = 'test_suite' THEN
    v_tc_count := COALESCE((NEW.content->>'total_count')::INTEGER, 0);
  ELSIF NEW.artifact_type = 'ux_review' THEN
    v_ux_score := COALESCE((NEW.content->>'overall_score')::NUMERIC, 0);
  ELSIF NEW.artifact_type = 'gap_analysis' THEN
    v_gaps_count := COALESCE(jsonb_array_length(NEW.content->'findings'), 0);
  END IF;

  -- Update manifest_snapshot on the project
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

DROP TRIGGER IF EXISTS on_artifact_insert ON generated_artifacts;
CREATE TRIGGER on_artifact_insert
  AFTER INSERT ON generated_artifacts
  FOR EACH ROW EXECUTE FUNCTION handle_new_artifact();

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id),
  messages   JSONB DEFAULT '[]',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own chats" ON chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_project ON chat_sessions(project_id);

-- ============================================================
-- STORAGE BUCKET
-- Run separately via Supabase Dashboard → Storage OR via this SQL
-- ============================================================
-- NOTE: Bucket creation via SQL requires pg_net or the Supabase management API.
-- Create "testifye-assets" as a PRIVATE bucket in Dashboard → Storage → New bucket.
-- Then add these policies:

-- INSERT policy: authenticated users can upload to their own prefix
-- (path starts with their user_id/)
-- CREATE POLICY "Users upload own assets" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'testifye-assets'
--     AND auth.uid()::text = split_part(name, '/', 1)
--   );

-- SELECT policy: authenticated users can read their own files
-- CREATE POLICY "Users read own assets" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'testifye-assets'
--     AND auth.uid()::text = split_part(name, '/', 1)
--   );

-- DELETE policy: users can delete their own files
-- CREATE POLICY "Users delete own assets" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'testifye-assets'
--     AND auth.uid()::text = split_part(name, '/', 1)
--   );
