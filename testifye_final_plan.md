# Tesifye — Final Implementation Plan (Locked v1.2)

> **Status:** Architecture finalized. Ready for scaffolding.
> **Stack:** Next.js 15 (App Router) · Supabase (Auth + Postgres + Storage) · TypeScript · GROQ + Google AI + Cerebras · Vercel AI SDK
> **Constraint:** No standalone backend. All server logic lives in Next.js Route Handlers (serverless).
> **Aesthetic:** Premium Glassmorphic — Deep Obsidian (#0D0D0D) + Frost White (#F2F2F2) + Electric Violet (#7C3AED)
> **Changelog:** v1.2 — Added service layer, streaming-first convention, system prompts, Shadow Scout, partial stream recovery.

---

## Table of Contents

1. [Architecture](#-architecture)
2. [Database Schema](#-database-schema)
3. [Image Pipeline](#-image-pipeline)
4. [The AI Brain: Multimodal Context Weaver](#-the-ai-brain-multimodal-context-weaver)
5. [GROQ Model Routing](#-groq-model-routing)
6. [Multi-Provider Fallback](#-multi-provider-fallback)
7. [Rate Limit Orchestrator](#-rate-limit-orchestrator)
8. [Context Budget & Semantic Truncation](#-context-budget--semantic-truncation)
9. [Feature 1: Test Case Generator](#-feature-1-test-case-generator)
10. [Feature 2: UX/UI Auditor](#-feature-2-uxui-auditor)
11. [Feature 3: Bug Report Formatter](#-feature-3-bug-report-formatter)
12. [Feature 4: Requirement Gap Finder](#-feature-4-requirement-gap-finder)
13. [Feature 5: Semantic Link — PRD↔UI Verification](#-feature-5-semantic-link--prdui-verification)
14. [Feature 6: Synthetic Test Data Generator](#-feature-6-synthetic-test-data-generator)
15. [Feature 7: Sidekick Contextual Chat](#-feature-7-sidekick-contextual-chat)
16. [Feature 8: Export Engine](#-feature-8-export-engine)
17. [Feature 9: Persona Friction Analysis](#-feature-9-persona-friction-analysis)
18. [Feature 10: Internationalization Audit](#-feature-10-internationalization-audit)
19. [Auth Architecture](#-auth-architecture)
20. [Visual Identity](#-visual-identity)
21. [Data Privacy Controls](#-data-privacy-controls)
22. [Implementation Phases](#-implementation-phases)
23. [Dependencies](#-dependencies)
24. [Risks & Mitigations](#-risks--mitigations)
25. [Environment Variables](#-environment-variables)

---

## 📐 Architecture

### High-Level Flow: CQRS-Inspired

```
Browser (React + Zustand)
  │
  ├─ Layer 1: IndexedDB (idb-keyval)
  │   └─ Ephemeral image cache, draft project state
  │   └─ SHA-256 pixel hash for deduplication
  │
  ├─ Layer 2: Supabase Client SDK (RLS-guarded)
  │   ├─ Postgres (Command Side)
  │   │   └─ generated_artifacts (individual rows — source of truth, full history)
  │   ├─ Postgres (Query Side)
  │   │   └─ projects.manifest_snapshot (JSONB — computed read cache)
  │   └─ Supabase Storage
  │       └─ Compressed WebP screenshots + PDFs
  │
  └─ Layer 3: Next.js Route Handlers (/api/*)
      ├─ Provider Registry (ai SDK)
      │   ├─ Primary:  @ai-sdk/groq  → GROQ (fastest, free)
      │   ├─ Fallback: @ai-sdk/google → Google AI Studio (free, vision-capable)
      │   └─ Fallback: Cerebras API   → Cerebras (free, 1M tokens/day, text-only)
      ├─ generateObject / streamObject → zod schemas → typed structured output
      └─ Rate Limit Queue (Zustand, client-side)
```

### Project Directory Convention: Service-Oriented Architecture

Route handlers are **thin controllers**. All business logic lives in `lib/`.

```
src/
├── app/
│   ├── api/                          # Route Handlers (thin — validate, call service, respond)
│   │   ├── generate/
│   │   │   ├── test-cases/route.ts    # ~20 lines: parse body → call weaver → stream response
│   │   │   ├── ux-audit/route.ts
│   │   │   └── bug-report/route.ts
│   │   └── assets/
│   │       └── upload/route.ts        # Upload + Shadow Scout via after()
│   ├── (auth)/                        # Auth pages (login, signup)
│   ├── dashboard/                     # Protected pages
│   └── layout.tsx
├── lib/
│   ├── ai/                            # ★ AI Brain
│   │   ├── providers.ts               # Provider registry (GROQ + Google + Cerebras)
│   │   ├── generate-with-fallback.ts  # Multi-provider fallback utility
│   │   ├── weaver.service.ts          # Orchestrates Scout → Generator → Judge pipeline
│   │   ├── context-budget.ts          # Semantic truncation + token estimation
│   │   └── prompts/                   # System prompt templates
│   │       ├── scout.ts
│   │       ├── generator.ts
│   │       └── judge.ts
│   ├── supabase/                      # Supabase client factories
│   │   ├── client.ts                  # Browser client
│   │   ├── server.ts                  # Server client (cookies)
│   │   └── admin.ts                   # Service role client
│   ├── schemas/                       # Zod schemas (shared between API + UI)
│   │   ├── test-case.ts
│   │   ├── ux-review.ts
│   │   ├── bug-report.ts
│   │   └── screen-element-map.ts
│   ├── services/                      # Non-AI business logic
│   │   ├── project.service.ts
│   │   ├── asset.service.ts
│   │   └── export.service.ts
│   └── utils/                         # Pure utilities
│       ├── hash.ts                    # SHA-256 + pHash
│       ├── compression.ts             # browser-image-compression wrapper
│       └── token-estimator.ts
├── stores/                            # Zustand stores
│   ├── rate-limit.store.ts
│   └── generation.store.ts            # Optimistic UI + partial stream state
├── components/                        # UI components
└── styles/                            # CSS
```

**Why this matters:**
- Swapping models = edit `providers.ts` or `weaver.service.ts`, not 10 route handlers
- Unit testing = test services without HTTP mocking
- AI agents working on the codebase follow this structure as convention

### The Hybrid Manifest (CQRS Approach)

**Command Side (Truth):** Every AI generation creates a new row in `generated_artifacts`. Full audit trail. "Time travel" for any artifact.

**Query Side (Read):** A `manifest_snapshot` JSONB column on `projects` provides fast single-query access to the latest state.

**Sync Mechanism:** A Postgres trigger (or a Next.js background update after artifact insert) updates `manifest_snapshot` whenever a new artifact is created.

```sql
-- Simplified trigger concept
CREATE OR REPLACE FUNCTION update_manifest_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET manifest_snapshot = (
    SELECT jsonb_build_object(
      'latest_test_cases', (SELECT output FROM generated_artifacts 
        WHERE project_id = NEW.project_id AND artifact_type = 'test_cases' 
        ORDER BY created_at DESC LIMIT 1),
      'latest_ux_review', (SELECT output FROM generated_artifacts 
        WHERE project_id = NEW.project_id AND artifact_type = 'ux_review' 
        ORDER BY created_at DESC LIMIT 1),
      'latest_vision_map', (SELECT output FROM generated_artifacts 
        WHERE project_id = NEW.project_id AND artifact_type = 'vision_map' 
        ORDER BY created_at DESC LIMIT 1),
      'updated_at', NOW()
    )
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_manifest
AFTER INSERT ON generated_artifacts
FOR EACH ROW EXECUTE FUNCTION update_manifest_snapshot();
```

**Why not just a single JSONB blob?**
- Individual rows = history, rollback, comparison between runs
- Queryable across projects ("show all critical UX issues")  
- No concurrency race conditions on a single document
- Manifest snapshot = convenience layer, not source of truth

---

## 🗄️ Database Schema

```sql
-- =========================================
-- CORE TABLES
-- =========================================

CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  app_type          TEXT NOT NULL CHECK (app_type IN ('mobile', 'web', 'desktop', 'cross-platform')),
  platform          TEXT CHECK (platform IN ('ios', 'android', 'both', 'web', 'electron', null)),
  description       TEXT,
  scope             TEXT,
  target_audience   TEXT,
  tester_role       TEXT NOT NULL CHECK (tester_role IN ('manual', 'automation', 'pm', 'lead')),
  status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  manifest_snapshot JSONB DEFAULT '{}',          -- CQRS read cache
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path   TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  file_size      INTEGER,
  asset_type     TEXT NOT NULL CHECK (asset_type IN ('screenshot', 'prd', 'wireframe', 'flow_diagram')),
  content_hash   TEXT,                            -- SHA-256 for dedup
  context_label  TEXT,                            -- user-provided label: "Login Screen", "Checkout Flow"
  is_dirty       BOOLEAN DEFAULT false,           -- true when PRD changes but screen not re-analyzed
  metadata       JSONB DEFAULT '{}',              -- { width, height, vision_map_artifact_id }
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_artifacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  artifact_type    TEXT NOT NULL CHECK (artifact_type IN (
    'test_cases', 'ux_review', 'bug_report', 'test_data', 
    'gap_analysis', 'vision_map', 'semantic_links', 'persona_friction',
    'i18n_audit', 'gherkin'
  )),
  model_used       TEXT NOT NULL,
  prompt_version   TEXT NOT NULL DEFAULT '1.0',    -- track prompt changes
  input_snapshot   JSONB,                          -- what was sent to the model
  output           JSONB NOT NULL,                 -- structured AI output
  is_verified      BOOLEAN DEFAULT false,          -- passed the Judge pipeline
  token_count      INTEGER,
  generation_time_ms INTEGER,                      -- latency tracking
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  artifact_id   UUID REFERENCES generated_artifacts(id),
  format        TEXT NOT NULL CHECK (format IN ('csv', 'json', 'markdown', 'gherkin', 'jira', 'linear')),
  storage_path  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- All tables follow this pattern
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "users_own_assets" ON project_assets
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "users_own_artifacts" ON generated_artifacts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "users_own_exports" ON exports
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_artifacts_project_type ON generated_artifacts(project_id, artifact_type);
CREATE INDEX idx_artifacts_created ON generated_artifacts(created_at DESC);
CREATE INDEX idx_assets_project ON project_assets(project_id);
CREATE INDEX idx_assets_hash ON project_assets(content_hash);
```

---

## 🖼️ Image Pipeline

### 4-Layer Strategy with Dual-Hash Deduplication

```
Layer 1: CAPTURE + DUAL HASH
  User drops/uploads images
  ↓
  crypto.subtle.digest('SHA-256', arrayBuffer)  →  exact_hash
  ↓
  Check: does exact_hash exist in project_assets?
    YES → skip entirely (reuse existing asset, zero cost)
    NO  ↓

Layer 2: PERCEPTUAL SIMILARITY CHECK
  Canvas 8×8 downscale → grayscale → luminance threshold → pHash (64-bit)
  ↓
  Hamming distance vs existing assets in project:
    distance < 10 → "Similar image detected. Replace existing?" (user decides)
    distance ≥ 10 → compress with browser-image-compression
  ↓

Layer 3: CACHE (ephemeral)
  idb-keyval (IndexedDB)  →  keyed by {project_id}:{exact_hash}
  ↓
  Survives page refresh. Cleared on explicit save or eviction.

Layer 4: PROMOTE (on save / tab switch / generation trigger)
  Read from IndexedDB
  ↓ Upload to Supabase Storage (already compressed)
  ↓ Insert row into project_assets with storage_path + content_hash
  ↓ Clear from IndexedDB
```

### Perceptual Hash Implementation (Zero Dependencies)
```typescript
// ~30 lines, runs in browser, no npm package needed
async function computePerceptualHash(blob: Blob): Promise<string> {
  const img = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(8, 8);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 8, 8);
  const { data } = ctx.getImageData(0, 0, 8, 8);
  
  // Convert to grayscale luminance values
  const grays: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    grays.push(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
  }
  
  // Average threshold → 64-bit hash
  const avg = grays.reduce((a, b) => a + b, 0) / grays.length;
  return grays.map(g => g >= avg ? '1' : '0').join('');
}

function hammingDistance(a: string, b: string): number {
  let dist = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) dist++;
  return dist;
}
```

### Compression Config
```typescript
const COMPRESSION_CONFIG = {
  maxSizeMB: 0.15,            // 150KB post-compression
  maxWidthOrHeight: 1024,     // 1024px max dimension
  useWebWorker: true,         // non-blocking
  fileType: 'image/webp',
  initialQuality: 0.75,
};
```

### Supabase Storage Layout
```
testifye-assets/
  {user_id}/
    {project_id}/
      screenshots/
        {content_hash}.webp
      docs/
        {timestamp}_{filename}.pdf
```

### Sending to GROQ Vision
- **From Supabase Storage:** Generate signed URL (1hr TTL) → pass URL to GROQ
- **From IndexedDB (pre-save):** Read as base64 from IDB → send inline to GROQ
- **Max 10 images per generation call** — more than that degrades quality and hits token limits

### "Dirty" State
When project description or scope is updated after assets were already analyzed:
- Set `is_dirty = true` on all `project_assets` for that project
- UI shows a subtle pulsing violet glow on dirty screens
- Prompt user: "These screenshots were analyzed before your latest scope changes. Re-analyze?"

---

## 🧠 The AI Brain: Multimodal Context Weaver

This is Tesifye's core differentiator. Instead of isolated prompts per feature, all AI calls share a unified context pipeline.

### The 3-Stage Pipeline: Scout → Generator → Judge

```
Stage 1: SCOUT (Vision Pre-Processing)
  Model: llama-4-scout-17b
  Input: Each screenshot individually
  Output: ScreenElementMap (JSON)
  Purpose: "What's on this screen?"
  ↓

Stage 2: GENERATOR (Reasoning)
  Model: llama-3.3-70b-versatile (or maverick for UX)
  Input: Project context + ScreenElementMaps + user request
  Output: Structured artifact (test cases, UX review, etc.)
  Purpose: "What should this app do / what's wrong with it?"
  ↓

Stage 3: JUDGE (Verification)
  Model: llama-3.1-8b-instant
  Input: Generated artifact + ScreenElementMaps
  Output: Verified artifact (hallucinated steps removed/corrected)
  Purpose: "Did the generator reference things that actually exist on screen?"
```

### ScreenElementMap Schema (Scout Output)

```typescript
interface ScreenElementMap {
  screen_label: string;        // "Login Screen" (user-provided or AI-inferred)
  description: string;         // "A centered form with email/password fields..."
  elements: Array<{
    type: 'button' | 'input' | 'link' | 'nav' | 'text' | 'image' | 'icon' | 'toggle' | 'dropdown' | 'modal';
    label: string;             // "Sign In", "Email", "Forgot Password?"
    inferred_function: string; // "Submits login credentials", "Opens password reset flow"
    location: string;          // "top-right", "center", "bottom-nav"
    is_interactive: boolean;
  }>;
  inferred_flow: string;       // "This screen is an authentication entry point"
  platform_signals: {
    is_mobile: boolean;
    has_bottom_nav: boolean;
    has_hamburger_menu: boolean;
  };
}
```

### Judge Verification Logic

```typescript
// Pseudocode for the Judge step
function judgeTestCases(testCases: TestCase[], visionMaps: ScreenElementMap[]): VerifiedTestCase[] {
  // For each test step that references a UI element:
  //   1. Search all ScreenElementMaps for a matching element
  //   2. If found → mark step as "verified"
  //   3. If NOT found → send back to generator with:
  //      "Element '{label}' not found on any analyzed screen. 
  //       Available elements: [...]. Re-generate this step."
  //   4. If re-generation still fails → mark as "unverified" with note
}
```

### System Prompt Templates (v1.2 Addition)

These prompts define the **contract** between the three pipeline stages. All three must agree on the ScreenElementMap JSON format.

#### Scout System Prompt
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

#### Generator System Prompt
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
- Adapt your language and detail level to the user's role (manual tester vs automation engineer vs PM)
- Be specific and actionable — never generic advice like "test edge cases"
- Include preconditions that a real tester would need to know
- When generating test steps, make them executable by someone who has never seen the app

Output format: Structured JSON (defined by the provided Zod schema).`;
}
```

#### Judge System Prompt
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
5. Remove or flag impossible steps (e.g., "Click the search icon" when no search icon exists)

Output: The same artifact structure, with 'verified' booleans set and hallucinated items flagged.`;
```

### Streaming-First Convention (v1.2 Addition)

All user-facing generation uses `streamObject` (not `generateObject`). The Judge is the only exception — it needs the complete artifact to verify.

```
User clicks "Generate" →
  ┌─ UI: Immediately show skeleton cards  [TC-001 ████████]
  │                                        [TC-002 ████████]
  │
  ├─ Server: streamObject (Generator) begins
  │   ↓ partial object emitted
  │   → Zustand store merges partial → card [TC-001] fades in with content
  │   ↓ next partial
  │   → card [TC-002] fades in
  │   ↓ stream complete
  │
  ├─ Server: generateObject (Judge) runs on complete output
  │   ↓ returns verified artifact
  │   → UI updates: green ✓ badges appear on verified cards
  │
  └─ Done: Full artifact saved to generated_artifacts
```

**Optimistic UI Rules:**
- Skeleton cards appear **immediately** on button click (before any API response)
- Each card transitions skeleton → content via `framer-motion` `AnimatePresence`
- If stream fails mid-generation, partial output is preserved (see Partial Stream Recovery)
- The Judge runs as a **separate, non-blocking step** after streaming completes
- Judge results are applied as badge overlays, not as content replacements

### Partial Stream Recovery (v1.2 Addition)

When `streamObject` fails mid-stream (network drop, provider timeout):

```typescript
// stores/generation.store.ts
interface GenerationState {
  currentArtifact: Partial<TestCaseOutput> | null;
  status: 'idle' | 'streaming' | 'verifying' | 'complete' | 'partial' | 'error';
  completedItems: number;    // e.g., 5 test cases received before failure
  estimatedTotal: number;    // e.g., ~12 estimated from prompt
  errorMessage: string | null;
  
  // Actions
  handleStreamChunk: (partial: Partial<TestCaseOutput>) => void;
  handleStreamError: (error: Error) => void;
  resumeGeneration: () => void;  // Re-trigger with context: "Continue from TC-005..."
  keepPartial: () => void;       // Save what we have as-is
}
```

**UI behavior:**
- Status changes to `'partial'`
- Banner: "Generation interrupted — 5 of ~12 test cases generated."
- Two buttons: **[Resume Generation]** and **[Keep Partial Results]**
- "Resume" sends a follow-up prompt: "Continue generating from TC-006. Previous test cases: [...]"
- "Keep Partial" saves what exists with `is_verified: false` and a note

### Shadow Scout — Background Pre-Processing (v1.2 Addition, Phase 2)

In Phase 1, Scout runs on-demand as part of the Generate pipeline. In Phase 2, we add background pre-processing using the Next.js `after()` API:

```typescript
// app/api/assets/upload/route.ts
import { after } from 'next/server';

export async function POST(request: Request) {
  // 1. Validate, compress, store image (blocking — user waits for this)
  const asset = await processAndStoreAsset(request);
  
  // 2. Schedule Scout analysis (non-blocking — runs after response sent)
  after(async () => {
    const visionMap = await weaverService.runScout(asset.id, asset.storagePath);
    // Saved as generated_artifact with type: 'vision_map'
    // UI will show a subtle "✓ Analyzed" badge when complete
  });
  
  // 3. Return immediately — user doesn't wait for Scout
  return Response.json({ success: true, asset });
}
```

**Phase 2 Rules:**
- Shadow Scout is opt-in (only runs if user has GROQ credits remaining)
- If user clicks "Generate" before Shadow Scout finishes, the on-demand Scout runs instead
- `project_assets.metadata` tracks `vision_map_status: 'pending' | 'ready' | 'stale'`
- Rate limit queue treats Shadow Scout as lowest priority (user actions > background)

---

## 🤖 GROQ Model Routing

### Model Registry
```typescript
const MODEL_REGISTRY = {
  // Vision
  vision_scout:     'meta-llama/llama-4-scout-17b-16e-instruct',
  
  // Heavy reasoning
  reasoning_large:  'llama-3.3-70b-versatile',
  ux_narrative:     'meta-llama/llama-4-maverick-17b-128e-instruct',
  long_context:     'mixtral-8x7b-32768',
  
  // Fast / cheap
  fast_format:      'llama-3.1-8b-instant',
  quick_labels:     'gemma2-9b-it',
} as const;

const FEATURE_MODEL_MAP = {
  // Stage 1: Scout
  screenshot_analysis:    MODEL_REGISTRY.vision_scout,
  
  // Stage 2: Generator
  test_case_generation:   MODEL_REGISTRY.reasoning_large,
  ux_heuristic_review:    MODEL_REGISTRY.ux_narrative,
  gap_analysis:           MODEL_REGISTRY.long_context,
  persona_friction:       MODEL_REGISTRY.reasoning_large,
  i18n_audit:             MODEL_REGISTRY.reasoning_large,
  
  // Stage 3: Judge
  verification:           MODEL_REGISTRY.fast_format,
  
  // Standalone (no judge needed)
  bug_formatting:         MODEL_REGISTRY.fast_format,
  test_data_generation:   MODEL_REGISTRY.fast_format,
  gherkin_conversion:     MODEL_REGISTRY.fast_format,
  sidekick_chat:          MODEL_REGISTRY.reasoning_large,
} as const;
```

---

## 🔄 Multi-Provider Fallback

### The Problem (v1.0 Gap)
GROQ free tier has ~30 RPM (8B models) and ~1,000 RPD (70B models). Our 3-stage pipeline means 3x calls per generation. A power user running 10 generations + 3 audits/day will hit daily limits.

**v1.0's approach** was to queue and retry. **v1.1 solves it structurally** — if GROQ is exhausted, the system silently routes to a free alternative. The user never sees a 429.

### Free Provider Landscape (April 2026)

| Provider | Free Tier | Vision? | Structured Output? | Latency | Daily Budget |
|---|---|---|---|---|---|
| **GROQ** | No CC needed | ✅ Llama-4-Scout | ✅ via AI SDK | ~200ms | ~500K tokens (70B) |
| **Google AI Studio** | No CC needed | ✅ Gemini native | ✅ native JSON schema | ~800ms | ~1M tokens (Flash) |
| **Cerebras** | No CC needed | ❌ Text only | ✅ JSON schema | ~150ms | ~1M tokens |

### Provider Registry (Vercel AI SDK)

```typescript
// lib/ai/providers.ts
import { createProviderRegistry, customProvider } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

export const registry = createProviderRegistry({
  groq,
  google,
});

// Fallback chains per task type
export const FALLBACK_CHAINS = {
  // Vision tasks: GROQ first (Scout), Google if rate-limited
  vision: [
    { provider: 'groq',   model: 'meta-llama/llama-4-scout-17b-16e-instruct' },
    { provider: 'google', model: 'gemini-2.5-flash' },
  ],
  
  // Heavy reasoning: GROQ first, Cerebras if rate-limited
  reasoning: [
    { provider: 'groq',   model: 'llama-3.3-70b-versatile' },
    { provider: 'google', model: 'gemini-2.5-flash' },
    // Cerebras: add when @ai-sdk/cerebras is available
    // { provider: 'cerebras', model: 'llama-3.3-70b' },
  ],
  
  // Fast tasks: GROQ 8B first, Google Flash if needed
  fast: [
    { provider: 'groq',   model: 'llama-3.1-8b-instant' },
    { provider: 'google', model: 'gemini-2.5-flash' },
  ],
} as const;
```

### Fallback Logic in Route Handlers

```typescript
// lib/ai/generate-with-fallback.ts
import { generateObject } from 'ai';
import { registry, FALLBACK_CHAINS } from './providers';

export async function generateWithFallback<T>(
  chain: keyof typeof FALLBACK_CHAINS,
  options: { schema: ZodSchema<T>; prompt: string; system: string; images?: string[] }
): Promise<{ result: T; provider: string; model: string }> {
  const providers = FALLBACK_CHAINS[chain];
  
  for (const { provider, model } of providers) {
    try {
      const result = await generateObject({
        model: registry.languageModel(`${provider}:${model}`),
        schema: options.schema,
        prompt: options.prompt,
        system: options.system,
      });
      return { result: result.object, provider, model };
    } catch (error: any) {
      if (error?.statusCode === 429 || error?.message?.includes('rate')) {
        console.warn(`[Tesifye] ${provider}/${model} rate-limited, trying next...`);
        continue; // Try next provider
      }
      throw error; // Non-rate-limit errors still throw
    }
  }
  throw new Error('All providers exhausted. Please try again in a few minutes.');
}
```

### Rules
- **Primary provider (GROQ)** is always tried first — fastest inference
- **Google fallback** is only used when GROQ returns 429
- **Cerebras** is text-only — never used for vision tasks
- The `model_used` field in `generated_artifacts` records which provider/model actually served the request
- User sees: "✦ Powered by GROQ" or "✦ Powered by Google AI" badge on each artifact

---

## ⏱️ Rate Limit Orchestrator

### The Problem
GROQ free tier has per-model rate limits (RPM, TPM, RPD). Multiple features calling the same model stack and fail with 429s.

### Solution: Client-Side Queue (Zustand) + Server-Side Fallback

The rate limit system operates at two levels:
1. **Client-side (Zustand)**: Prevents sending requests we know will fail (pre-emptive)
2. **Server-side (Route Handlers)**: Multi-provider fallback catches any 429 that slips through

```typescript
interface ModelQueueState {
  queues: Record<string, PendingRequest[]>;
  cooldowns: Record<string, number>;       // ms until next allowed call
  tokenBudgets: Record<string, { used: number; limit: number; resetsAt: number }>;
  activeProvider: Record<string, string>;  // tracks which provider is currently serving
  
  enqueue: (model: string, request: PendingRequest) => void;
  processNext: (model: string) => void;
  recordUsage: (model: string, tokens: number) => void;
  setActiveProvider: (task: string, provider: string) => void;
}
```

### Behavior
- Each model has its own queue
- Before sending: check `cooldowns[model]` and `tokenBudgets[model]`
- On 429 from primary provider: server-side `generateWithFallback` silently routes to next provider
- Client records which provider responded, adjusts future queue estimates accordingly
- **UI feedback**: "Tesifye is thinking... (estimated wait: 3s)" instead of an error
- Priority: user-triggered actions > background re-analysis > manifest updates

---

## 🧮 Context Budget & Semantic Truncation

### The Problem (v1.0 Gap)
A mature project accumulates large artifacts: 10 vision maps, full test suites, UX reviews, PRD text. Injecting all of this raw into every prompt:
- Blows past token limits on smaller models
- Degrades output quality (noisy context = worse reasoning)
- Wastes tokens on stale data

### Token Budget Allocation

Every AI call follows a strict context budget:

```
  ┌─────────────────────────────────────────────────────┐
  │                TOTAL BUDGET: ~14,000 tokens          │
  ├─────────────────────────────────────────────────────┤
  │  System prompt + role instructions:      2,000 tokens │
  │  Current screen maps (latest, verbatim): 5,000 tokens │
  │  Active artifact (what we're generating): 4,000 tokens │
  │  Historical summary (compressed):        2,000 tokens │
  │  User message / query:                   1,000 tokens │
  └─────────────────────────────────────────────────────┘
  
  Remaining for generation: ~114,000 tokens (128K context)
```

### Semantic Truncation Pipeline

When cross-artifact context is needed (Sidekick chat, Semantic Link, etc.):

```typescript
async function buildCompressedHistory(
  projectId: string,
  currentArtifactType: string
): Promise<string> {
  // 1. Fetch latest artifacts (grouped by type)
  const artifacts = await getLatestArtifacts(projectId);
  
  // 2. Current artifact type → include verbatim (up to 4K)
  const current = artifacts.filter(a => a.artifact_type === currentArtifactType);
  
  // 3. All OTHER artifacts → compress via 8B model
  const others = artifacts.filter(a => a.artifact_type !== currentArtifactType);
  
  if (estimateTokens(others) > 2000) {
    // Summarize using fast model
    const summary = await generateWithFallback('fast', {
      schema: z.object({ summary: z.string() }),
      system: 'Compress the following QA artifacts into a brief summary. Keep: key findings, critical issues, test coverage gaps. Drop: individual test steps, detailed suggestions.',
      prompt: JSON.stringify(others.map(a => ({ type: a.artifact_type, output: a.output }))),
    });
    return summary.result.summary;
  }
  
  return JSON.stringify(others);
}
```

### Rules
- **Never send raw manifest_snapshot** to the AI — it's for UI reads, not AI context
- **Summarize, don't truncate** — use 8B model to compress, not naive string slicing
- **Current artifact is always verbatim** — the thing being generated/verified gets full fidelity
- **Vision maps are compact by design** — ScreenElementMap is already structured JSON, efficient for context
- Log `token_count` on every artifact to track budget creep over time

---

## ✅ Feature 1: Test Case Generator

### What It Does
Generates structured test suites from project context. The core value proposition of Tesifye.

### Inputs
| Input | Source | Required |
|---|---|---|
| Project description | `projects.description` | Yes |
| Scope | `projects.scope` | Yes |
| Target audience | `projects.target_audience` | Yes |
| Screenshots | `project_assets` → GROQ vision | No |
| Tester role | `projects.tester_role` | Yes |
| Focus areas | User checkboxes | No |

### Focus Areas (User Selectable)
```
☑ Authentication & Authorization    ☑ Payments & Transactions
☑ Forms & Validation                ☑ Navigation & Routing
☑ Search & Filtering                ☑ File Upload / Media
☑ API Error Handling                ☑ Real-time / WebSocket
☑ Onboarding / First-time UX       ☑ State Management
☑ Performance / Load                ☑ Accessibility (A11y)
☑ Offline / Network Resilience      ☑ Multi-device Sync
```

### Output Schema (Zod)
```typescript
const TestCaseSchema = z.object({
  summary: z.string().describe('What was analyzed and overall coverage'),
  test_cases: z.array(z.object({
    id: z.string().describe('Auto-generated ID like TC-001'),
    title: z.string(),
    category: z.enum(['functional', 'edge', 'negative', 'accessibility', 'performance', 'security']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    preconditions: z.array(z.string()),
    steps: z.array(z.string()),
    expected_result: z.string(),
    test_data_hints: z.array(z.string()).nullable(),
    automation_notes: z.string().nullable(),
    ui_element_refs: z.array(z.string()).nullable().describe('Element labels from ScreenElementMap'),
    verified: z.boolean().describe('Passed Judge verification'),
  })),
  coverage_summary: z.object({
    total: z.number(),
    by_category: z.record(z.string(), z.number()),
    by_priority: z.record(z.string(), z.number()),
  }),
  assumptions: z.array(z.string()).describe('What the AI assumed when info was missing'),
});
```

### Per-Role Output Adaptation

#### Manual Tester
```
- Full human-readable steps, no code
- "Click the blue Sign In button at the bottom of the form"
- Focus on: preconditions, visual cues, expected UI state
- Export priorities: Markdown checklist, CSV
```

**Edge cases for this persona:**
- Non-technical language only — never reference DOM, selectors, or API endpoints
- Steps must be completable by someone with zero technical background
- Include visual descriptions: "You should see a green success banner..."
- Flag steps that require dev tools or console access: "This test requires technical assistance"

#### Automation Engineer
```
- Steps + selector hints + framework-specific phrasing
- "Assert element with data-testid='login-btn' is visible and clickable"
- Focus on: selectors, waits, assertions, reusable fixtures
- Export priorities: Gherkin, JSON, Playwright boilerplate
```

**Edge cases for this persona:**
- Selector strategy matters: prefer `data-testid` > `aria-label` > CSS class > XPath
- If no screenshots provided, note: "Selectors are inferred — update with actual DOM attributes"
- Include setup/teardown hints: "Create test user via API before running suite"
- Flag tests that can't be automated: "Involves visual rendering / manual verification required"

#### Product Manager / Stakeholder
```
- Executive summary + priority buckets only
- "12 critical paths identified, 3 high-risk areas flagged"
- Focus on: business impact, user-facing scenarios, risk priority
- Export priorities: Markdown summary, PDF
```

**Edge cases for this persona:**
- No technical jargon. Zero. Replace "API timeout" with "The system takes too long to respond"
- Group by user journey, not by technical category
- Include business impact estimates: "If this fails, users cannot complete purchases"
- Add a "Recommended Testing Effort" estimate: "~4 hours for a single tester"

#### QA Lead
```
- Full suite + risk assessment + coverage gaps + team allocation hints
- "Recommend 2 testers spend 3 days on payment flows"
- Focus on: completeness, risk matrix, regression priority
- Export priorities: CSV (for test management tools), JSON
```

**Edge cases for this persona:**
- Include coverage matrix: feature vs test type
- Flag regression candidates: "These tests should be in every release cycle"
- Suggest test grouping for parallel execution
- Identify dependencies between test cases

### Global Edge Cases (All Personas)

| Scenario | Handling |
|---|---|
| No screenshots, text only | Generate from text, flag "No visual verification possible — consider uploading screenshots" |
| Very short description (<50 chars) | AI makes assumptions, lists all assumptions in `assumptions` array, asks user to confirm |
| Description in non-English | Detect language, generate tests in same language, note language in output |
| Screenshot shows error state | Detect and generate crash/error recovery tests specifically |
| App is for regulated industry (health/finance) | If scope mentions compliance, auto-include regulatory test category |
| User selects ALL focus areas | Warn: "This will generate a large suite. Consider focusing on 3–5 areas for better quality." |
| Rate limit during streaming | Save partial output, resume from last complete test case on retry |
| Identical generation request (same inputs) | Serve cached artifact from DB, show "Cached result" badge |

### Optimizations
- **Streaming**: Use `streamObject` so test cases render as they're generated
- **Chunking**: For >5 focus areas, split into parallel GROQ calls, merge results
- **Cache key**: SHA-256 of `(description + scope + audience + role + focusAreas)` — if unchanged, return cached artifact
- **Post-processing**: Run string similarity (Levenshtein or Jaccard) to flag semantically duplicate test cases

---

## 🎨 Feature 2: UX/UI Auditor

### What It Does
Analyzes screenshots and flow descriptions against Nielsen's 10 Heuristics + WCAG foundations. Produces a scored report with actionable issues.

### Inputs
| Input | Source | Required |
|---|---|---|
| Screenshots | `project_assets` (up to 10) | At least 1 |
| Navigation flow description | Free text | No |
| App type | `projects.app_type` | Yes |
| Audit focus | Dropdown selection | No |

### Audit Focus Options
```
◉ Full Audit (all heuristics)
○ Onboarding & First-Time UX
○ Checkout & Conversion Flow
○ Forms & Input Validation
○ Error Handling & Recovery
○ Information Architecture
○ Mobile Usability
```

### Nielsen's 10 Heuristics — What Tesifye Checks

| # | Heuristic | What the AI Looks For |
|---|---|---|
| 1 | Visibility of system status | Loading indicators, progress bars, success/error feedback |
| 2 | Match between system & real world | Familiar icons, natural language, no jargon |
| 3 | User control & freedom | Back buttons, undo, cancel, clear exit paths |
| 4 | Consistency & standards | Button styles, nav patterns, platform conventions |
| 5 | Error prevention | Confirmation dialogs, input constraints, destructive action guards |
| 6 | Recognition over recall | Visible options, search, breadcrumbs, recent history |
| 7 | Flexibility & efficiency | Shortcuts, bulk actions, keyboard support |
| 8 | Aesthetic & minimalist design | Visual hierarchy, whitespace, information density |
| 9 | Error recovery | Helpful error messages, suggested fixes, retry options |
| 10 | Help & documentation | Tooltips, help links, contextual guidance |

### Output Schema (Zod)
```typescript
const UXReviewSchema = z.object({
  overall_score: z.number().min(0).max(100),
  grade: z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
  summary: z.string(),
  heuristic_scores: z.array(z.object({
    heuristic_id: z.number().min(1).max(10),
    name: z.string(),
    score: z.number().min(0).max(10),
    finding: z.string(),
    screens_affected: z.array(z.string()),
  })),
  issues: z.array(z.object({
    id: z.string(),
    severity: z.enum(['critical', 'major', 'minor', 'cosmetic']),
    heuristic_id: z.number(),
    screen: z.string(),
    description: z.string(),
    suggestion: z.string(),
    effort_level: z.enum(['quick-win', 'moderate', 'significant']),
    wcag_reference: z.string().nullable(),
  })),
  accessibility_flags: z.array(z.object({
    type: z.enum(['contrast', 'text_size', 'touch_target', 'alt_text', 'focus_order', 'color_only']),
    element: z.string(),
    screen: z.string(),
    detail: z.string(),
    wcag_criterion: z.string(),
  })),
  quick_wins: z.array(z.string()),
  positive_findings: z.array(z.string()).describe('What the app does well'),
});
```

### Per-Role Relevance

| Role | What They Care About | Tesifye Delivers |
|---|---|---|
| **Manual Tester** | "What should I look for?" | Issue list → becomes ad-hoc exploratory checklist |
| **Automation Eng.** | "Which visual checks can I automate?" | Contrast ratios, element presence, layout assertions |
| **PM** | "Is this ready to ship? What blocks launch?" | Score + critical issues + effort estimates |
| **QA Lead** | "How does this compare to last sprint?" | Score delta + trend + regression flag |

### Edge Cases

| Scenario | Handling |
|---|---|
| No screenshots (text-only input) | Generate text-based heuristic checklist, accuracy disclaimer, strongly recommend uploading screens |
| Screenshots out of order / unlabeled | Prompt user to add context labels. AI infers sequential flow but flags low confidence |
| Blurry / low-res screenshot | Attempt analysis. Add note: "Low image quality — contrast and text-size findings may be inaccurate" |
| Single screenshot only | Evaluate that screen fully, but flag: "Cannot assess navigation flow, consistency, or error recovery from a single screen" |
| App is intentionally minimal (e.g., terminal-style) | Detect aesthetic style, reduce "minimalist design" weight, increase "efficiency" weight |
| Mobile screenshot analyzed as web (or vice versa) | Cross-reference `projects.app_type` — if mismatch, warn user |
| Same screen uploaded twice (hash match) | Skip duplicate, show existing analysis |

### Pre-AI Screen Metrics (v1.1 Addition)

Before sending screenshots to the AI, extract objective pixel-level metrics client-side:

```typescript
import { extractColors } from 'extract-colors';
import { getContrastRatio, meetsAA } from 'wcag-contrast-utils';

async function extractScreenMetrics(imageBlob: Blob): Promise<ScreenMetrics> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = await createImageBitmap(imageBlob);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const colors = await extractColors(canvas);
  
  // Find likely text/background pairs from dominant colors
  const contrastPairs = findContrastPairs(colors);
  
  return {
    dominant_colors: colors.slice(0, 5),
    contrast_pairs: contrastPairs.map(pair => ({
      foreground: pair.fg,
      background: pair.bg,
      ratio: getContrastRatio(pair.fg, pair.bg),
      passes_AA: meetsAA(pair.fg, pair.bg),
    })),
    whitespace_ratio: calculateWhitespaceRatio(imageData),
    estimated_text_density: estimateTextDensity(imageData),
  };
}
```

These factual metrics are injected alongside the screenshot into the AI prompt:
- Contrast analysis becomes **grounded in actual pixel data**, not AI guessing
- Whitespace ratio informs the "Minimalist Design" heuristic score with certainty
- The AI can say: "Contrast ratio is 2.1:1 (WCAG AA requires 4.5:1)" — factual, not estimated

### Optimizations
- **Two-stage vision**: Scout each screenshot individually (fast, parallel) → merge descriptions → send combined to Maverick for holistic heuristic analysis
- **Pre-AI metrics**: Canvas-based contrast + color extraction runs client-side (zero API cost) before AI analysis
- **Incremental re-audit**: After user makes changes, re-run on single screen only, compare scores
- **Score history**: Each run stored as `generated_artifacts` row → timeline chart in UI (recharts)

---

## 🐛 Feature 3: Bug Report Formatter

### What It Does
Converts messy, quick notes into professional, structured bug reports ready for Jira, GitHub, Linear, or plain Markdown.

### Inputs
| Input | Source | Required |
|---|---|---|
| Raw note | Free-form text (any length, any quality) | Yes |
| Screenshot | Optional attachment | No |
| Target platform | Dropdown: Jira / GitHub / Linear / Markdown | Yes |
| Project context | Auto-injected from current project | Auto |

### Output Schema
```typescript
const BugReportSchema = z.object({
  title: z.string().describe('Concise bug title with [BUG] prefix'),
  severity: z.enum(['blocker', 'critical', 'major', 'minor', 'trivial']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']),
  component: z.string().nullable(),
  environment: z.object({
    platform: z.string(),
    browser: z.string(),
    os: z.string(),
    app_version: z.string(),
  }).describe('Best guess from context; mark unknowns explicitly'),
  steps_to_reproduce: z.array(z.string()).min(1),
  expected_result: z.string(),
  actual_result: z.string(),
  frequency: z.enum(['always', 'often', 'sometimes', 'rarely', 'once']),
  root_cause_hypothesis: z.string().nullable(),
  workaround: z.string().nullable(),
  labels: z.array(z.string()),
  related_test_cases: z.array(z.string()).nullable().describe('TC-IDs from existing test suite'),
});
```

### Per-Role Usage

| Role | Workflow |
|---|---|
| **Manual Tester** | Types quick notes during testing sessions → Tesifye polishes into ticket-ready reports |
| **Automation Eng.** | Pastes test failure output → Tesifye extracts failure context, creates bug + links to test ID |
| **PM** | Describes user feedback ("customer says checkout broke") → Tesifye formalizes |
| **QA Lead** | Reviews bulk raw notes from team → Tesifye batch-formats all |

### Edge Cases

| Scenario | Handling |
|---|---|
| Note is too vague ("it's broken") | AI asks 2–3 targeted questions: "What screen? What action? What did you expect?" |
| Note contains multiple bugs | Detect and split: "We found 3 distinct issues in your note. Generating separate reports." |
| Note already well-structured | Validate structure, enhance if needed, don't rewrite unnecessarily |
| Screenshot shows a stack trace / error dialog | Vision model extracts error text, includes in `actual_result` |
| Non-English note | Generate report in same language, add English title variant |
| Duplicate of existing bug (if artifacts exist) | Cross-reference existing bug reports in project, flag: "Possible duplicate of BUG-007" |

### Optimizations
- Uses `llama-3.1-8b-instant` (fast formatting, not complex reasoning)
- Template switching is client-side post-processing (same data structure, different rendering)
- One-click copy with platform-specific formatting (Jira uses `{code}`, GitHub uses triple backticks, etc.)

---

## 🔍 Feature 4: Requirement Gap Finder

### What It Does
Analyzes a PRD, feature spec, or user story collection to find logical contradictions, undefined flows, ambiguous requirements, and untestable criteria.

### Inputs
| Input | Source | Required |
|---|---|---|
| PRD / spec text | Pasted, or uploaded `.txt` / `.md` / `.pdf` / `.docx` | Yes |
| App type + audience | Auto from project | Yes |
| Existing test scope | From `generated_artifacts` if available | No |

### Document Processing

| Format | Library | Strategy |
|---|---|---|
| `.pdf` | `pdfjs-dist` | Client-side text extraction, strip to plain text |
| `.docx` | `mammoth` | Convert to HTML → strip to plain text |
| `.md` / `.txt` | Native | Direct read |
| Pasted text | None | Direct use |
| Scanned PDF (no text layer) | `tesseract.js` | Fallback OCR — see below |

### Scanned PDF OCR Fallback (v1.1 Addition)

v1.0 showed an error for scanned PDFs. v1.1 adds a client-side OCR fallback:

```
PDF uploaded → pdfjs-dist attempts text extraction
  → Text found (>50 chars)? → Send to AI
  → No text (scanned PDF)?
      → Extract page images from PDF via pdfjs-dist canvas rendering
      → Lazy-load tesseract.js (WASM, ~2MB, only loaded when needed)
      → Run OCR on each page image (client-side, zero API cost)
      → Show progress: "Extracting text from scanned PDF... Page 2/5"
      → Clean OCR output → Send to AI
      → Show warning: "⚠️ This PDF was scanned. OCR text quality may vary."
```

**Caveats:**
- Tesseract.js accuracy: ~95% for clean machine text, degraded for handwriting
- Processing time: 3-8 seconds per page — progress bar required
- Bundle impact: WASM file is lazy-loaded, only downloaded when a scanned PDF is detected
- Fallback to paste: If OCR quality is poor, still show "Paste text manually" option

### Output Schema
```typescript
const GapAnalysisSchema = z.object({
  document_summary: z.string(),
  total_requirements_found: z.number(),
  findings: z.array(z.object({
    id: z.string(),
    type: z.enum(['contradiction', 'missing_flow', 'ambiguity', 'untestable', 'missing_edge_case', 'undefined_error_state']),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    location: z.string().describe('Section or paragraph reference'),
    description: z.string(),
    suggestion: z.string(),
    affected_user_personas: z.array(z.string()).nullable(),
  })),
  untestable_requirements: z.array(z.object({
    original: z.string(),
    reason: z.string(),
    measurable_alternative: z.string(),
  })),
  coverage_recommendations: z.array(z.string()),
  risk_areas: z.array(z.string()),
});
```

### Per-Role Value

| Role | How They Use It |
|---|---|
| **Manual Tester** | "Before I write test cases — what am I missing from the spec?" |
| **Automation Eng.** | "Which requirements are automatable? Which are too vague to write assertions for?" |
| **PM** | "Is my spec complete enough for the dev team?" — catches gaps before sprint planning |
| **QA Lead** | "Risk assessment: which features have the weakest specs?" |

### Edge Cases

| Scenario | Handling |
|---|---|
| PRD > 32K tokens | Chunk by sections/headings, analyze each, merge findings, use `mixtral-8x7b-32768` |
| Bullet-list PRD (no structure) | Flag poor formatting, infer structure, still analyze |
| Multiple conflicting PRD versions uploaded | Detect and compare, surface contradictions between versions |
| PRD mixes multiple products/modules | Detect scope creep, group findings by module |
| Non-English PRD | Detect language, analyze in that language, generate bilingual output |
| PRD references external docs ("see API spec v3") | Flag as "External dependency — not analyzed" |

---

## 🔗 Feature 5: Semantic Link — PRD↔UI Verification

### What It Does
The "Missing Feature Bug Detector." Bridges requirements from the PRD to actual UI elements found in screenshots. Surfaces features that should exist but don't appear in the UI, or UI elements that have no backing requirement.

### How It Works
```
PRD text → 70B extracts RequiredFeatures[]
Screenshots → Scout extracts ScreenElementMaps[]
                    ↓
              Semantic Linker (70B)
              Matches each requirement to a UI element
                    ↓
              SemanticLink[] output
              Status: verified | missing | mismatch | untested
```

### Schema
```typescript
interface SemanticLink {
  requirement_id: string;            // From gap analysis
  requirement_text: string;          // "Users can sign in with Google"
  prd_location: string;              // "Section 2.4"
  matched_element: string | null;    // "Google Sign In button" or null
  matched_screen: string | null;     // "Login Screen" or null
  status: 'verified' | 'missing' | 'mismatch' | 'untested';
  confidence: number;                // 0.0 - 1.0
  notes: string;                     // "PRD calls for Apple Pay, only Stripe found"
}
```

### Status Definitions

| Status | Meaning | Action |
|---|---|---|
| `verified` | Requirement found in UI with high confidence | ✅ No action |
| `missing` | Requirement exists in PRD but NOT in any screenshot | 🔴 Pre-release bug: feature not implemented |
| `mismatch` | UI element exists but doesn't match requirement (e.g., wrong label) | ⚠️ Needs review |
| `untested` | No screenshot covers this area of the app | 🟡 Upload more screenshots |

### Edge Cases

| Scenario | Handling |
|---|---|
| PRD requirement is about backend-only logic | Status: `untested`, note: "This is a backend concern — no UI evidence possible" |
| Screenshot shows feature not in PRD | Flag as "Undocumented feature — consider adding to spec" |
| Low confidence match (<0.5) | Flag for human review, don't auto-mark as verified |
| Multiple screens match one requirement | List all matches, note which is "primary" |
| PRD is vague ("good error handling") | Can't match → mark as `untestable`, suggest specific requirement wording |

---

## 🧪 Feature 6: Synthetic Test Data Generator

### What It Does
Generates realistic test datasets tailored to the app's domain. Combines AI reasoning (for edge cases) with `@faker-js/faker` (for bulk data) to minimize GROQ token waste.

### Inputs
| Input | Source | Required |
|---|---|---|
| App domain | Dropdown: e-commerce, fintech, healthcare, social, SaaS, edtech, logistics | Yes |
| Fields needed | User defines columns/fields | Yes |
| Edge case instructions | Free text | No |
| Record count | 10 / 50 / 100 / 500 | Yes |
| Output format | CSV / JSON / TypeScript interface + data | Yes |

### Hybrid Generation Strategy
```
Step 1: AI defines the data schema + edge case plan (GROQ 8B)
  ↓
Step 2: @faker-js/faker generates 80% of records (client-side, zero API cost)
  ↓
Step 3: AI generates 20% edge-case records (GROQ 8B)
  ↓
Step 4: Merge, label edge-case rows, export
```

### Per-Role Usage

| Role | Use Case |
|---|---|
| **Manual Tester** | "Give me 50 user accounts to test the registration form" |
| **Automation Eng.** | "Generate a fixtures file for my Playwright test suite" |
| **PM** | "I need sample data for the product demo" |
| **QA Lead** | "Generate cross-locale data (names, addresses, phones) for i18n testing" |

### Edge Cases

| Scenario | Handling |
|---|---|
| Domain-specific formats (IBAN, SSN, NRIC) | AI generates format specification, `@faker-js/faker` has built-in locale support |
| PII concerns | All data explicitly fake, disclaimer banner: "Generated with faker.js — not real data" |
| Very large requests (500+) | All `@faker-js/faker`, AI only seeds the schema + edge cases |
| Custom fields AI doesn't understand | Fallback to generic random strings, flag for manual population |
| User requests valid vs invalid split | Generate with explicit `is_valid: boolean` column, label invalid rows |

---

## 💬 Feature 7: Sidekick Contextual Chat

### What It Does
A persistent sidebar chat that is project-aware. Knows the app scope, target audience, all generated artifacts, and current screen. Not a generic chatbot.

### Context Injection
```typescript
// Every message enriched with:
const systemPrompt = buildSidekickPrompt({
  project: currentProject,
  latestTestCases: manifestSnapshot.latest_test_cases,
  latestUXReview: manifestSnapshot.latest_ux_review,
  latestVisionMaps: manifestSnapshot.latest_vision_map,
  userRole: currentProject.tester_role,
  currentTab: activeFeatureTab,  // "test-gen" | "ux-audit" | "bugs" etc.
});
```

### Interaction Patterns

All roles can ask:
- "What if the database times out during payment?" → generates specific negative test case
- "Is TC-023 still relevant after the UX review?" → cross-references artifacts
- "Give me 5 exploratory test ideas for the onboarding flow"
- "Summarize the gaps in my test coverage"
- "The client wants to add dark mode — what new tests do I need?"

### Edge Cases

| Scenario | Handling |
|---|---|
| Context exceeds model context window | Summarize oldest artifacts, keep recent ones verbatim |
| User references something not in project | "I don't have info about X in this project. Can you describe it?" |
| Rate limit during chat | Show typing indicator with countdown, don't show error |
| User asks non-QA questions | Gently redirect: "I'm scoped to help with QA for {project.name}. Can I help you test something?" |
| Long conversation (20+ messages) | Truncate oldest messages, keep system prompt + last 10 turns |

### Optimizations
- Session-only in MVP (no DB persistence for messages)
- Streaming via `streamText` for real-time feel
- Context window budget: system prompt (2K) + artifacts (4K summarized) + conversation (4K) = ~10K tokens/request

---

## 📤 Feature 8: Export Engine

### Formats

| Format | Target User | Client-Side? | Library |
|---|---|---|---|
| Markdown | Everyone | Yes | Template literals |
| CSV | Manual Testers, Jira import | Yes | `json2csv` |
| JSON | Automation Eng. | Yes | `JSON.stringify` |
| Gherkin (`.feature`) | Automation Eng. (BDD) | No (GROQ 8B reformats) | AI generation |
| Jira format | QA Leads | Yes | Template w/ Jira markup |
| Linear format | PMs | Yes | Template w/ Linear API syntax |
| Plain text | Quick copy | Yes | Strip formatting |

### Gherkin Generation Pipeline
```
Existing test cases (JSONB)
  ↓ sent to llama-3.1-8b-instant
  ↓ reformatted as Given/When/Then
  ↓ saved as artifact_type: 'gherkin'
  ↓ downloadable as .feature file
```

### Edge Cases

| Scenario | Handling |
|---|---|
| 500+ test cases → huge export | Stream to Supabase Storage, provide download link (not inline) |
| Gherkin from non-functional tests | Flag: "Test TC-089 ('Check visual hierarchy') is manual-only and excluded from Gherkin export" |
| Export while generation in progress | Block export button, show: "Generation in progress..." |
| Non-English test cases | Export in original language, include `language: 'ar'` metadata header |
| CSV with special characters (commas, quotes) | `json2csv` handles escaping automatically |

---

## 🎭 Feature 9: Persona Friction Analysis

### What It Does
Given target audience data, the AI "roleplays" as different user personas browsing the uploaded screenshots and identifies where each persona type would experience friction. **Not a heatmap** — a structured friction point report with element-level references.

### Persona Types (selectable)
```
□ First-time user / Non-technical    □ Power user / Expert
□ Elderly user (65+)                 □ Young adult (Gen Z)
□ User with low vision               □ User with motor impairment
□ Non-native language speaker         □ Corporate/Enterprise user
□ Mobile-only user                    □ Returning user (after 6 months)
```

### Output Schema
```typescript
const PersonaFrictionSchema = z.object({
  persona: z.string(),
  empathy_summary: z.string().describe('Narrative of this persona browsing the app'),
  friction_points: z.array(z.object({
    screen: z.string(),
    element: z.string(),
    friction_type: z.enum(['confusion', 'accessibility', 'cognitive_load', 'missing_affordance', 'trust_issue', 'performance_expectation']),
    severity: z.enum(['blocking', 'frustrating', 'annoying', 'minor']),
    description: z.string(),
    suggestion: z.string(),
  })),
  overall_persona_score: z.number().min(0).max(100),
  drop_off_risk: z.enum(['high', 'medium', 'low']),
  key_recommendation: z.string(),
});
```

### Edge Cases

| Scenario | Handling |
|---|---|
| No screenshots (text only) | Generate abstract friction analysis from described features, flag low confidence |
| Multiple personas selected | Run sequentially (not parallel — rate limits), present as tabs |
| Persona not representative of actual users | Warn: "The selected persona may not match your target audience" |
| Same friction found across all personas | Consolidate: "Universal friction point — all users affected" |

---

## 🌐 Feature 10: Internationalization Audit

### What It Does
Checks app screens for internationalization readiness: text truncation risk, RTL compatibility, locale-specific formatting, and cultural assumptions.

### Audit Checks
- **RTL Mirroring**: Navigation flow, icon placement, text alignment in Arabic/Hebrew context
- **Text Expansion**: German/Finnish translations are 30–40% longer than English — will buttons overflow?
- **Date/Time Formats**: Does the app hardcode MM/DD/YYYY or adapt to locale?
- **Currency Symbols**: Symbol placement varies (€100 vs 100€ vs ¥100)
- **Number Formatting**: 1,000.00 vs 1.000,00
- **Cultural Assumptions**: Calendar starting day, name format (family name first), address format

### Output Schema
```typescript
const I18nAuditSchema = z.object({
  overall_readiness: z.enum(['ready', 'partially_ready', 'not_ready']),
  score: z.number().min(0).max(100),
  findings: z.array(z.object({
    id: z.string(),
    category: z.enum(['rtl', 'text_expansion', 'date_format', 'currency', 'number_format', 'cultural', 'hardcoded_text']),
    severity: z.enum(['critical', 'major', 'minor']),
    screen: z.string(),
    element: z.string(),
    description: z.string(),
    affected_locales: z.array(z.string()),
    suggestion: z.string(),
  })),
  recommended_test_locales: z.array(z.string()).describe('Top 5 locales to test against'),
});
```

### Edge Cases

| Scenario | Handling |
|---|---|
| App is English-only by design | Still useful: identify hardcoded text, date format assumptions, cultural bias |
| Screenshots already in non-English | Detect language, adjust audit accordingly |
| No text visible in screenshot (icon-heavy UI) | Focus on icon universality, color meaning, gesture patterns |

---

## 🔒 Data Privacy Controls

### The Problem (v1.1 Addition)
Our multi-provider fallback introduces a privacy consideration:
- **GROQ (primary)**: Does NOT use free-tier data for model training (confirmed in ToS)
- **Google AI Studio (fallback)**: Free-tier data **MAY be used** to improve Google products
- **Cerebras (fallback)**: Does NOT use data for training

This matters because QA teams upload proprietary screenshots, PRDs, and app descriptions.

### Solution: User-Facing Privacy Toggle

```typescript
// projects table addition (future migration)
// allow_extended_providers BOOLEAN DEFAULT false

// Settings UI:
// ┌──────────────────────────────────────────────────────┐
// │  AI Provider Settings                                │
// │                                                      │
// │  ◉ GROQ Only (fastest, private)                     │
// │    Your data is never used for model training.       │
// │                                                      │
// │  ○ Extended Providers (GROQ + Google AI + Cerebras)  │
// │    Higher capacity. Google's free tier may use       │
// │    inputs for product improvement.                    │
// └──────────────────────────────────────────────────────┘
```

### Rules
- Default: **GROQ only** (privacy-first)
- Extended providers require explicit opt-in per project
- When Google serves a request, UI shows: "✦ Served by Google AI" badge
- The `generated_artifacts.model_used` field always records which provider was used
- If user disables extended providers, all fallback chains skip non-GROQ providers

---

## 🔐 Auth Architecture

### Email/Password (MVP)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### Google OAuth (Prepared)
```typescript
// Ready to activate — just configure in Supabase Dashboard
const signInWithGoogle = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email profile',
    },
  });
};
```

The callback route (`/auth/callback/route.ts`) is built from day one.

### Middleware (Route Protection)
```typescript
// middleware.ts — protects /dashboard/*, /projects/*
// Allows: /, /auth, /auth/callback, /api/*
```

### Session handling via `@supabase/ssr`
- Server Components: `createServerClient` reads session from cookies
- Route Handlers: Same `createServerClient` for API auth
- Client Components: `createBrowserClient` for real-time auth state

---

## 🎨 Visual Identity

### Design System: "Premium Glassmorphic"

**Palette:**
| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#0A0A0B` | Page background |
| `--bg-surface` | `#141416` | Cards, panels |
| `--bg-elevated` | `#1C1C1F` | Modals, dropdowns |
| `--text-primary` | `#F2F2F2` | Headings, primary text |
| `--text-secondary` | `#A1A1AA` | Descriptions, labels |
| `--accent-primary` | `#7C3AED` | Electric Violet — CTAs, sparkle, active states |
| `--accent-glow` | `rgba(124, 58, 237, 0.15)` | Glow effects, hover |
| `--border` | `rgba(255, 255, 255, 0.08)` | Card borders |
| `--success` | `#22C55E` | Verified, passed |
| `--warning` | `#EAB308` | Dirty states, attention |
| `--error` | `#EF4444` | Critical, failed |

**Typography:**
- Headings: `Inter` (600, 700 weight)
- Body: `Inter` (400)
- Code / Technical: `JetBrains Mono` (400)

**Effects:**
- Cards: `backdrop-filter: blur(12px); background: rgba(20, 20, 22, 0.8);`
- Borders: `1px solid rgba(255, 255, 255, 0.08)`
- Active/focus glow: `box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.4)`
- "Dirty" state: Subtle violet pulse animation on affected elements
- Loading state: Content area blur with "Tesifye is thinking..." overlay

**Logo:**
- Minimalist mobile phone frame (line art, `--text-primary`)
- Four-pointed star / sparkle at top-right intersection (`--accent-primary`)
- Should look like a "save point" marker — glowing, clean, signal of quality

---

## 🗺️ Implementation Phases

### Phase 1 — The Core Engine (Minimum Viable Intelligence)

**Goal:** Create project → upload screenshots → generate verified test cases → export.

| # | Task | Details |
|---|---|---|
| 1.1 | **Project scaffold** | `npx create-next-app@latest`, App Router, TypeScript, vanilla CSS |
| 1.2 | **Design system** | CSS custom properties, glassmorphic tokens, Inter + JetBrains Mono |
| 1.3 | **Supabase setup** | Schema (all tables), RLS policies, storage bucket |
| 1.4 | **Auth flow** | Email sign-up/in, middleware protection, OAuth callback stub |
| 1.5 | **Image pipeline** | SHA-256 + pHash dual hashing + browser-image-compression + idb-keyval + Supabase upload |
| 1.6 | **Project CRUD** | Create, edit, archive projects + dashboard listing |
| 1.7 | **Provider registry** | GROQ primary + Google AI fallback + `generateWithFallback` utility |
| 1.8 | **Scout pipeline** | Route handler: screenshot → llama-4-scout → ScreenElementMap (with fallback) |
| 1.9 | **Generator pipeline** | Route handler: context + vision maps → llama-3.3-70B → test cases (with fallback) |
| 1.10 | **Judge pipeline** | Route handler: test cases + vision maps → llama-3.1-8B → verified output (with fallback) |
| 1.11 | **Context budget** | Semantic truncation utility + token estimation for all AI calls |
| 1.12 | **System prompts** | Scout, Generator, Judge prompt templates in `lib/ai/prompts/` |
| 1.13 | **Test case UI** | Streaming render with skeleton→content animation, category filters, priority badges, provider badge |
| 1.14 | **Partial stream recovery** | Zustand store for `partial` status, Resume/Keep Partial UX |
| 1.15 | **Basic export** | Markdown copy, JSON download |
| 1.16 | **Rate limit queue** | Zustand store, per-model tracking, fallback-aware |
| 1.17 | **Landing page** | Brand identity, product pitch, CTA |
| 1.18 | **Manifest trigger** | Postgres trigger to update `manifest_snapshot` on artifact insert |

### Phase 2 — Analysis & Richness

| # | Task |
|---|---|
| 2.1 | UX/UI Auditor (full Nielsen heuristic pipeline) |
| 2.2 | Pre-AI screen metrics (Canvas contrast + `extract-colors` + `wcag-contrast-utils`) |
| 2.3 | Screenshot labeling (user adds context tags) |
| 2.4 | Dirty state detection + re-analyze prompt |
| 2.5 | Bug Report Formatter |
| 2.6 | Role-based output switching (manual / auto / PM / lead) |
| 2.7 | Gherkin export via GROQ 8B |
| 2.8 | UX score history + trend chart |
| 2.9 | Sidekick chat v1 (session-only, streaming) |
| 2.10 | Data privacy toggle (GROQ-only vs extended providers) |
| 2.11 | Shadow Scout — background vision map pre-processing on screenshot upload via `after()` |

### Phase 3 — Intelligence Layer

| # | Task |
|---|---|
| 3.1 | Requirement Gap Finder (PDF + DOCX support) |
| 3.2 | Scanned PDF OCR fallback (tesseract.js lazy-loaded) |
| 3.3 | Semantic Link: PRD ↔ UI verification |
| 3.4 | Synthetic Test Data Generator |
| 3.5 | Full CSV + Jira + Linear export |
| 3.6 | Prompt versioning + artifact lineage tracking |
| 3.7 | Token budget estimator (pre-generation) |
| 3.8 | Coverage gap analysis (compare tests vs scope) |

### Phase 4 — Power Features

| # | Task |
|---|---|
| 4.1 | Persona Friction Analysis |
| 4.2 | Internationalization / RTL Audit |
| 4.3 | Accessibility deep-dive mode (WCAG 2.1 AA) |
| 4.4 | Test Suite versioning (diff between runs) |
| 4.5 | Exploratory testing idea generator |
| 4.6 | "Launch Readiness" composite score |
| 4.7 | Project templates (E-commerce, SaaS, FinTech presets) |

### Phase 5 — Collaboration & Scale

| # | Task |
|---|---|
| 5.1 | Google OAuth activation |
| 5.2 | Team workspaces + org model + multi-user RLS |
| 5.3 | Comments + annotations on artifacts |
| 5.4 | Shared read-only report links (token-based) |
| 5.5 | Analytics dashboard (coverage %, score trends, generation history) |
| 5.6 | Activity feed |
| 5.7 | Sidekick chat v2 (DB persistence, cross-artifact memory) |

---

## 📦 Dependencies

### Phase 1 (Core)
```bash
# Framework
npx -y create-next-app@latest ./

# Supabase
npm install @supabase/ssr @supabase/supabase-js

# AI — primary + fallback providers
npm install ai @ai-sdk/groq @ai-sdk/google zod

# Image pipeline
npm install browser-image-compression idb-keyval

# State
npm install zustand @tanstack/react-query

# UI
npm install lucide-react framer-motion react-markdown
```

### Phase 2 (Analysis)
```bash
# Pre-AI screen metrics
npm install wcag-contrast-utils extract-colors

# Export
npm install json2csv
```

### Phase 3 (Intelligence)
```bash
# Document processing
npm install pdfjs-dist mammoth

# Scanned PDF OCR fallback (lazy-loaded, ~2MB WASM)
npm install tesseract.js
```

### Phase 4 (Power Features)
```bash
npm install @faker-js/faker recharts date-fns
```

---

## ⚠️ Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| GROQ free-tier rate limits | **Medium** (was High) | Multi-provider fallback (GROQ→Google→Cerebras) eliminates single-point-of-failure |
| All providers rate-limited simultaneously | Low | Client-side queue pauses with countdown; cached artifacts served where possible |
| Vision model inaccuracy | Medium | Judge pipeline self-corrects; user can manually label screenshots |
| Zod schema mismatch | Medium | try/catch on all `generateObject`, fallback to raw text display |
| Context poisoning (artifact bloat) | **High** (new) | Semantic truncation pipeline with 14K token budget per call |
| Data privacy (Google fallback) | **Medium** (new) | Google fallback requires explicit user opt-in; GROQ is default (private) |
| IndexedDB limits (browser-dependent) | Low | Monitor usage, warn at 50MB, force promote to Supabase |
| Supabase free egress (5GB/mo) | Medium | Aggressive compression, serve from IDB when possible |
| Scanned PDFs (no text layer) | **Low** (was High) | Tesseract.js client-side OCR fallback + manual paste option |
| Perceptual dedup failure (cropped images) | **Low** (new) | Canvas pHash as secondary check behind SHA-256 exact match |
| Mid-stream generation failure | **Medium** (new v1.2) | Partial stream recovery: save partial output, offer Resume/Keep Partial |
| Prompt regression (improved prompt breaks old logic) | Medium | `prompt_version` field, flag old artifacts for re-generation |
| Model availability changes on GROQ | Low | `MODEL_REGISTRY` + multi-provider fallback = easy swap |

---

## 🔑 Environment Variables

```env
# .env.local (NEVER commit to git)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers (all server-side ONLY — no NEXT_PUBLIC_ prefix)
GROQ_API_KEY=                # Primary — required
GOOGLE_AI_API_KEY=           # Fallback — free from ai.google.dev (optional but recommended)
CEREBRAS_API_KEY=            # Fallback — free from cloud.cerebras.ai (optional, text-only)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API Key Setup Guide
| Provider | Get Key At | Cost | Notes |
|---|---|---|---|
| GROQ | [console.groq.com](https://console.groq.com) | Free, no CC | Required. Primary provider. |
| Google AI Studio | [aistudio.google.com](https://aistudio.google.com) | Free, no CC | Optional. Vision fallback. Free-tier data may be used for training. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai) | Free, no CC | Optional. Text-only fallback. 1M tokens/day. |

---

> **Document Status:** v1.2 LOCKED. Ready for Phase 1 scaffolding.
> **Changelog:**
> - v1.0: Initial architecture, 10 features, 5-phase roadmap.
> - v1.1: Multi-provider fallback, semantic truncation, Canvas pHash, Tesseract.js OCR, pre-AI screen metrics, data privacy controls.
> - v1.2: Service layer architecture, streaming-first convention, system prompt templates, Shadow Scout, partial stream recovery.
> **Next Step:** Confirm this document, then begin project initialization.
