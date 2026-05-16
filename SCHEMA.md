# Tesifye — Data Schema & Contracts

> **Purpose:** Every data structure in the system: SQL tables, Zod schemas, TypeScript interfaces, system prompts, and API contracts. Any agent reads this to understand DATA shape.
> **Related files:** [ARCHITECTURE.md](./ARCHITECTURE.md) (HOW) · [SCOPE.md](./SCOPE.md) (WHAT) · [PHASES.md](./PHASES.md) (WHEN)

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
  -- settings.extended_providers: boolean (opt-in for Google/Cerebras fallback)
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
  description TEXT NOT NULL,
  scope TEXT,
  target_audience TEXT,
  app_type TEXT CHECK (app_type IN ('mobile', 'web', 'desktop', 'responsive', 'pwa')),
  user_role TEXT CHECK (user_role IN ('manual_tester', 'automation_engineer', 'qa_lead', 'product_manager', 'ux_designer')),
  platform TEXT CHECK (platform IN ('ios', 'android', 'web', 'cross_platform')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  manifest_snapshot JSONB DEFAULT '{}',
  -- manifest_snapshot structure:
  -- {
  --   latest_test_suite: { artifact_id, tc_count, coverage_score, generated_at },
  --   latest_ux_review: { artifact_id, overall_score, issues_count, generated_at },
  --   latest_gap_analysis: { artifact_id, gaps_count, generated_at },
  --   screen_count: number,
  --   last_generation_at: timestamptz
  -- }
  extended_providers_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_projects_user ON projects(user_id);
```

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
  -- metadata.order: number (display order)
  -- metadata.dimensions: { width: number, height: number }
  -- metadata.vision_map_status: 'pending' | 'ready' | 'stale' (Phase 2)
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
  version INTEGER DEFAULT 1,           -- Increments per artifact_type per project
  content JSONB NOT NULL,              -- The actual AI output (Zod-validated)
  input_snapshot JSONB DEFAULT '{}',    -- Frozen copy of inputs used for this generation
  -- input_snapshot.description, input_snapshot.scope, etc.
  prompt_version TEXT DEFAULT 'v1.0',   -- Tracks which prompt template was used
  model_used TEXT NOT NULL,             -- e.g., 'groq:llama-3.3-70b-versatile'
  provider TEXT NOT NULL,               -- 'groq', 'google', 'cerebras'
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

-- Trigger: Set previous versions to is_latest=FALSE when new one inserted
CREATE OR REPLACE FUNCTION handle_new_artifact() RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous artifacts of same type in same project as not latest
  UPDATE generated_artifacts
    SET is_latest = FALSE
    WHERE project_id = NEW.project_id
      AND artifact_type = NEW.artifact_type
      AND id != NEW.id
      AND is_latest = TRUE;
  
  -- Update the project's manifest_snapshot
  UPDATE projects
    SET manifest_snapshot = jsonb_set(
      COALESCE(manifest_snapshot, '{}'),
      ARRAY[NEW.artifact_type],
      jsonb_build_object(
        'artifact_id', NEW.id,
        'generated_at', NEW.created_at,
        'model_used', NEW.model_used,
        'is_verified', NEW.is_verified
      )
    ),
    updated_at = NOW()
    WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_artifact_insert
  AFTER INSERT ON generated_artifacts
  FOR EACH ROW EXECUTE FUNCTION handle_new_artifact();
```

### Table: chat_sessions (Phase 2/5)
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  messages JSONB DEFAULT '[]',
  -- messages: Array<{ role: 'user'|'assistant', content: string, timestamp: string }>
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own chats" ON chat_sessions FOR ALL USING (auth.uid() = user_id);
```

### Supabase Storage Bucket
```
Bucket: testifye-assets (public: false)

Structure:
  {user_id}/
    {project_id}/
      screenshots/
        {content_hash}.webp
      docs/
        {timestamp}_{filename}.pdf
```

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

export type TestCase = z.infer<typeof TestCaseSchema>;
export type TestSuiteOutput = z.infer<typeof TestSuiteOutputSchema>;
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
    whitespace_ratio: z.number().optional().describe('Percentage of screen area that is whitespace'),
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
  steps_to_reproduce: z.array(z.string()).describe('Plain-string steps (not numbered objects)'),
  expected_result: z.string(),
  actual_result: z.string(),
  frequency: z.enum(['always', 'often', 'sometimes', 'rarely', 'once']),
  root_cause_hypothesis: z.string().describe('AI-inferred probable root cause'),
  suggested_fix: z.string(),
  labels: z.array(z.string()).default([]).describe('Searchable tags e.g. ["checkout","payments","android"]'),
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
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  location: z.string().describe('PRD section reference e.g. §2.4 vs §4.1'),
  description: z.string(),
  suggestion: z.string(),
});

export const GapAnalysisOutputSchema = z.object({
  findings: z.array(GapFindingSchema),
  requirements_count: z.number().describe('Total requirements parsed from PRD'),
  summary: z.object({
    contradictions: z.number(),
    missing_flows: z.number(),
    ambiguities: z.number(),
    untestable: z.number(),
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
  status: z.enum([
    'verified',   // Element found and behavior matches requirement
    'missing',    // Element not found in any analyzed screen
    'mismatch',   // Element present but behavior contradicts requirement
    'untested',   // Backend/server concern — no UI evidence possible
  ]),
  confidence: z.number().min(0).max(1).describe('Match confidence 0–1; color threshold: >0.8 green, >0.5 yellow, else gray'),
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
```

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
  recommended_locales: z.array(z.string()).describe('Suggested priority test locales based on findings'),
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

---

## System Prompts

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

### POST /api/generate/test-cases

**Request Body:**
```typescript
{
  project_id: string;           // UUID
  focus_areas?: string[];       // Optional filter
  regenerate?: boolean;         // Force regeneration even if cached
}
```

**Response:** Server-Sent Events (SSE) stream of partial `TestSuiteOutput`.

**Headers:** `Content-Type: text/event-stream`

---

### POST /api/generate/ux-audit

**Request Body:**
```typescript
{
  project_id: string;
  audit_focus?: string;         // 'full' | 'onboarding' | 'checkout' | ...
}
```

**Response:** SSE stream of partial `UXReviewOutput`.

---

### POST /api/generate/bug-report

**Request Body:**
```typescript
{
  project_id: string;
  bug_description: string;
  device_context?: { os: string; browser: string; screen_size: string };
  screenshot_ids?: string[];
}
```

**Response:** SSE stream of `BugReport`.

---

### POST /api/assets/upload

**Request Body:** `FormData` with:
- `file`: File (image or document)
- `project_id`: string
- `label`: string (optional)

**Response:**
```typescript
{ success: true, asset: ProjectAsset }
```

**Side effect:** In Phase 2, fires `after()` to run Shadow Scout.

---

### GET /api/projects (authenticated)

**Response:**
```typescript
{ projects: Project[] }
```

---

## Zustand Store Interfaces

### Generation Store

```typescript
// stores/generation.store.ts
interface GenerationState {
  currentArtifact: Partial<TestSuiteOutput | UXReviewOutput | BugReport> | null;
  status: 'idle' | 'streaming' | 'verifying' | 'complete' | 'partial' | 'error';
  completedItems: number;
  estimatedTotal: number;
  errorMessage: string | null;

  startGeneration: () => void;
  handleStreamChunk: (partial: Record<string, unknown>) => void;
  handleStreamComplete: () => void;
  handleStreamError: (error: Error) => void;
  handleVerification: (verified: Record<string, unknown>) => void;
  resumeGeneration: () => void;
  keepPartial: () => void;
  reset: () => void;
}
```

### Rate Limit Store

```typescript
// stores/rate-limit.store.ts
interface RateLimitState {
  queues: Record<string, PendingRequest[]>;
  cooldowns: Record<string, number>;
  tokenBudgets: Record<string, { used: number; limit: number; resetsAt: number }>;
  activeProvider: Record<string, string>;

  enqueue: (model: string, request: PendingRequest) => void;
  processNext: (model: string) => void;
  recordUsage: (model: string, tokens: number) => void;
  setActiveProvider: (task: string, provider: string) => void;
  canSend: (model: string) => boolean;
}
```
