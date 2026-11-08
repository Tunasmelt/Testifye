# Tesifye — Data Schema & Contracts

> **Purpose:** Every data structure in the system: SQL tables, Zod schemas, TypeScript interfaces, system prompts, and API contracts. Any agent reads this to understand DATA shape.
> **Related files:** [ARCHITECTURE.md](./ARCHITECTURE.md) (HOW) · [SCOPE.md](./SCOPE.md) (WHAT) · [PHASES.md](./PHASES.md) (WHEN)
> **Source of truth:** SQL = `supabase/migrations/*.sql` · Zod = `src/lib/schemas/*.ts` · TS types = `src/lib/supabase/types.ts` · API = `src/app/api/**/route.ts`. If this file disagrees with those, the code wins; update this file.

---

## SQL Schema (Supabase Postgres)

### Extensions Required
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Table: profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  settings JSONB DEFAULT '{}',
  -- settings.extended_providers: boolean (opt-in for Google/Gemini fallback)
  -- settings.default_role: string
  -- settings.default_export_format: string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### Table: projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scope TEXT,
  target_audience TEXT,
  app_type TEXT CHECK (app_type IN ('mobile', 'web', 'desktop', 'responsive', 'pwa')),
  user_role TEXT CHECK (user_role IN ('manual_tester', 'automation_engineer', 'qa_lead', 'product_manager', 'ux_designer')),
  platform TEXT CHECK (platform IN ('ios', 'android', 'web', 'cross_platform')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  manifest_snapshot JSONB DEFAULT '{}',
  -- manifest_snapshot is written ONLY by the handle_new_artifact trigger (see below),
  -- keyed by artifact_type (e.g. "test_suite", "ux_review", "vision_map"):
  -- {
  --   "<artifact_type>": { artifact_id, generated_at, model_used, is_verified,
  --                        + tc_count (test_suite) | overall_score (ux_review) | gaps_count (gap_analysis) }
  -- }
  -- screen_count / last_generation_at / coverage_score / issues_count appear in the
  -- ManifestSnapshot TS type (src/lib/supabase/types.ts) but are NOT written by any migration.
  extended_providers_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(user_id, status);
```

> `profiles` also has a `handle_new_user()` SECURITY DEFINER trigger on `auth.users` that auto-inserts a profile row (display_name defaults to the email local-part).

### Table: project_assets
```sql
CREATE TABLE project_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('screenshot', 'document', 'prd')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,           -- Supabase storage path
  content_hash TEXT NOT NULL,           -- SHA-256 exact hash
  perceptual_hash TEXT,                 -- 64-bit pHash (for screenshots only)
  file_size INTEGER,                    -- Bytes
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  -- metadata.label: string (user-provided screen label)
  -- metadata.vision_map_status: 'pending' | 'ready' | 'failed' (written by upload route / runScout).
  --   'stale' is reserved in src/lib/supabase/types.ts only; nothing writes it.
  -- metadata.dimensions: { width, height } and metadata.order: number exist in the TS type only; no code writes them.
  is_dirty BOOLEAN DEFAULT FALSE,       -- True when project context changed after analysis
  is_verified BOOLEAN DEFAULT FALSE,    -- True after Scout has produced a valid ScreenElementMap
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own assets" ON project_assets FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_assets_project ON project_assets(project_id);
CREATE INDEX idx_assets_hash ON project_assets(content_hash);
CREATE UNIQUE INDEX idx_assets_unique_hash ON project_assets(project_id, content_hash);
```

### Table: generated_artifacts
```sql
CREATE TABLE generated_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'test_suite', 'ux_review', 'bug_report', 'gap_analysis',
    'semantic_link', 'test_data', 'persona_friction', 'i18n_audit',
    'launch_readiness', 'vision_map', 'chat_response'
  )),
  version INTEGER DEFAULT 1,           -- Intended: increments per artifact_type per project. In practice no insert sets it (always 1)
  content JSONB NOT NULL,              -- The actual AI output (Zod-validated)
  input_snapshot JSONB DEFAULT '{}',    -- Frozen copy of inputs used for this generation
  -- input_snapshot.description, input_snapshot.scope, etc.
  prompt_version TEXT DEFAULT 'v1.0',   -- SQL default is 'v1.0' (matches migration), but every route/service insert sets
                                        -- PROMPT_VERSION from src/lib/ai/prompt-version.ts (format "YYYY-MM-DD.n", currently '2026-05-25.1')
  model_used TEXT NOT NULL,             -- bare model id, e.g., 'llama-3.3-70b-versatile' (no provider prefix; provider is in the `provider` column)
  provider TEXT NOT NULL,               -- provider values: 'groq' | 'google' (Cerebras dropped 2026-11-08)
  token_count INTEGER,                  -- Total tokens used (input + output)
  generation_time_ms INTEGER,           -- Wall-clock time for full pipeline
  is_verified BOOLEAN DEFAULT FALSE,    -- Set by Judge
  verification_notes TEXT,              -- Judge's findings
  is_latest BOOLEAN DEFAULT TRUE,       -- Only one "latest" per artifact_type per project
  status TEXT DEFAULT 'complete' CHECK (status IN ('complete', 'partial', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE generated_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own artifacts" ON generated_artifacts FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_artifacts_project ON generated_artifacts(project_id);
CREATE INDEX idx_artifacts_type ON generated_artifacts(project_id, artifact_type);
CREATE INDEX idx_artifacts_latest ON generated_artifacts(project_id, artifact_type, is_latest) WHERE is_latest = TRUE;

-- Trigger: Set previous versions to is_latest=FALSE when new one inserted,
-- and write a small summary of the new artifact into projects.manifest_snapshot.
-- (abridged — full body in supabase/migrations/001_initial_schema.sql; migration 003 replaces this function
--  so the is_latest flip for vision_map is scoped per input_snapshot->>'asset_id'. The 001 body below flips per
--  (project_id, artifact_type) only; 003 is NOT yet applied to any live DB.)
CREATE OR REPLACE FUNCTION handle_new_artifact() RETURNS TRIGGER AS $$
DECLARE
  v_tc_count INTEGER; v_ux_score NUMERIC; v_gaps_count INTEGER;
BEGIN
  -- Mark ALL previous artifacts of same (project_id, artifact_type) as not latest.
  -- NOTE: not scoped per asset — see "Known trigger caveat" below.
  UPDATE generated_artifacts
    SET is_latest = FALSE
    WHERE project_id = NEW.project_id
      AND artifact_type = NEW.artifact_type
      AND id != NEW.id
      AND is_latest = TRUE;

  -- Per-type metrics (counts/scores only; findings and full content are NOT copied)
  IF NEW.artifact_type = 'test_suite' THEN
    v_tc_count := COALESCE((NEW.content->>'total_count')::INTEGER, 0);
  ELSIF NEW.artifact_type = 'ux_review' THEN
    v_ux_score := COALESCE((NEW.content->>'overall_score')::NUMERIC, 0);
  ELSIF NEW.artifact_type = 'gap_analysis' THEN
    v_gaps_count := COALESCE(jsonb_array_length(NEW.content->'findings'), 0);
  END IF;

  -- manifest_snapshot[artifact_type] =
  --   always:        { artifact_id, generated_at, model_used, is_verified }
  --   + test_suite:  tc_count
  --   + ux_review:   overall_score
  --   + gap_analysis: gaps_count
  UPDATE projects
    SET manifest_snapshot = jsonb_set(COALESCE(manifest_snapshot, '{}'), ARRAY[NEW.artifact_type], /* CASE per type, see migration */ ...),
        updated_at = NOW()
    WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_artifact_insert ON generated_artifacts;
CREATE TRIGGER on_artifact_insert
  AFTER INSERT ON generated_artifacts
  FOR EACH ROW EXECUTE FUNCTION handle_new_artifact();
```

**Trigger caveat (fixed in `supabase/migrations/003_fix_vision_map_latest_and_chat_unique.sql`, NOT yet applied to any live DB; SQL not executed or tested):** the 001 trigger keyed the `is_latest` flip only on `(project_id, artifact_type)`, so inserting a new `vision_map` (one per screenshot, written by `runScout`) flipped `is_latest=FALSE` for the vision maps of the project's other screenshots. With 2+ analyzed screenshots only the most recently scouted screen's `vision_map` stayed `is_latest`, so `getProjectScreenMaps()` (filters `is_latest = TRUE`) returned just that one, and the Scout cache check (`is_latest = TRUE` + `input_snapshot` contains `asset_id`) missed for earlier assets. Migration 003 replaces `handle_new_artifact()` so that for `artifact_type = 'vision_map'` only rows with the same `input_snapshot->>'asset_id'` are superseded (other types are unchanged), and backfills `is_latest = TRUE` on the newest `status = 'complete'` `vision_map` per surviving asset. It is idempotent. **Action required:** run it in the Supabase SQL editor.

**Redundant flips:** routes also run their own `UPDATE ... SET is_latest = false` before inserting; the trigger makes this redundant but harmless.

**Staleness:** `isStale(promptVersion)` in `src/lib/ai/prompt-version.ts` returns `true` for `null`/`undefined`/empty versions (pre-versioning artifacts) and for any version below `MIN_FRESH_VERSION`. `PROMPT_VERSION` and `MIN_FRESH_VERSION` are both currently `'2026-05-25.1'`.

### Table: chat_sessions (Sidekick persistence — `002_chat_sessions.sql`)
```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- messages: Array<{ role: 'user'|'assistant', content: string, timestamp: string }>  (ChatMessage in types.ts)
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One session row per user per project; /api/chat/[projectId] relies on this for upsert(onConflict: 'project_id,user_id')
  CONSTRAINT chat_sessions_unique_active UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_user ON chat_sessions(project_id, user_id);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- BEFORE UPDATE trigger chat_sessions_updated_at -> update_chat_session_timestamp() sets updated_at = NOW()
```

> **Migration conflict (fixed in `supabase/migrations/003_fix_vision_map_latest_and_chat_unique.sql`, NOT yet applied):** `001_initial_schema.sql` *also* creates `chat_sessions` with `CREATE TABLE IF NOT EXISTS` and **no** UNIQUE constraint, plus a differently named RLS policy and `idx_chat_project`. If 001 ran before 002, the `CREATE TABLE IF NOT EXISTS chat_sessions` in 002 is skipped, so `UNIQUE (project_id, user_id)` is never created and the upsert with `onConflict: 'project_id,user_id'` in `/api/chat/[projectId]` errors ("no unique or exclusion constraint matching"). Migration 003 deletes duplicate rows (keeps the newest per `(project_id, user_id)` by `updated_at`) and adds `chat_sessions_unique_active UNIQUE (project_id, user_id)` if no equivalent unique constraint exists. 002 may also have created a second RLS policy and the `updated_at` trigger. Not verified against a live DB.

### Supabase Storage Bucket
```
Bucket: project-assets (private; created manually in the Dashboard)

Structure (as written by /api/assets/upload):
  {user_id}/{project_id}/{sha256}.webp
```
- Earlier docs said `testifye-assets` with `screenshots/` and `docs/` sub-folders; the code uses `project-assets` and a flat path, and no document upload to storage exists (PRDs are parsed in-request by `document.service.ts` and not stored).
- The storage RLS policies (INSERT/SELECT/DELETE keyed on `split_part(name,'/',1) = auth.uid()`) are **commented out** in `001_initial_schema.sql` and must be applied manually. All server access uses the service-role client.

---

## Zod Schemas

### ScreenElementMap (Scout Output)

```typescript
// lib/schemas/screen-element-map.ts
import { z } from 'zod';

export const UIElementSchema = z.object({
  type: z.enum(['button', 'input', 'link', 'nav', 'text', 'image', 'icon', 'toggle', 'dropdown', 'modal', 'tab', 'card', 'list']),
  label: z.string().describe('Visible text or inferred label'),
  inferred_function: z.string().describe('What this element likely does'),
  location: z.string().describe('Position: top-left, center, bottom-nav, etc.'),
  is_interactive: z.boolean(),
});

export const PlatformSignalsSchema = z.object({
  is_mobile: z.boolean(),
  has_bottom_nav: z.boolean(),
  has_hamburger_menu: z.boolean(),
  has_status_bar: z.boolean(),
  estimated_platform: z.enum(['ios', 'android', 'web', 'desktop', 'unknown']),
});

export const ScreenElementMapSchema = z.object({
  screen_label: z.string().describe('E.g., "Login Screen", "Dashboard"'),
  description: z.string().describe('One-sentence description of the screen'),
  elements: z.array(UIElementSchema),
  inferred_flow: z.string().describe('Where this screen fits in the user journey'),
  platform_signals: PlatformSignalsSchema,
});

export type UIElement        = z.infer<typeof UIElementSchema>;
export type PlatformSignals  = z.infer<typeof PlatformSignalsSchema>;
export type ScreenElementMap = z.infer<typeof ScreenElementMapSchema>;
```

### Test Case Output (Generator Output)

```typescript
// lib/schemas/test-case.ts
import { z } from 'zod';

export const TestStepSchema = z.object({
  step_number: z.number(),
  action: z.string(),
  expected_result: z.string(),
});

export const TestCaseSchema = z.object({
  tc_id: z.string().describe('TC-001, TC-002, etc.'),
  title: z.string(),
  category: z.string().describe('Focus area: Authentication, Navigation, etc.'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  preconditions: z.string(),
  steps: z.array(TestStepSchema),
  step_count: z.number().describe('Denormalized count of steps for list-view rendering'),
  screen_label: z.string().describe('Which analyzed screen this test case is grounded in'),
  test_data_suggestion: z.string().optional(),
  ui_elements_referenced: z.array(z.string()).describe('Element labels from ScreenElementMap'),
  is_verified: z.boolean().default(false),
  verification_note: z.string().optional(),
});

export const TestSuiteOutputSchema = z.object({
  test_cases: z.array(TestCaseSchema),
  coverage_summary: z.string().describe('Brief summary of what is and isn\'t covered'),
  total_count: z.number(),
  priority_breakdown: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
});

export type TestStep        = z.infer<typeof TestStepSchema>;
export type TestCase        = z.infer<typeof TestCaseSchema>;
export type TestSuiteOutput = z.infer<typeof TestSuiteOutputSchema>;
// NOTE: there is no `coverage_score` field. launch-readiness no longer reads it (coverage is computed from
// test-case volume, category breadth and the per-case `is_verified` ratio; see Launch Readiness section).
```

### UX Review Output

```typescript
// lib/schemas/ux-review.ts
import { z } from 'zod';

export const UXFindingSchema = z.object({
  heuristic_number: z.number().min(1).max(10),
  heuristic_name: z.string(),
  severity: z.enum(['critical', 'major', 'minor', 'enhancement']),
  effort: z.enum(['quick-win', 'moderate', 'significant']).describe('Implementation effort — powers the Quick Wins filter'),
  element: z.string().describe('Which UI element this finding relates to'),
  screen: z.string().describe('Which analyzed screen this finding appears on'),
  description: z.string(),
  suggestion: z.string().describe('Actionable improvement'),
  screenshot_ref: z.string().optional(),
  is_verified: z.boolean().default(false),
});

export const A11yFlagSchema = z.object({
  type: z.enum(['contrast', 'touch_target', 'alt_text', 'focus_order', 'keyboard_nav', 'aria_label']),
  criterion: z.string().describe('WCAG criterion e.g. 1.4.3'),
  element: z.string(),
  screen: z.string(),
  detail: z.string().describe('Specific measurement or description'),
});

export const UXReviewOutputSchema = z.object({
  overall_score: z.number().min(0).max(100),
  grade: z.string().describe('Letter grade: A+, A, B+, B, C, D, F'),
  findings: z.array(UXFindingSchema),
  score_breakdown: z.record(z.string(), z.number()).describe('Per-heuristic scores 0–10'),
  accessibility_flags: z.array(A11yFlagSchema),
  strengths: z.array(z.string()),
  screen_metrics: z.object({
    dominant_colors: z.array(z.string()).optional(),
    contrast_ratios: z.array(z.object({
      pair: z.string(),
      ratio: z.number(),
      passes_aa: z.boolean(),
    })).optional(),
    whitespace_ratio: z.number().optional(),
    element_density: z.number().optional(),
  }).optional(),
});

export type UXFinding = z.infer<typeof UXFindingSchema>;
export type A11yFlag = z.infer<typeof A11yFlagSchema>;
export type UXReviewOutput = z.infer<typeof UXReviewOutputSchema>;
```

### Bug Report Output

```typescript
// lib/schemas/bug-report.ts
import { z } from 'zod';

export const BugReportSchema = z.object({
  bug_id: z.string(),
  title: z.string(),
  severity: z.enum(['blocker', 'critical', 'major', 'minor', 'trivial']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']),
  component: z.string().describe('App area e.g. Checkout, Auth, Search'),
  environment: z.object({
    platform: z.string().describe('Android, iOS, Web, Desktop'),
    os: z.string(),
    browser: z.string(),
    app_version: z.string(),
    screen_size: z.string().optional(),
  }),
  steps_to_reproduce: z.array(z.string()).describe('Plain-string steps'),
  expected_result: z.string(),
  actual_result: z.string(),
  frequency: z.enum(['always', 'often', 'sometimes', 'rarely', 'once']),
  root_cause_hypothesis: z.string().describe('AI-inferred probable root cause'),
  suggested_fix: z.string(),
  labels: z.array(z.string()).default([]).describe('Searchable tags'),
  screenshot_refs: z.array(z.string()).default([]),
});

export type BugReport = z.infer<typeof BugReportSchema>;
```

### Gap Analysis Output

```typescript
// lib/schemas/gap-analysis.ts
import { z } from 'zod';

export const GapFindingSchema = z.object({
  id: z.string().describe('GAP-01, GAP-02, etc.'),
  type: z.enum([
    'contradiction',        // Two PRD sections conflict with each other
    'missing_flow',         // A required flow is specified but has no UI implementation
    'ambiguity',            // Requirement is vague / unmeasurable
    'untestable',           // Requirement cannot be verified through UI
    'undefined_error_state',// Error path specified but recovery not defined
    'missing_from_ui',      // Requirement mentioned but element not found in screens
    'undocumented_feature', // UI element exists but PRD has no requirement for it
  ]),                       // (inline comments are explanatory only; not in the source file)
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  location: z.string().describe('PRD section reference e.g. §2.4'),
  description: z.string(),
  suggestion: z.string(),
});

export const GapAnalysisOutputSchema = z.object({
  findings: z.array(GapFindingSchema),
  requirements_count: z.number().describe('Total requirements parsed from PRD'),
  summary: z.object({
    contradictions:         z.number(),
    missing_flows:          z.number(),
    ambiguities:            z.number(),
    untestable:             z.number(),
    undefined_error_states: z.number(),   // note plural vs. finding type 'undefined_error_state'
    missing_from_ui:        z.number(),
    undocumented_features:  z.number(),   // note plural vs. finding type 'undocumented_feature'
  }),
});

export type GapFinding = z.infer<typeof GapFindingSchema>;
export type GapAnalysisOutput = z.infer<typeof GapAnalysisOutputSchema>;
```

---

## Zod Schemas (continued)

### Semantic Link Output

```typescript
// lib/schemas/semantic-link.ts
import { z } from 'zod';

export const SemanticLinkSchema = z.object({
  req: z.string().describe('Requirement text from PRD'),
  loc: z.string().describe('PRD section reference e.g. §2.1'),
  element: z.string().nullable().describe('Matched UI element label — null if missing'),
  screen: z.string().nullable().describe('Screen where element was found — null if missing'),
  status: z.enum(['verified', 'missing', 'mismatch', 'untested']),
  // verified = element found & matches · missing = not in any screen · mismatch = present but contradicts
  // · untested = backend concern, no UI evidence. (Comment only; UI colour thresholds >0.8 / >0.5 live in the client, not the schema.)
  confidence: z.number().min(0).max(1).describe('Match confidence 0–1'),
  note: z.string().optional().describe('Explanation for mismatch or untested status'),
});

export const SemanticLinkOutputSchema = z.object({
  links: z.array(SemanticLinkSchema),
  summary: z.object({
    verified: z.number(),
    missing: z.number(),
    mismatch: z.number(),
    untested: z.number(),
  }),
});

export type SemanticLink = z.infer<typeof SemanticLinkSchema>;
export type SemanticLinkOutput = z.infer<typeof SemanticLinkOutputSchema>;
```

### Persona Friction Output

```typescript
// lib/schemas/persona-friction.ts
import { z } from 'zod';

export const FrictionItemSchema = z.object({
  screen: z.string(),
  element: z.string(),
  friction_type: z.enum([
    'cognitive_load',
    'trust_issue',
    'missing_affordance',
    'accessibility',
    'confusion',
    'visual_hierarchy',
  ]),
  severity: z.enum(['blocking', 'frustrating', 'annoying', 'minor']),
  description: z.string(),
  suggestion: z.string(),
});

export const PersonaOutputSchema = z.object({
  persona_id: z.string(),
  persona_name: z.string(),
  empathy_statement: z.string().describe('One-line empathy summary for this persona'),
  ux_score: z.number().min(0).max(100),
  drop_off_risk: z.enum(['high', 'medium', 'low']),
  friction_items: z.array(FrictionItemSchema),
});

export const PersonaFrictionOutputSchema = z.object({
  personas: z.array(PersonaOutputSchema),
});

export type FrictionItem = z.infer<typeof FrictionItemSchema>;
export type PersonaOutput = z.infer<typeof PersonaOutputSchema>;
export type PersonaFrictionOutput = z.infer<typeof PersonaFrictionOutputSchema>;
```

Valid `persona_id` inputs accepted by `POST /api/generate/persona-friction` (`VALID_PERSONAS`): `gen_z`, `tech_averse`, `power_user`, `first_time_user`, `accessibility`. The Zod output schema itself types `persona_id` as a free `string`.

### i18n Audit Output

```typescript
// lib/schemas/i18n-audit.ts
import { z } from 'zod';

export const I18nFindingSchema = z.object({
  category: z.enum(['text_expansion', 'rtl', 'date_format', 'currency', 'number_format', 'cultural_assumption']),
  severity: z.enum(['critical', 'major', 'minor']),
  screen: z.string(),
  element: z.string(),
  detail: z.string(),
  locales: z.array(z.string()).describe('Affected locale codes e.g. ["ar-SA", "de-DE"]'),
});

export const I18nAuditOutputSchema = z.object({
  readiness_score: z.number().min(0).max(100).describe('Overall i18n readiness 0–100'),
  readiness_label: z.string().describe('e.g. "Partially Ready", "Production Ready"'),
  recommended_locales: z.array(z.string()).describe('Suggested priority test locales'),
  findings: z.array(I18nFindingSchema),
  summary: z.object({
    critical: z.number(),
    major: z.number(),
    minor: z.number(),
  }),
});

export type I18nFinding = z.infer<typeof I18nFindingSchema>;
export type I18nAuditOutput = z.infer<typeof I18nAuditOutputSchema>;
```

### Test Data Output

```typescript
// lib/schemas/test-data.ts
import { z } from 'zod';

export const DataFieldSchema = z.object({
  field_name:   z.string().describe('Input field label from the UI'),
  field_type:   z.enum(['text', 'email', 'password', 'phone', 'number', 'date', 'select', 'boolean', 'file']),
  value:        z.string().describe('The test value for this field'),
  notes:        z.string().optional().describe('Why this value was chosen (e.g. "boundary: max length")'),
});

export const DataScenarioSchema = z.object({
  scenario_id:  z.string().describe('DS-001, DS-002, etc.'),
  name:         z.string().describe('e.g. "Happy Path — Standard User"'),
  category:     z.enum(['valid', 'boundary', 'invalid', 'edge_case']),
  description:  z.string().describe('What this scenario tests'),
  fields:       z.array(DataFieldSchema),
  expected_outcome: z.string().describe('What should happen when this data is submitted'),
});

export const TestDataOutputSchema = z.object({
  scenarios:        z.array(DataScenarioSchema),
  total_count:      z.number(),
  coverage_summary: z.string().describe('What input fields and scenarios are covered'),
  fields_identified: z.array(z.string()).describe('All input fields found in the UI'),
});

export type DataField       = z.infer<typeof DataFieldSchema>;
export type DataScenario    = z.infer<typeof DataScenarioSchema>;
export type TestDataOutput  = z.infer<typeof TestDataOutputSchema>;
```

### Launch Readiness Output (computed — no AI call)

```typescript
// lib/schemas/launch-readiness.ts
import { z } from 'zod';

export const BlockingIssueSchema = z.object({
  type: z.enum(['critical_bug', 'ux_issue', 'missing_requirement', 'a11y_blocker']),
  source: z.string(),            // e.g. "BUG-003", "Heuristic 1", "Gap: Login flow"
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium']),
});

export const DimensionScoreSchema = z.object({
  score: z.number().min(0).max(100),
  label: z.string(),             // e.g. "Good", "Needs attention"
  detail: z.string(),            // e.g. "85 test cases · 72% coverage score"
});

export const LaunchReadinessOutputSchema = z.object({
  overall_score: z.number().min(0).max(100),   // weighted composite
  readiness_label: z.enum(['Ready', 'Needs Attention', 'Not Ready', 'Critical Issues']),
  dimensions: z.object({
    test_coverage: DimensionScoreSchema,
    ux_score:      DimensionScoreSchema,
    gap_count:     DimensionScoreSchema,
    bug_severity:  DimensionScoreSchema,
  }),
  blocking_issues: z.array(BlockingIssueSchema),
  computed_at: z.string(),                     // ISO timestamp
});

export type BlockingIssue         = z.infer<typeof BlockingIssueSchema>;
export type DimensionScore        = z.infer<typeof DimensionScoreSchema>;
export type LaunchReadinessOutput = z.infer<typeof LaunchReadinessOutputSchema>;
```

`launch_readiness` is allowed by the `artifact_type` CHECK, but `POST /api/generate/launch-readiness` **does not persist** its result (verified: no insert in the route) — it recomputes on every call by `computeLaunchReadiness` in `src/lib/services/launch-readiness.service.ts` from the latest `test_suite`, `ux_review`, `gap_analysis` artifacts and ALL complete `bug_report` artifacts (bugs have no open/closed status, so every filed report counts). Test coverage = `min(count,50)/50*50` + `min(distinct categories,6)/6*30` + judge-verified ratio `*20`. Bug score = 100 − sum of per-bug penalties (blocker 40, critical 30, major 15, minor 5, trivial 2), floored at 0. Weights: test 30% · UX 30% · gaps 20% · bugs 20%. Label thresholds on `overall_score`: ≥80 Ready · ≥60 Needs Attention · ≥40 Not Ready · else Critical Issues. The `a11y_blocker` type is in the enum but never emitted by the service. UX blocking `source` is `Heuristic {heuristic_number} — {heuristic_name}`; up to 5 blocker/critical bugs are listed as `critical_bug` blocking issues. The "show only after 2 artifact types exist" gate is not implemented.

---

## System Prompts

> The prompt text below is illustrative and was not re-diffed against the source. Source of truth is `src/lib/ai/prompts/` (`scout.ts`, `generator.ts`, `judge.ts`, `ux-auditor.ts`, `bug-report.ts`, `gap-analysis.ts`, `semantic-link.ts`, `persona-friction.ts`, `i18n-audit.ts`, `test-data.ts`). Bump `PROMPT_VERSION` (`src/lib/ai/prompt-version.ts`) when a prompt change materially affects output.

### Scout System Prompt

```typescript
// lib/ai/prompts/scout.ts
export const SCOUT_SYSTEM_PROMPT = `You are Tesifye Scout, a UI analysis agent.

Your job: Given a screenshot of a mobile or web application screen, produce a structured JSON inventory of every visible UI element.

Rules:
- List EVERY interactive element (buttons, inputs, links, toggles, dropdowns)
- List significant non-interactive elements (headings, images, icons, status indicators)
- For each element, infer its PURPOSE based on visual context, not just its label
- Use the "location" field to describe spatial position: "top-left", "center", "bottom-nav", etc.
- Detect platform signals: is this mobile? Does it have a bottom navigation bar? Hamburger menu?
- If you see text that looks like an error message or loading state, explicitly note it
- Do NOT invent elements that are not clearly visible in the screenshot
- Do NOT describe the screenshot aesthetically — only catalog what's on it

Output format: ScreenElementMap JSON (defined by the provided Zod schema).`;
```

### Generator System Prompt

```typescript
// lib/ai/prompts/generator.ts
export function buildGeneratorPrompt(feature: string, role: string): string {
  return `You are Tesifye Generator, an expert QA engineer AI.

Your job: Given project context, UI element maps (from Scout analysis), and the user's request, generate structured QA artifacts.

Context you will receive:
- Project description, scope, target audience, and tester role
- ScreenElementMaps: JSON inventories of every UI element on analyzed screens
- Any existing artifacts (test cases, UX reviews) from this project

Current task: Generate ${feature}
User role: ${role}

Rules:
- ONLY reference UI elements that appear in the provided ScreenElementMaps
- If you need to reference an element, use its exact "label" from the map
- If an element you expect is NOT in the maps, note it as an ASSUMPTION in the output
- Adapt your language and detail level to the user's role
- Be specific and actionable — never generic advice like "test edge cases"
- Include preconditions that a real tester would need
- Make test steps executable by someone who has never seen the app

Output format: Structured JSON (defined by the provided Zod schema).`;
}
```

### Judge System Prompt

```typescript
// lib/ai/prompts/judge.ts
export const JUDGE_SYSTEM_PROMPT = `You are Tesifye Judge, a verification agent.

Your job: Given a generated artifact (test cases, UX review, etc.) and the original ScreenElementMaps, verify that the artifact is grounded in reality.

Verification rules:
1. For each test step or finding that references a UI element:
   - Search ALL provided ScreenElementMaps for a matching element (by label or inferred_function)
   - If found: mark as "verified": true
   - If NOT found: mark as "verified": false, add note: "Element '{label}' not found in analyzed screens"
2. Check for logical consistency:
   - Do preconditions match the app's actual flow?
   - Are test steps in a logical order?
   - Do expected results match the element's inferred function?
3. Check for hallucinated features:
   - If the generator mentions a feature not visible in ANY screenshot, flag it
4. DO NOT add new test cases or findings — you only verify and filter
5. Remove or flag impossible steps

Output: Same artifact structure, with verified booleans set and hallucinated items flagged.`;
```

---


## API Contract: Route Handlers

> Verified by reading each `src/app/api/**/route.ts`. Conventions:
> - **Auth:** every route requires a Supabase session cookie; otherwise `401 { error: 'Unauthorized' }`.
> - **Casing:** JSON bodies and multipart fields are **camelCase** (`projectId`, `auditFocus`, ...). The one exception is `POST /api/assets/upload`, which uses snake_case `project_id`.
> - **Errors:** non-stream failures return `{ error: string }` with 400 (bad input), 404 (`Project not found`), 413/422 (file/content), or 502 (AI failure, where handled).
> - **Ownership:** generation routes load the project with `.eq('user_id', user.id).eq('status','active')` via the service-role client.
> - **SSE routes** respond `Content-Type: text/event-stream` with frames `data: <json>\n\n` and these event types: `meta` then `partial`* then `done` or `error`. Errors raised *before* the stream starts (auth, 400, 404, 422) are plain JSON responses, not SSE frames.
> - **Streaming (SSE) routes:** test-cases, ux-audit, persona-friction, i18n-audit, generate/chat. **Non-streaming JSON:** bug-report, gap-analysis, semantic-link, test-data, launch-readiness, estimate.
> - Not present in code: `GET /api/projects`, `/api/export`. (Project CRUD is browser-side via `lib/services/project.service.ts` + RLS; export is `lib/services/export.service.ts`.)

### POST /api/generate/test-cases  (SSE, maxDuration 300)

```typescript
// Request
{ projectId: string; focusAreas?: string[]; resumeFrom?: number; role?: string }  // role overrides project.user_role for this run
// SSE events
{ type: 'meta';    provider: string; model: string; estimatedTokens: number }
{ type: 'partial'; object: DeepPartial<TestSuiteOutput> }
{ type: 'done';    object: TestSuiteOutput }     // after Judge (Judge failure is non-fatal: raw output is returned)
{ type: 'error';   message: string }
```
No analyzed screens is **allowed** (generates from description only). Persists a `test_suite` artifact (`input_snapshot: { focus_areas, resume_from }`); the artifact's `is_verified` is `true` only if the Judge succeeded (`false` when the Judge failed and raw output was saved). The Judge uses `project.extended_providers_enabled` for its Google fallback (Private mode stays Groq-only). Persist failures are logged and swallowed.

### POST /api/generate/ux-audit  (SSE, maxDuration 300)

```typescript
{ projectId: string; auditFocus?: string; screenMetricsSummary?: string }
// events: meta | partial (DeepPartial<UXReviewOutput>) | done (UXReviewOutput) | error
```
`422 { error: 'No analyzed screens...' }` if the project has no `vision_map` artifacts. No Judge stage; persists `ux_review` with `is_verified: false`, `input_snapshot: { audit_focus }` (default `'Full Audit'`).

### POST /api/generate/persona-friction  (SSE, maxDuration 300)

```typescript
{ projectId: string; selectedPersonas: string[] }  // each in: gen_z | tech_averse | power_user | first_time_user | accessibility
// events: meta | partial (DeepPartial<PersonaFrictionOutput>) | done (PersonaFrictionOutput) | error
```
Unknown persona ids are silently dropped; if none remain the route returns `400 'At least one valid persona required'`. `422` if no analyzed screens. No Judge stage; persists `persona_friction` (`is_verified: false`).

### POST /api/generate/i18n-audit  (SSE, maxDuration 300)

```typescript
{ projectId: string; targetLocales?: string[] }
// events: meta | partial (DeepPartial<I18nAuditOutput>) | done (I18nAuditOutput) | error
```
`422` if no analyzed screens. No Judge stage; persists `i18n_audit` (`input_snapshot: { target_locales }`, `is_verified: false`).

### POST /api/generate/bug-report  (JSON, NOT SSE, maxDuration 60)

```typescript
// Request
{ projectId: string; description: string; bugIndex?: number /* default 1 -> BUG-001 */;
  platform?: string; os?: string; browser?: string; appVersion?: string; component?: string }
// Response 200
{ report: BugReport; provider: string; model: string }
```
Persists one `bug_report` artifact per call (each new report flips the previous to `is_latest = false`, so only the most recent single report is "latest"). The route does not wrap the AI call in try/catch (an AI failure surfaces as a 500, unlike gap-analysis / semantic-link / test-data, which return 502).

### POST /api/generate/gap-analysis  (multipart, JSON response, maxDuration 120)

```typescript
// Request: FormData
projectId: string
file?: File    // PDF / DOCX / TXT, max 20 MB (413 if larger)
text?: string  // alternative to file; one of file|text required
// Response 200
{ analysis: GapAnalysisOutput; provider: string; model: string; extractedChars: number }
```
`422` if extraction fails, no readable text, or text is under 50 chars; `502` if the AI call fails. Persists `gap_analysis` (`input_snapshot: { prd_chars, file_name }`).

### POST /api/generate/semantic-link  (multipart, JSON response, maxDuration 120)

Same request shape and validation as gap-analysis. Response: `{ output: SemanticLinkOutput; provider; model; extractedChars }`. Persists `semantic_link`.

### POST /api/generate/test-data  (JSON, maxDuration 120)

```typescript
{ projectId: string; projectDescription?: string; datasetCount?: number }  // default 5, clamped to 1-20
// Response 200
{ data: TestDataOutput; provider: string; model: string }
```
Description falls back to `project.description`, then `project.name`, then `'Web application'`. `502` on AI failure. Persists `test_data`.

### POST /api/generate/launch-readiness  (JSON, no AI call, maxDuration 30)

```typescript
{ projectId: string }
// Response 200: LaunchReadinessOutput  (see Zod section; NOT persisted)
```
Thin route: auth + ownership check (`projects.user_id`, `status = 'active'`, else 404) then `loadAndComputeLaunchReadiness(projectId)` in `src/lib/services/launch-readiness.service.ts`. Pure computation from the latest `test_suite`, `ux_review`, `gap_analysis` artifacts and all complete `bug_report` artifacts; missing artifacts score 0 (test, UX) or 100 (gaps, bugs). Type-checked (`tsc` clean). vitest approved 2026-11-08; unit tests for the pure scoring function are at `src/lib/services/launch-readiness.service.test.ts` (10 passing tests).

### POST /api/generate/chat  (SSE text stream, maxDuration 60)

```typescript
// Request
{ projectId: string; messages: { role: 'user' | 'assistant'; content: string }[] }  // only the last 50 are used
// SSE events (note: no 'meta' event)
{ type: 'delta'; text: string }
{ type: 'done' }
{ type: 'error'; message: string }
```
Uses `streamText` with `getModel('reasoning_large', false)` (Groq only, no Google fallback), `maxOutputTokens: 800`, `temperature: 0.5`. Does not persist an artifact and does not write `chat_sessions`; the client persists via `/api/chat/[projectId]`.

### GET | POST | DELETE /api/chat/[projectId]  (Sidekick persistence)

```typescript
// GET    -> { messages: ChatMessage[]; updatedAt: string | null }   // active session for (project, user), else []
// POST   body { messages: ChatMessage[] }  -> { ok: true }          // upsert on (project_id,user_id); keeps last 200; sets is_active = true
// DELETE -> { ok: true }                                            // upserts messages = [] and is_active = false (soft clear)
// ChatMessage = { role: 'user'|'assistant'; content: string; timestamp: string }
```
GET/POST/DELETE call `ownsProject(projectId, user.id)` (admin client, checks `projects.user_id`) and return 404 `Project not found` if the project is not owned. POST/DELETE rely on the `UNIQUE (project_id, user_id)` constraint, which exists on a DB that ran 001 first only after migration 003 is applied (see chat_sessions caveat; not yet applied).

### POST /api/generate/estimate  (JSON, maxDuration 30)

```typescript
{ projectId: string; featureType?: 'test_suite' | 'ux_review' /* default 'test_suite' */ }
// Response 200
{ estimatedTokens: number; hasScreens: boolean }   // { 0, false } when no analyzed screens
```
`400` if `featureType` is not one of the two values.

### GET /api/artifacts/stale?projectId=&artifactType=

```typescript
// Response 200
{ stale: false; exists: false }                                        // no latest artifact of that type
{ stale: boolean; exists: true; prompt_version: string | null; created_at: string }
```
`stale = isStale(prompt_version)`: `true` when the version is null/empty or below `MIN_FRESH_VERSION`. `400` if either param is missing; `404` if the project is not found.

### GET /api/artifacts/ux-history/[projectId]

```typescript
// Response 200 - up to the 20 most recent complete ux_review artifacts, oldest -> newest
{ points: { id: string; created_at: string; score: number; provider: string; model: string }[] }
```
Rows whose `content.overall_score` is not a number are dropped. Does not filter on `is_latest`. Feeds the recharts score-history chart in `UXAuditClient.tsx`.

### POST /api/assets/upload  (multipart, **snake_case** fields)

```typescript
// Request: FormData
file: File            // already-compressed WebP; max 200 KB (413 otherwise)
project_id: string
sha256: string        // client-computed exact hash (required)
pHash?: string        // 64-bit perceptual hash; empty string tolerated
original_name?: string
label?: string
// Response
201 { asset: ProjectAsset; fromCache: false }   // new upload
200 { asset: ProjectAsset; fromCache: true }    // same (project_id, sha256) already exists
```
Stores to bucket `project-assets` at `{user_id}/{project_id}/{sha256}.webp`, inserts a `project_assets` row (`metadata: { label, vision_map_status: 'pending' }`, `is_dirty: true`, `is_verified: false`) and schedules Shadow Scout via `after()`, which writes a `vision_map` artifact and sets `metadata.vision_map_status` to `'ready'` (and `is_verified: true`) or `'failed'`. The route is not "thin" (about 150 lines).

### GET /api/assets/signed-url?path=

```typescript
// Response 200
{ url: string }   // signed URL, 60 s TTL, bucket project-assets
```
`400` if `path` is missing; `403` if the first path segment is not the caller's user id and no `project_assets` row with that `storage_path` belongs to the caller.

### PATCH /api/assets/[assetId]

```typescript
{ label: string }   // non-empty
// Response 200
{ ok: true; metadata: Record<string, unknown> }   // metadata.label updated
```

### PATCH /api/projects/[projectId]/settings

```typescript
// Request - whitelisted fields only; at least one required
{ extended_providers_enabled?: boolean; description?: string; scope?: string }
// Response 200
{ ok: true; contextChanged: boolean }
```
If `description` or `scope` actually changes value, all of the project's `project_assets` are flagged `is_dirty = true` (checked only when a context field is present in the body). Field values are not type-validated.

---

## Zustand Store Interfaces

Stores live in `src/lib/stores/` (not top-level `src/stores/`; an empty `src/stores/` directory exists and is unused).

### Generation Store (`src/lib/stores/generation.store.ts`, `useGenerationStore`)

Currently scoped to **test-case generation** (it stores `TestCase[]`). The UX, persona and i18n features use their own hooks (`src/lib/hooks/useStream*.ts`) and component state rather than this store.

```typescript
type GenerationStatus = 'idle' | 'starting' | 'streaming' | 'judging' | 'complete' | 'partial' | 'error';

interface GenerationMeta { provider: string; model: string; estimatedTokens: number }

interface GenerationState {
  status:          GenerationStatus;
  cases:           TestCase[];        // final cases (after Judge / done)
  streaming:       TestCase[];        // live, unverified cases during stream
  partial:         boolean;
  meta:            GenerationMeta | null;
  error:           string | null;
  buffer:          string;
  resumeFrom:      number | null;
  coverageSummary: string;

  start:             () => void;
  setMeta:           (meta: GenerationMeta) => void;            // also sets status 'streaming'
  appendBuffer:      (text: string) => void;
  setStreamingCases: (cases: TestCase[]) => void;
  setFinalCases:     (cases: TestCase[], coverageSummary?: string) => void;
  setPartial:        (fromIndex: number) => void;
  setError:          (msg: string) => void;
  startJudge:        () => void;
  complete:          () => void;
  reset:             () => void;
}
```

### Rate Limit Store (`src/lib/stores/rate-limit.store.ts`, `useRateLimitStore`)

Defined but **not imported anywhere** (verified by grep): no component or hook reads or writes it yet.

```typescript
type QueueStatus = 'idle' | 'running' | 'rate_limited' | 'queued' | 'error';
interface QueuedJob { id: string; label: string; provider: string; enqueued: number }

interface RateLimitState {
  status:      QueueStatus;
  queue:       QueuedJob[];
  retryAfter:  number | null;   // epoch ms when GROQ unblocks
  totalQueued: number;
  totalRan:    number;

  enqueue:       (job: Omit<QueuedJob, 'enqueued'>) => void;
  dequeue:       (id: string) => void;
  setStatus:     (s: QueueStatus) => void;
  setRetryAfter: (ms: number) => void;
  clearRetry:    () => void;
  reset:         () => void;
}
// plus helper: secondsUntilReset(retryAfter: number | null): number
```
