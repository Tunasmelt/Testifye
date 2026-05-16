# Tesifye — Implementation Phases & Head Prompts

> **Purpose:** Phase-by-phase roadmap with HEAD PROMPTS for each phase and feature. Copy-paste a head prompt into any AI agent to begin that work unit.
> **Related files:** [ARCHITECTURE.md](./ARCHITECTURE.md) (HOW) · [SCOPE.md](./SCOPE.md) (WHAT) · [SCHEMA.md](./SCHEMA.md) (DATA)
> **Convention:** Every head prompt references the markdown files the agent must read first.

---

## How to Use Head Prompts

1. **Pick a phase** → Pick a task within that phase
2. **Copy the HEAD PROMPT** for that task
3. **Paste it into your AI agent** (Gemini, Claude, Cursor, etc.)
4. The prompt tells the agent which markdown files to read, which files to create/edit, and what success looks like
5. **Validate** the output against the acceptance criteria listed

---

# Phase 1 — The Core Engine

**Goal:** Create project → upload screenshots → generate verified test cases → export.
**Duration:** 2-3 weeks
**Dependencies:** None (fresh project)

---

## Task 1.1 — Project Scaffold

### Head Prompt
```
You are building "Tesifye", an AI-native QA platform. This is the initial project scaffold.

**BEFORE WRITING ANY CODE**, read these files (they are in the project root):
- ARCHITECTURE.md — for tech stack, directory structure, and coding conventions
- SCHEMA.md — for design tokens and CSS custom properties

**Task:** Initialize the Next.js 15 project with App Router and TypeScript.

**Steps:**
1. Run `npx -y create-next-app@latest ./` with these options:
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: NO (we use vanilla CSS)
   - `src/` directory: Yes
   - App Router: Yes
   - Import alias: @/*
2. Install Phase 1 dependencies:
   ```
   npm install @supabase/supabase-js @supabase/ssr ai @ai-sdk/groq @ai-sdk/google zod zustand idb-keyval browser-image-compression framer-motion lucide-react react-markdown
   ```
3. Create the directory structure from ARCHITECTURE.md (all folders, empty placeholder files)
4. Set up the globals.css with the full design system from ARCHITECTURE.md (Visual Identity section):
   - All CSS custom properties (--bg-primary, --bg-surface, etc.)
   - Google Fonts import (Inter + JetBrains Mono)
   - Glassmorphic card base classes
   - Skeleton shimmer animation
   - Dirty state pulse animation
5. Create .env.local with all 7 environment variables (empty values)
6. Create .env.example with the same variables (no values, with comments)
7. Add .env.local to .gitignore

**DO NOT:**
- Install Tailwind CSS
- Create any feature logic yet
- Create any components beyond a "Hello World" page

**Acceptance Test:**
- `npm run dev` starts without errors
- Page loads at localhost:3000 showing a styled dark page with correct fonts
- All directories from ARCHITECTURE.md exist
- .env.local exists with correct variable names
```

---

## Task 1.2 — Design System

### Head Prompt
```
You are building the design system for "Tesifye", an AI-native QA platform with a "Premium Glassmorphic" aesthetic.

**BEFORE WRITING ANY CODE**, read:
- ARCHITECTURE.md → "Visual Identity: Premium Glassmorphic" section for ALL token values
- ARCHITECTURE.md → "CSS File Strategy" and "Theme Variants" sections
- ARCHITECTURE.md → "Project Directory Structure" for component file locations

**Task:** Create the foundational UI component library and CSS design system.

**CRITICAL — Use exact token names from ARCHITECTURE.md. Key ones:**
- Background: --bg-0 (#07070A), --bg-1 (#0F0F13), --bg-2 (#141418), --bg-3 (#1C1C22)
- Text: --text-0 (#F0F0F4), --text-1 (#9494A8), --text-2 (#5A5A70)
- Accent: --accent (#8B5CF6), --accent-2 (#A78BFA), --accent-3 (#6366F1)
- Glow: --accent-glow (rgba(139,92,246,0.18)), --accent-strong (rgba(139,92,246,0.45))
- Glass: --glass-bg (rgba(20,20,26,0.68)), --glass-blur (18px)
- Border: --border (rgba(255,255,255,0.07)), --border-strong (rgba(255,255,255,0.12))
- Status: --success (#34D399), --warning (#FBBF24), --error (#F87171), --info (#60A5FA)
- Radius: --radius-sm (8px), --radius-md (12px), --radius-lg (16px), --radius-xl (24px)

**Files to create:**
1. `src/styles/app.css` — App shell tokens and utility classes:
   - All CSS custom properties listed above
   - Glassmorphic card (.tf-card, .tf-card-head, .tf-card-title)
   - App shell grid (.tf-app, .tf-sidebar, .tf-topbar, .tf-main)
   - Navigation (.tf-nav, .tf-nav-item, .tf-nav-badge, .tf-nav-section)
   - Badges (.tf-badge, .tf-badge-success, .tf-badge-critical, .tf-badge-high, .tf-badge-medium, .tf-badge-violet)
   - Chips (.tf-chip, .tf-chip.active)
   - Skeleton shimmer (@keyframes tf-shimmer, .tf-skeleton)
   - Dirty state pulse (@keyframes tf-pulse)
   - Fade-in animation (.tf-fade-in)
   - Provider badge (.tf-provider-badge, .tf-dot)
   - data-theme variants: lighter-glass, mono-violet

2. `src/styles/marketing.css` — Marketing page styles:
   - Hero, feature grid, pipeline visual, metrics, testimonial, pricing cards
   - Import Instrument Serif from Google Fonts (.serif class)

3. `src/styles/animations.css` — Keyframe animations:
   - fadeIn, slideUp, card-appear, skeleton shimmer, violet pulse, typing dot bounce

4. `src/app/globals.css` — Root file that imports app.css + animations.css, sets body background

5. `src/components/ui/Button.tsx` — Primary, ghost, SM variants. Loading spinner state.
6. `src/components/ui/Card.tsx` — Glassmorphic card (.tf-card) with optional header.
7. `src/components/ui/Badge.tsx` — All badge variants.
8. `src/components/ui/Chip.tsx` — Filter chip with active state.
9. `src/components/ui/Tabs.tsx` — Segmented control (.tf-tabs, .tf-tab).
10. `src/components/ui/Toggle.tsx` — On/off toggle switch for export bundle picker.
11. `src/components/ui/Skeleton.tsx` — Shimmer skeleton (.tf-skeleton).
12. `src/components/ui/Input.tsx` — Text input + textarea (.tf-input, .tf-textarea).
13. `src/components/ui/Modal.tsx` — Accessible modal with backdrop blur.
14. `src/components/ui/TweaksPanel.tsx` — Theme switcher panel (reads/writes data-theme on <html>; stores preference in localStorage).

**Acceptance Test:**
- `npm run dev` loads at localhost:3000 with correct dark background (#07070A)
- Inter + JetBrains Mono + Instrument Serif load from Google Fonts
- Cards have visible glassmorphic blur (backdrop-filter: blur(18px))
- Accent color is #8B5CF6 (not #7C3AED)
- Theme switcher changes data-theme attribute on <html>
- All CSS token names match ARCHITECTURE.md exactly
```

---

## Task 1.3 — Supabase Setup

### Head Prompt
```
You are setting up the Supabase backend for "Tesifye", an AI-native QA platform.

**BEFORE WRITING ANY CODE**, read:
- SCHEMA.md — complete SQL schema (ALL tables, RLS policies, triggers, indexes)
- ARCHITECTURE.md → "Auth Architecture" and "Supabase" sections

**Task:** Set up Supabase clients and prepare the SQL schema.

**Files to create:**
1. `src/lib/supabase/client.ts` — Browser client using createBrowserClient from @supabase/ssr
2. `src/lib/supabase/server.ts` — Server client using createServerClient with cookie handling
3. `src/lib/supabase/admin.ts` — Service role client (bypasses RLS, for triggers/admin)

**SQL to execute in Supabase SQL Editor (provide as a single migration file):**
- Enable extensions: uuid-ossp, pgcrypto
- Create tables: profiles, projects, project_assets, generated_artifacts, chat_sessions
- All RLS policies from SCHEMA.md
- All indexes from SCHEMA.md
- The handle_new_artifact() trigger function
- The on_artifact_insert trigger
- Storage bucket: testifye-assets (private)
- Storage policies: Users can upload/read their own {user_id}/ prefix

**Also create:**
4. `src/lib/supabase/types.ts` — TypeScript types generated from the schema (use Supabase CLI or manual types matching the SQL)

**Convention:**
- NEVER import createBrowserClient or createServerClient directly in components — always go through these factory files
- Mark server.ts and admin.ts with `import 'server-only'`
- Use the environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

**Acceptance Test:**
- `createBrowserClient()` returns a valid Supabase client
- SQL migration runs without errors in Supabase SQL Editor
- RLS prevents User A from seeing User B's data
- Storage bucket accepts file uploads under the correct path
```

---

## Task 1.4 — Auth Flow

### Head Prompt
```
You are implementing authentication for "Tesifye" using Supabase Auth.

**BEFORE WRITING ANY CODE**, read:
- ARCHITECTURE.md → "Auth Architecture" section
- ARCHITECTURE.md → "Project Directory Structure" for file locations
- SCHEMA.md → "profiles" table

**Task:** Implement email/password auth with middleware protection.

**Files to create:**
1. `src/app/(auth)/login/page.tsx` — Login page with email + password form
   - Glassmorphic card centered on dark background
   - "Sign In" button with loading state
   - Link to sign up page
   - Error display for invalid credentials
   - Logo + "Tesifye" branding at top

2. `src/app/(auth)/signup/page.tsx` — Signup page
   - Email + password + display name fields
   - Password strength indicator (optional)
   - Link to login page
   - Success → redirect to dashboard

3. `src/app/(auth)/callback/route.ts` — OAuth callback handler
   - Exchanges auth code for session
   - Prepared for future Google OAuth (just the route, no provider yet)

4. `src/middleware.ts` — Route protection
   - Protects: /dashboard/*, /projects/*
   - Allows: /, /auth/*, /api/*
   - Redirects unauthenticated users to /login

5. `src/app/(auth)/layout.tsx` — Auth layout (centered, minimal)

6. Auto-create profile on signup:
   - Use Supabase DB trigger or handle in callback
   - Insert into profiles table on new auth.users row

**Design:**
- Auth pages use the Premium Glassmorphic aesthetic
- Dark background (#0A0A0B), centered card
- Electric Violet (#7C3AED) primary button
- Inter font

**Convention:**
- Use @supabase/ssr cookie-based clients (from lib/supabase/server.ts)
- Sessions persist across page refreshes via cookies

**Acceptance Test:**
- New user can sign up with email/password
- Profile row is auto-created in profiles table
- User is redirected to /dashboard after login
- Unauthenticated visit to /dashboard redirects to /login
- Refresh on /dashboard maintains session
```

---

## Task 1.5 — Image Pipeline

### Head Prompt
```
You are implementing the image pipeline for "Tesifye". This handles screenshot upload, deduplication, compression, caching, and storage promotion.

**BEFORE WRITING ANY CODE**, read:
- ARCHITECTURE.md → "Image Pipeline: 4-Layer Dual-Hash" section
- SCHEMA.md → "project_assets" table
- ARCHITECTURE.md → "Supabase Storage Bucket" layout

**Task:** Implement the full 4-layer image pipeline.

**Files to create:**
1. `src/lib/utils/hash.ts`
   - `computeSHA256(file: File): Promise<string>` — exact content hash
   - `computePerceptualHash(file: File): Promise<string>` — Canvas 8×8 grayscale pHash
   - `hammingDistance(hash1: string, hash2: string): number` — similarity check (threshold: 10)

2. `src/lib/utils/compression.ts`
   - `compressImage(file: File): Promise<File>` — using browser-image-compression
   - Config: maxSizeMB: 0.15, maxWidthOrHeight: 1024, fileType: 'image/webp', quality: 0.75

3. `src/lib/services/asset.service.ts`
   - `checkDuplicate(projectId: string, hash: string): Promise<boolean>` — DB check
   - `checkSimilar(projectId: string, pHash: string): Promise<{similar: boolean, existingAsset?: Asset}>` — pHash check
   - `cacheToIDB(projectId: string, hash: string, blob: Blob): Promise<void>` — IndexedDB via idb-keyval
   - `promoteToSupabase(projectId: string, file: File, hash: string): Promise<ProjectAsset>` — Upload + DB row
   - `getSignedUrl(storagePath: string): Promise<string>` — 1hr TTL signed URL

4. `src/components/project/AssetUploader.tsx`
   - Drag-and-drop zone + file picker
   - Shows compression progress
   - Shows "Duplicate detected" or "Similar image found — replace?" prompts
   - Thumbnail preview after upload
   - Delete button per asset

5. `src/app/api/assets/upload/route.ts` — Thin route handler
   - Validates auth
   - Calls asset.service.ts
   - Returns asset metadata

**Image Pipeline Flow:**
```
File selected →
  1. computeSHA256() → check DB for existing hash → skip if found
  2. computePerceptualHash() → check DB for Hamming distance < 10 → warn if found
  3. compressImage() → WebP, ≤150KB
  4. cacheToIDB() → store locally with {project_id}:{hash} key
  5. promoteToSupabase() → upload to storage + insert project_assets row
```

**Edge Cases:**
- Image > 10MB: reject with error message
- Non-image file to screenshot upload: reject
- Camera screenshot vs cropped version: pHash catches similarity

**Acceptance Test:**
- Uploading a 5MB JPG compresses it to <150KB WebP
- Uploading the same image twice shows "Duplicate detected"
- Uploading a slightly cropped version shows "Similar image found"
- Images appear in Supabase Storage under correct path
- project_assets row has correct content_hash and perceptual_hash
```

---

## Task 1.6 — Project CRUD + App Shell

### Head Prompt
```
You are implementing project management and the core app shell for "Tesifye".

**BEFORE WRITING ANY CODE**, read:
- SCHEMA.md → "projects" and "project_assets" tables
- ARCHITECTURE.md → "Project Directory Structure" and "Visual Identity" sections
- SCOPE.md → "User Roles" for role selection options

**Task:** Build the app shell (sidebar, topbar, breadcrumb), project CRUD, and the Overview page.

**Files to create:**

1. `src/lib/services/project.service.ts`
   - `createProject`, `getProjects`, `getProject`, `updateProject`, `archiveProject`
   - `getProjectStats(projectId)` — returns { testCaseCount, uxScore, gapCount, bugCount } from manifest_snapshot

2. `src/components/layout/AppShell.tsx` — Root layout grid
   - CSS grid: [sidebar 220px] [main 1fr]
   - Sidebar + Topbar + scrollable main area
   - Renders children in main area

3. `src/components/layout/Sidebar.tsx` — Left navigation
   - Logo area: Tesifye logo mark + "Tesi**fye**" text + version badge
   - Project switcher button (shows current project name, icon, app_type)
   - "Workspace" nav section with all 10 feature nav items:
     Overview, Test Cases, UX Audit, Bug Reports, Gap Finder, Semantic Link, Test Data, Persona Friction, i18n Audit, Export
   - "Tools" nav section: Sidekick Chat (with green live dot), Settings
   - Footer: user avatar, display_name, plan badge, account button
   - Uses CSS class: .tf-sidebar (from app.css)

4. `src/components/layout/Topbar.tsx` — Top bar
   - Breadcrumb: folder icon + project name + "/" separator + current feature name
   - Quick search bar (opens CommandPalette on click, shows ⌘K shortcut)
   - Provider badge (active model e.g. "GROQ · llama-4-scout")
   - Notification icon button
   - Uses CSS class: .tf-topbar

5. `src/components/project/OverviewPage.tsx` — Project overview dashboard
   - 4-stat summary row: { Test cases, UX score, Coverage gaps, Open bugs } from manifest_snapshot
   - Analyzed Screens grid (6-col): shows ScreenThumbnail per asset, dirty dot if is_dirty, verified icon if is_verified
   - Recent Activity card: last 4 generated_artifacts (label + model + time ago)
   - "Jump into a feature" grid: 4-col button grid, one per feature (icon + label, navigates to feature tab)

6. `src/components/project/ScreenThumbnail.tsx`
   - Shows a phone or browser frame around a screenshot thumbnail
   - Displays label below, element count, verified/unverified icon
   - Orange dot overlay if is_dirty = true
   - Frame type auto-detected from asset metadata (mobile → phone frame, web → browser frame)

7. `src/components/project/ProjectForm.tsx` — Create/edit project form
8. `src/components/project/ProjectCard.tsx` — Dashboard project card
9. `src/app/dashboard/page.tsx` — Project listing page with Active/Archived tabs
10. `src/app/dashboard/[projectId]/page.tsx` — Project workspace (renders AppShell + feature router)
11. `src/app/dashboard/[projectId]/layout.tsx` — Loads project data, provides context

**Design:**
- Sidebar background: var(--glass-bg) with backdrop-filter: blur(var(--glass-blur))
- Active nav item: background var(--accent-glow), border-left 2px var(--accent)
- Nav badges use .tf-nav-badge (violet for counts, green for live indicator)
- Topbar: border-bottom 1px var(--border)

**Acceptance Test:**
- Sidebar renders all 10 workspace items + 2 tools items
- Provider badge shows in topbar
- Breadcrumb updates as user navigates between features
- Overview stat cards show data from manifest_snapshot
- ScreenThumbnail shows dirty dot on stale assets
- Activity feed shows last 4 AI actions with model name
- "Jump into feature" grid navigates to the correct tab
- RLS prevents seeing other users' projects
```

---

## Task 1.7 — Provider Registry

### Head Prompt
```
You are implementing the AI provider registry for "Tesifye". This is the multi-provider fallback system.

**BEFORE WRITING ANY CODE**, read:
- ARCHITECTURE.md → "Multi-Provider Fallback" and "AI Pipeline" sections
- ARCHITECTURE.md → "Model Registry" and "Feature → Model Mapping"
- SCHEMA.md → "System Prompts" and "generated_artifacts" table

**Task:** Set up the Vercel AI SDK provider registry with GROQ primary + Google AI fallback.

**Files to create:**
1. `src/lib/ai/providers.ts`
   - `MODEL_REGISTRY` object (all model strings from ARCHITECTURE.md)
   - `FEATURE_MODEL_MAP` (which feature uses which model)
   - `FALLBACK_CHAINS` (per-capability: vision, reasoning, fast)
   - `registry` — Vercel AI SDK `createProviderRegistry` with groq + google providers

2. `src/lib/ai/generate-with-fallback.ts`
   - `generateWithFallback<T>(chain, options)` — tries providers in order
   - Catches 429 → tries next provider
   - Returns `{ result: T, provider: string, model: string }`
   - Logs provider/model used for each call

3. `src/lib/ai/stream-with-fallback.ts`
   - Same as above but uses `streamObject` instead of `generateObject`
   - Returns the stream result for SSE forwarding

4. `src/components/shared/ProviderBadge.tsx`
   - "✦ Powered by GROQ" or "✦ Powered by Google AI"
   - Small, subtle, bottom-right of artifact display

**Fallback Chains:**
```
vision:     groq:llama-4-scout → google:gemini-2.5-flash
reasoning:  groq:llama-3.3-70b → google:gemini-2.5-flash
ux_review:  groq:llama-4-maverick → google:gemini-2.5-flash
fast:       groq:llama-3.1-8b → google:gemini-2.5-flash
```

**Convention:**
- NEVER import AI SDK directly in route handlers — always go through these utilities
- All API keys are server-side only (no NEXT_PUBLIC_ prefix)
- Record which provider+model was used in generated_artifacts.model_used and .provider

**Acceptance Test:**
- `generateWithFallback('reasoning', {...})` returns structured output
- If GROQ rate limits, it falls back to Google AI silently
- Console logs show which provider served each request
- ProviderBadge displays correct provider name
```

---

## Task 1.8 — Scout Pipeline

### Head Prompt
```
You are implementing the Scout stage of Tesifye's AI pipeline.

**BEFORE WRITING ANY CODE**, read:
- SCHEMA.md → "ScreenElementMap" Zod schema and "Scout System Prompt"
- ARCHITECTURE.md → "AI Pipeline: Scout → Generator → Judge"
- ARCHITECTURE.md → "Image Pipeline" → "Sending to GROQ Vision"

**Task:** Implement the Scout: screenshot → ScreenElementMap JSON.

**Files to create:**
1. `src/lib/schemas/screen-element-map.ts` — The Zod schemas exactly as specified in SCHEMA.md:
   - UIElementSchema, PlatformSignalsSchema, ScreenElementMapSchema

2. `src/lib/ai/prompts/scout.ts` — The SCOUT_SYSTEM_PROMPT from SCHEMA.md

3. Add to `src/lib/ai/weaver.service.ts`:
   - `runScout(assetId: string, imageUrl: string): Promise<ScreenElementMap>`
   - Uses `generateWithFallback('vision', ...)` with the Scout prompt
   - Validates output against ScreenElementMapSchema
   - Saves result as generated_artifact (type: 'vision_map')
   - Caches: if vision_map already exists for this asset and isn't dirty, return cached

4. `src/app/api/generate/scout/route.ts` — Thin route handler (optional, Scout is usually called internally by the weaver)

**Input:** Signed URL or base64 of a compressed screenshot
**Output:** ScreenElementMap JSON (Zod-validated)

**Key behaviors:**
- Scout runs once per screenshot, cached in generated_artifacts
- If screenshot is_dirty (project context changed), re-run Scout
- Max 10 images per batch (sequential, not parallel, to respect rate limits)
- Record model_used, provider, token_count on the artifact

**Acceptance Test:**
- Upload a screenshot → Scout produces a valid ScreenElementMap
- Elements in the map match what's visible in the screenshot
- Result is saved in generated_artifacts with type='vision_map'
- Second call with same image returns cached result
- Dirty image forces re-analysis
```

---

## Task 1.9 — Generator Pipeline

### Head Prompt
```
You are implementing the Generator stage of Tesifye's AI pipeline.

**BEFORE WRITING ANY CODE**, read:
- SCHEMA.md → "Test Case Output" Zod schema and "Generator System Prompt"
- ARCHITECTURE.md → "Context Budget" and "Streaming-First Convention"
- SCOPE.md → "Feature 1: Test Case Generator" for all inputs, outputs, edge cases

**Task:** Implement the Generator: project context + ScreenElementMaps → test cases (streaming).

**Files to create:**
1. `src/lib/schemas/test-case.ts` — TestStepSchema, TestCaseSchema, TestSuiteOutputSchema from SCHEMA.md

2. `src/lib/ai/prompts/generator.ts` — buildGeneratorPrompt function from SCHEMA.md

3. `src/lib/ai/context-budget.ts`
   - `buildGeneratorContext(projectId: string, featureType: string): Promise<string>`
   - Fetches project data + latest ScreenElementMaps + historical artifacts
   - Applies token budget (14K total) using estimates
   - Compresses older artifacts via 8B model if over budget

4. Add to `src/lib/ai/weaver.service.ts`:
   - `runGenerator(projectId: string, featureType: string, options: GenerateOptions): AsyncGenerator<Partial<TestSuiteOutput>>`
   - Uses `streamObject` via stream-with-fallback.ts
   - Applies context budget from context-budget.ts
   - Gets all ScreenElementMaps for the project
   - Streams partial TestSuiteOutput

5. `src/app/api/generate/test-cases/route.ts` — Thin route handler
   - Auth check
   - Parse body (project_id, focus_areas)
   - Call weaver.service.runGenerator()
   - Forward SSE stream to client

**Convention:**
- Generator uses streamObject, NOT generateObject
- Context budget is applied BEFORE calling the AI
- All partial objects must conform to TestSuiteOutputSchema (partial)

**Acceptance Test:**
- Calling the API with a project_id returns a stream of partial test cases
- Test cases reference UI elements from ScreenElementMaps
- Token count stays within ~14K input budget
- Partial results appear in the SSE stream progressively
```

---

## Task 1.10 — Judge Pipeline

### Head Prompt
```
You are implementing the Judge stage of Tesifye's AI pipeline.

**BEFORE WRITING ANY CODE**, read:
- SCHEMA.md → "Judge System Prompt"
- ARCHITECTURE.md → "AI Pipeline" → Stage 3

**Task:** Implement the Judge: generated artifact + ScreenElementMaps → verified artifact.

**Files to create/modify:**
1. `src/lib/ai/prompts/judge.ts` — JUDGE_SYSTEM_PROMPT from SCHEMA.md

2. Add to `src/lib/ai/weaver.service.ts`:
   - `runJudge(artifact: TestSuiteOutput, visionMaps: ScreenElementMap[]): Promise<TestSuiteOutput>`
   - Uses `generateWithFallback('fast', ...)` (NOT streaming — needs complete input)
   - Cross-references element labels in test steps against vision maps
   - Sets is_verified boolean on each test case
   - Adds verification_note where elements weren't found

3. Update the test-cases route handler to run Judge AFTER streaming completes:
   - Stream Generator output → collect complete result → run Judge → save verified artifact

**Flow:**
1. Generator streams partial output (user sees cards appearing)
2. Stream completes → full TestSuiteOutput
3. Judge receives full output + all vision maps
4. Judge returns verified output (is_verified set on each test case)
5. Save final artifact to generated_artifacts with is_verified = true/false
6. Push verification results to client (green ✓ badges appear)

**Acceptance Test:**
- Test cases referencing real UI elements get is_verified = true
- Test cases referencing non-existent elements get is_verified = false with a note
- Judge does NOT add new test cases — only verifies existing ones
- Total pipeline: Scout → Generator (stream) → Judge → save → both are recorded
```

---

## Task 1.11 — Context Budget

### Head Prompt
```
You are implementing the context budget system for Tesifye.

**BEFORE WRITING ANY CODE**, read:
- ARCHITECTURE.md → "Context Budget: Semantic Truncation" section

**Task:** Implement the token estimation and semantic truncation pipeline.

**File:** `src/lib/ai/context-budget.ts`

**Functions:**
- `estimateTokens(text: string): number` — rough count (chars / 4)
- `buildCompressedHistory(projectId: string, currentType: string): Promise<string>`
  - Fetch latest artifacts grouped by type
  - Current artifact type included verbatim (up to 4K tokens)
  - Other artifact types compressed via 8B model summarization
  - Total compressed output ≤ 2K tokens
- `buildFullContext(projectId: string, featureType: string, userMessage: string): Promise<ContextPayload>`
  - Assembles: system prompt (2K) + screen maps (5K) + active artifact (4K) + history (2K) + user msg (1K)
  - Returns structured payload ready for AI call

**Rule:** Never send raw manifest_snapshot to the AI. Always use this pipeline.

**Acceptance Test:**
- Context for a project with 10 artifacts stays under 14K estimated tokens
- Old artifacts are summarized, not included raw
- Current artifact type gets full fidelity
```

---

## Task 1.12 — System Prompts

### Head Prompt
```
You are creating the system prompt templates for Tesifye's AI pipeline.

**BEFORE WRITING ANY CODE**, read:
- SCHEMA.md → "System Prompts" section (contains all three prompts)

**Task:** Create the prompt files exactly as specified.

**Files to create:**
1. `src/lib/ai/prompts/scout.ts` — SCOUT_SYSTEM_PROMPT
2. `src/lib/ai/prompts/generator.ts` — buildGeneratorPrompt(feature, role)
3. `src/lib/ai/prompts/judge.ts` — JUDGE_SYSTEM_PROMPT

Copy these EXACTLY from SCHEMA.md. Do not modify the prompt text.
```

---

## Task 1.13 — Test Case UI

### Head Prompt
```
You are implementing the test case generation UI for Tesifye.

**BEFORE WRITING ANY CODE**, read:
- ARCHITECTURE.md → "Streaming-First Convention" and "Partial Stream Recovery"
- SCOPE.md → "Feature 1: Test Case Generator" for all UI behaviors
- SCHEMA.md → "Generation Store" Zustand interface

**Task:** Build the streaming test case UI with optimistic skeleton → animated content.

**Files to create:**
1. `src/stores/generation.store.ts` — Zustand store matching SCHEMA.md GenerationState interface

2. `src/components/generation/TestCaseCard.tsx`
   - Renders a single test case
   - Has three states: skeleton (shimmer) → streaming (partial data) → complete (full data + verified badge)
   - Priority badge (color-coded)
   - Verification badge (green ✓ or orange ⚠)
   - Click to expand steps
   - framer-motion AnimatePresence for transitions

3. `src/components/generation/TestCaseList.tsx`
   - Maps generation.store test cases to TestCaseCards
   - Category filter tabs
   - Priority sort toggle
   - "X of Y test cases generated" counter

4. `src/components/generation/GenerateButton.tsx`
   - Triggers generation
   - Shows progress during streaming
   - Shows "Generation interrupted" banner with Resume/Keep Partial buttons if status is 'partial'

5. `src/components/generation/StreamingOverlay.tsx`
   - "Tesifye is thinking..." with animated logo
   - Backdrop blur on the content area
   - Provider badge

6. `src/hooks/useStreamObject.ts`
   - Custom hook that calls the /api/generate/test-cases endpoint
   - Consumes SSE stream
   - Updates generation.store on each chunk
   - Handles errors → sets status to 'partial'

**Streaming Flow:**
1. User clicks "Generate" → skeletons appear immediately
2. Stream starts → cards animate in one by one
3. Stream completes → Judge runs → green badges appear
4. If stream fails → "Generation interrupted" banner with Resume/Keep

**Acceptance Test:**
- Clicking Generate shows skeleton cards immediately
- Cards animate in as stream data arrives
- Categories can be filtered
- Partial failure shows Resume/Keep buttons
- Verified badges appear after Judge completes
```

---

## Task 1.14 — Partial Stream Recovery

### Head Prompt
```
You are implementing partial stream recovery for Tesifye.

**BEFORE WRITING ANY CODE**, read:
- ARCHITECTURE.md → "Partial Stream Recovery" section
- SCHEMA.md → GenerationState Zustand interface

**Task:** Handle mid-stream generation failures gracefully.

**Modify:** `src/stores/generation.store.ts` and `src/components/generation/GenerateButton.tsx`

**Behaviors:**
- On stream error: status → 'partial', save whatever we have
- Banner: "Generation interrupted — {n} of ~{total} test cases generated."
- "Resume": re-trigger with prompt "Continue from TC-{n+1}. Previous: [...]"
- "Keep Partial": save as-is with is_verified: false, status: 'partial'
- Resumption merges new stream output with existing partial

**Acceptance Test:**
- Simulated network drop during stream shows recovery UI
- Resume generates remaining test cases without duplicating existing ones
- Keep Partial saves the partial artifact to the database
```

---

## Task 1.15 — Export Engine Page

### Head Prompt
```
Create the Export Engine as a dedicated sidebar page for Tesifye.

Read: SCOPE.md → "Cross-Feature: Export System" for format details.
Read: ARCHITECTURE.md → "Visual Identity" for design tokens.

**Context:** Export is a first-class nav item in the sidebar from day one (not a button hidden inside other features). It must render as a full page at the 'export' nav route.

**Files to create:**
1. `src/lib/services/export.service.ts`
   - `toMarkdown(artifact): string` — formatted Markdown
   - `toJSON(artifact): string` — pretty-printed JSON
   - `toCSV(artifact): string` — using json2csv (install: npm install json2csv)
   - `toBundleBlob(artifacts: Record<string, unknown>, formats: string[]): Blob` — ZIP of selected artifacts

2. `src/components/features/ExportPage.tsx` — Full export page
   - 6 format cards in a 3-col grid: Markdown, CSV, JSON, Gherkin (.feature), Jira Markup, Linear
     - Each card: icon, format name, description, individual Download button
   - "What's included" section: toggle switches per artifact type
     (Test cases, UX issues, Bug reports, PRD findings, Persona friction, Test data)
     Toggle state controls which artifacts go into the bundle
   - "Download Bundle" primary CTA button: zips all enabled artifacts in the selected format
   - Provider badge showing last generation model

3. Inline export buttons on feature pages (secondary):
   - TestCaseList: "Copy as Markdown" + "Download JSON" buttons in filter row
   - These call export.service functions directly

**Acceptance Test:**
- Export page is reachable via sidebar 'Export' nav item
- Format cards all render with correct icons and descriptions
- Toggle switches control what's included in the bundle
- Markdown export is well-formatted with headers and tables
- JSON download produces a valid JSON file
- Copy to clipboard shows a success toast
```

---

## Task 1.16 — Rate Limit Queue

### Head Prompt
```
Implement the client-side rate limit queue.

Read: ARCHITECTURE.md → "Rate Limit Queue" section.
Read: SCHEMA.md → "Rate Limit Store" interface.

**File:** `src/stores/rate-limit.store.ts`

Implement the full RateLimitState interface with pre-emptive queue logic.
- Check cooldowns before sending
- Track token usage per model
- Priority: user actions > judge > background
- Display "Estimated wait: Xs" when queued

**Acceptance Test:**
- Rapid successive generation requests queue instead of flooding
- Queue shows estimated wait time
- Priority ordering works (user action cuts the queue)
```

---

## Task 1.17 — Landing Page

### Head Prompt
```
Build the Tesifye landing page.

Read: ARCHITECTURE.md → "Visual Identity" for design system.
Read: SCOPE.md → "Product Identity" for tagline and positioning.

**File:** `src/app/page.tsx` (landing page)

**Sections:**
1. Hero: Logo + "Tesifye" + tagline + "Get Started" CTA
2. Features: 3-4 cards showing key features (Test Cases, UX Audit, Gap Analysis)
3. How it works: 3-step visual (Upload → Generate → Export)
4. CTA: "Start Testing Smarter" button → /signup

**Design:**
- Premium Glassmorphic aesthetic
- Animated gradient background (subtle)
- Cards with hover glow
- Mobile-responsive

**Acceptance Test:**
- Page loads fast, looks premium
- CTA buttons link to /signup
- Responsive on mobile (tested at 375px)
- Proper meta tags for SEO
```

---

## Task 1.18 — Manifest Trigger

### Head Prompt
```
Verify and test the Postgres trigger that updates manifest_snapshot.

Read: SCHEMA.md → handle_new_artifact() trigger function.

This trigger should already exist from Task 1.3 (Supabase Setup). This task validates it works.

**Test:**
1. Insert a test artifact into generated_artifacts
2. Verify projects.manifest_snapshot is updated automatically
3. Verify previous artifacts of same type have is_latest set to FALSE
4. Verify the manifest structure matches SCHEMA.md

If the trigger doesn't exist, create it as specified in SCHEMA.md.
```

---

## Task 1.19 — Landing Page (full mockup)

### Head Prompt
```
Build the full Tesifye landing page matching the Mockups/landing.jsx reference.

Read: ARCHITECTURE.md → "Visual Identity" and "CSS File Strategy" for tokens.
Read: SCOPE.md → "Product Identity" for tagline and positioning.

**Task:** Build the complete marketing landing page. Use src/styles/marketing.css for all styles.

**Sections to build (in order):**
1. MNav — Minimal sticky top navigation: logo + nav links (Features, Pricing, About) + "Get Started" button
2. Hero — Animated gradient background, headline, subheadline, CTA, ProductScreenshot mockup
3. Logo strip — "Trusted by QA teams at" + 5-6 company logo placeholders (SVG inline)
4. Features grid — 4 cards each with icon, title, description, and "Learn more" link
5. Pipeline visual — Horizontal 3-step: Upload → Generate → Export with connecting arrows
6. Metrics / CountUp row — 3 animated counters: "10K+ Test cases generated", "95% Coverage rate", "50+ Teams trust Tesifye"
7. Testimonials — 3 cards with avatar, quote, name, role, company
8. Pricing tease — Link to pricing page with "View Plans"
9. FAQ accordion — 5 questions/answers
10. CTA section — "Start Testing Smarter" with sign-up button
11. MFooter — Logo, nav links, social links, copyright

**Component files to create:**
- src/components/marketing/MNav.tsx
- src/components/marketing/MFooter.tsx
- src/components/marketing/CountUp.tsx (animates number from 0 to target on scroll into view using IntersectionObserver)
- src/components/marketing/Testimonials.tsx
- src/components/marketing/FAQ.tsx (accordion with animated expand)
- src/app/page.tsx (assembles all sections)
- src/app/pricing/page.tsx (Pricing page — 3 tiers: Free, Pro $19/mo, Team $49/mo)
- src/app/about/page.tsx (basic About page placeholder)

**Design:**
- Uses src/styles/marketing.css classes (.hero, .feat-card, .pipeline-step, .testimonial-card, etc.)
- Instrument Serif italic for hero headline accent word
- Subtle animated gradient behind hero (CSS-only)
- useScrollReveal hook for section entrance animations

**Acceptance Test:**
- All 11 sections render correctly
- CountUp animates when scrolled into view
- FAQ accordion opens/closes with smooth animation
- Pricing page shows 3 tiers with feature lists
- Responsive at 375px (mobile) and 1280px (desktop)
- Proper SEO meta tags on every page (title, description)
```

---

## Task 1.20 — Sidekick Chat (v1 Session)

### Head Prompt
```
Implement the Sidekick Chat feature for Tesifye (Phase 1 / session-only version).

Read: SCOPE.md → "Feature 6: Sidekick Chat"
Read: SCHEMA.md → "Generation Store" Zustand interface
Read: ARCHITECTURE.md → "Streaming-First Convention"

**Context:** Sidekick is a dedicated sidebar nav item — a FULL PAGE (not a slide-in panel). It is separate from all feature pages.

**Files to create:**
1. `src/components/features/SidekickPage.tsx` — Full chat page
   - Layout: Messages area (flex-1, scrollable) + sticky input bar at bottom
   - Bubble types: user (right-aligned, --accent-strong border) + assistant (left, .tf-card)
   - Typing indicator: 3-dot bounce animation while AI is responding
   - Message markdown: use SimpleMarkdown.tsx for inline **bold**, `code`, and numbered lists
   - Context line below input: "Context: {project name} · {active feature}"
   - Suggested prompts: 4 chip buttons shown when chat is empty ("Summarize test coverage", "What's missing from UX?", "Generate edge case ideas", "Explain the Gap findings")
   - Header: "Sidekick" title + green live dot + "AI QA Assistant" label + model badge

2. `src/components/shared/SimpleMarkdown.tsx` — Lightweight inline markdown renderer
   - Handles: **bold**, *italic*, `inline code`, numbered lists, bullet lists
   - No external library — regex-based transformation

3. `src/app/api/generate/chat/route.ts` — Thin route handler
   - Auth check
   - Build context via context-budget.ts (compressed project summary)
   - Stream response via streamObject (reasoning_large model)
   - Response: { message: string } (plain prose, not structured JSON)

**Phase 1 behavior (session-only):**
- Messages stored in React state ONLY — NOT persisted to DB in Phase 1
- Cleared on page refresh
- Chat knows about the current project (via context-budget.ts)
- Does NOT know about previous chat sessions

**Acceptance Test:**
- Sidekick page reachable via sidebar nav item
- Typing a message and pressing Enter streams a response
- Typing indicator shows while streaming
- Suggested prompts appear on empty chat and populate input on click
- Messages render markdown correctly
- Page refresh clears chat history
```

---

## Task 1.21 — TweaksPanel (Theme Switcher)

### Head Prompt
```
Add the TweaksPanel theme switcher to Tesifye's app shell.

Read: ARCHITECTURE.md → "Theme Variants" section for the 3 theme values.

**Files to create/modify:**
1. `src/components/ui/TweaksPanel.tsx` (already created in Task 1.2 — wire it up here)
   - Triggered by a Settings button in the Sidebar footer area
   - Opens as a slide-in panel from the right side
   - Shows 3 theme swatches with labels:
     - "Deep Obsidian" (default) — #07070A swatch
     - "Lighter Glass" (lighter-glass) — #1A1A2E swatch
     - "Mono Violet" (mono-violet) — #0A0A0F swatch
   - Selected theme: checkmark icon on swatch
   - Apply: writes `data-theme` attribute to `document.documentElement`
   - Persist: saves theme name to `localStorage` under key `tf-theme`
   - Load: on app mount, read localStorage and apply theme before first paint (avoid flash)

2. Modify `src/app/layout.tsx` (root layout):
   - Add a `<script>` tag in `<head>` that reads localStorage and sets data-theme before hydration
   - This prevents the theme flash on page refresh

**Acceptance Test:**
- Switching theme changes the appearance immediately without a flash
- Theme persists across page refreshes
- All 3 themes render distinct visual differences
- TweaksPanel closes when clicking outside
```

---

# Phase 2 — Analysis & Richness

**Goal:** Add UX/UI Auditor, Bug Reports, role-based output, Gherkin export, Sidekick chat.
**Duration:** 2-3 weeks
**Dependencies:** Phase 1 complete

### Phase 2 Head Prompt (use this to start Phase 2)
```
You are continuing development of "Tesifye", an AI-native QA platform. Phase 1 (core engine) is complete.

**BEFORE WRITING ANY CODE for ANY Phase 2 task**, read:
- ARCHITECTURE.md — full architecture reference
- SCOPE.md — feature scope and edge cases
- SCHEMA.md — all data structures and prompts
- PHASES.md — this file, for specific task instructions

Phase 1 delivered: project CRUD, image pipeline, Scout→Generator→Judge pipeline, test case generation with streaming, export, rate limiting.

Phase 2 adds: UX/UI Auditor, pre-AI screen metrics, bug reports, role-based output, Gherkin export, Sidekick chat, privacy controls, Shadow Scout.

Follow the existing coding conventions from Phase 1:
- Thin route handlers → lib/ services
- Zod schemas in lib/schemas/
- streamObject for user-facing, generateObject for internal
- Zustand for cross-component state
- Glassmorphic design tokens from globals.css
```

## Task 2.1 — UX/UI Auditor
```
Implement the UX/UI Auditor feature.

Read: SCOPE.md → "Feature 2: UX/UI Auditor" for full spec.
Read: SCHEMA.md → "UX Review Output" Zod schema.

Pipeline: Scout → Generator (ux_narrative model) → Judge
Uses streamObject for streaming UX findings to the user.

Create:
- src/lib/schemas/ux-review.ts (from SCHEMA.md)
- Add UX audit prompt to lib/ai/prompts/generator.ts
- Add UX audit to weaver.service.ts
- src/app/api/generate/ux-audit/route.ts
- src/components/generation/UXReviewPanel.tsx (score display + findings list)

Output: Overall score (0-100), per-heuristic scores, findings with severity + suggestions.
```

## Task 2.2 — Pre-AI Screen Metrics
```
Add Canvas-based screen metric extraction BEFORE AI analysis.

Read: SCOPE.md → "Feature 2" → "Pre-AI Screen Metrics" section.

Create: src/lib/utils/screen-metrics.ts
- extractDominantColors(imageUrl: string): Promise<string[]> (via extract-colors)
- computeContrastRatios(colors: string[]): Promise<ContrastResult[]> (via wcag-contrast-utils)
- computeElementDensity(visionMap: ScreenElementMap): number

These metrics are injected into the UX Auditor prompt as FACTS (not AI opinions).
Install: npm install wcag-contrast-utils extract-colors
```

## Task 2.3 — Screenshot Labeling
```
Add user-provided labels/tags to screenshots.

Modify: AssetUploader.tsx and project_assets.metadata.label field.
Add: inline edit for label text on each screenshot thumbnail.
```

## Task 2.4 — Dirty State Detection
```
Implement dirty state detection and re-analyze prompts.

Read: SCOPE.md → "Cross-Feature: Dirty State"

When project description/scope changes:
1. Set is_dirty = TRUE on all project_assets
2. Show violet pulse animation on dirty screenshots
3. Show prompt: "Context changed. Re-analyze?"
4. User can re-analyze (re-run Scout) or dismiss

Create: src/components/shared/DirtyStatePulse.tsx
```

## Task 2.5 — Bug Report Formatter
```
Implement the bug report formatter.

Read: SCOPE.md → "Feature 3: Bug Report Formatter"
Read: SCHEMA.md → "Bug Report Output" Zod schema.

**Key schema fields to implement (matches updated SCHEMA.md):**
- severity: blocker | critical | major | minor | trivial (lowercase)
- priority: P0 | P1 | P2 | P3 | P4 (5 levels)
- component: string (app area)
- environment.platform: string (Android, iOS, Web, Desktop)
- environment.app_version: string
- steps_to_reproduce: string[] (plain strings, not objects)
- frequency: always | often | sometimes | rarely | once
- root_cause_hypothesis: string (AI inferred)
- labels: string[] (searchable tags)

Create:
- src/lib/schemas/bug-report.ts (from SCHEMA.md)
- src/app/api/generate/bug-report/route.ts
- src/components/generation/BugReportCard.tsx
  - Shows severity badge, frequency indicator ("Always reproducible"), labels row
  - Steps listed as numbered plain strings
  - Hypothesis section with lightbulb icon
  - Jira / Linear tab switcher (Phase 3 connects these; Phase 2 just shows the tab UI)
- Bug description textarea + device context fields
```

## Task 2.6 — Role-Based Output
```
Implement role-based output switching.

Read: SCOPE.md → "Cross-Feature: Role-Based Output"

Modify the Generator prompt to adapt based on projects.user_role:
- manual_tester: verbose steps, plain language
- automation_engineer: selectors, data-driven format
- qa_lead: summary, coverage metrics
- product_manager: business impact language
- ux_designer: design-focused findings

Add role indicator in generation UI.
```

## Task 2.7 — Gherkin Export
```
Add Gherkin (.feature) export for test cases.

Use llama-3.1-8B (fast_format model) to convert TestSuiteOutput to Gherkin format.
Add "Export as Gherkin" button to TestCaseList.
```

## Task 2.8 — UX Score History
```
Add UX score trend chart using recharts.

Query generated_artifacts for all ux_review artifacts, extract overall_score + created_at.
Display as line chart with date on X axis, score on Y axis.
Install: npm install recharts
```

## Task 2.9 — Sidekick Chat v1 (Persistence)
```
Upgrade Sidekick Chat to persist messages to the database (Phase 2 version).

Read: SCOPE.md → "Feature 6: Sidekick Chat" → v1 vs v2 comparison.
Read: SCHEMA.md → "chat_sessions" table.

**Context:** The Sidekick page UI was built in Task 1.20. This task adds DB persistence.

Upgrade:
- Create chat_sessions table migration (from SCHEMA.md) if not already created in Task 1.3
- On session start: upsert a chat_sessions row for this project
- On every new message pair: append to messages JSONB array
- On page load: fetch messages from chat_sessions for the current project
- Add "Clear Chat" button that sets messages = []
- Chat now survives page refresh (DB-persisted)
- Still no cross-project memory (Phase 5)
```

## Task 2.10 — Data Privacy Toggle
```
Add privacy controls to project settings.

Read: SCOPE.md → "Cross-Feature: Data Privacy Controls"

Create toggle in project settings:
- "Private Mode" (default): GROQ only
- "Extended Mode": GROQ + Google AI + Cerebras
- Show disclosure about Google's training policy
- Stored in projects.extended_providers_enabled
- generateWithFallback respects this setting
```

## Task 2.11 — Shadow Scout
```
Add background Scout pre-processing on screenshot upload.

Read: ARCHITECTURE.md → "Shadow Scout" section.

Modify: src/app/api/assets/upload/route.ts
- Add `after()` from 'next/server' to run Scout in background after upload response
- Track status in project_assets.metadata.vision_map_status: 'pending' | 'ready' | 'stale'
- If user clicks Generate before Shadow Scout finishes, run Scout on-demand as fallback
- Rate limit queue treats Shadow Scout as lowest priority
```

---

# Phase 3 — Intelligence Layer

**Goal:** PDF/DOCX import, OCR, semantic linking, test data, CSV export, coverage analysis.
**Duration:** 2-3 weeks
**Dependencies:** Phase 2 complete

### Phase 3 Head Prompt
```
You are continuing Tesifye development. Phases 1-2 are complete.

Read all 4 markdown files before starting any Phase 3 work.

Phase 3 adds: document processing (PDF/DOCX/OCR), requirement gap analysis, semantic linking, synthetic test data, advanced export, prompt versioning, coverage analysis.

Key Phase 3 dependency: Install npm install pdfjs-dist mammoth tesseract.js json2csv
```

## Task 3.1 — Requirement Gap Finder
```
Implement PDF and DOCX requirement document processing.

Read: SCOPE.md → "Feature 4: Requirement Gap Finder"
Read: SCHEMA.md → "Gap Analysis Output" Zod schema.

Create:
- Document processing pipeline (PDF → pdfjs-dist, DOCX → mammoth)
- src/lib/schemas/gap-analysis.ts
- src/app/api/generate/gap-analysis/route.ts
- Gap analysis UI showing: covered, missing, undocumented, ambiguous
```

## Task 3.2 — Scanned PDF OCR
```
Add tesseract.js OCR fallback for scanned PDFs (no text layer).

Read: SCOPE.md → "Feature 4" → OCR Strategy section.

When pdfjs-dist extracts empty text from a PDF page:
- Lazy-load tesseract.js: const { createWorker } = await import('tesseract.js')
- Create ONE worker, process ALL pages, then terminate
- Show progress: "Extracting text via OCR... Page X of Y"
- Worker reuse pattern: single worker for all pages, terminate only after completion
```

## Task 3.3 — Semantic Link Engine
```
Read: SCOPE.md → "Feature 5: Semantic Link Engine"
Map PRD sections to UI screens with confidence scores.
Create bidirectional traceability matrix UI.
```

## Task 3.4 — Synthetic Test Data
```
Read: SCOPE.md → "Feature 7: Synthetic Test Data Generator"
Use @faker-js/faker for data factory + GROQ for intelligent field mapping.
Output JSON/CSV of test data matching the app's form fields.
```

## Task 3.5 — Full Export
```
Add CSV export (json2csv), Jira integration, Linear integration.
Read: SCOPE.md → "Cross-Feature: Export System"
```

## Task 3.6 — Prompt Versioning
```
Add prompt_version tracking to generated_artifacts.
When system prompts are updated, flag old artifacts for optional re-generation.
Add "Re-generate with latest prompts" button on stale artifacts.
```

## Task 3.7 — Token Budget Estimator
```
Pre-generation token estimate shown to user.
"This generation will use ~8,200 tokens." Helps users understand credit usage.
```

## Task 3.8 — Coverage Gap Analysis
```
Compare generated test cases against project scope.
Show: what scope areas are well-tested vs under-tested.
Visual: scope breakdown with coverage percentage bars.
```

---

# Phase 4 — Power Features

**Goal:** Persona analysis, i18n audit, accessibility deep-dive, versioning, launch readiness.
**Duration:** 2-3 weeks
**Dependencies:** Phase 3 complete

### Phase 4 Head Prompt
```
You are continuing Tesifye development. Phases 1-3 are complete.

Read all 4 markdown files before starting any Phase 4 work.

Phase 4 adds: persona friction analysis, i18n/RTL audit, accessibility deep-dive, test suite versioning, exploratory testing ideas, launch readiness score, project templates.

Install: npm install @faker-js/faker recharts date-fns
```

## Task 4.1 — Persona Friction Analysis
```
Read: SCOPE.md → "Feature 8: Persona Friction Analysis"
Generate per-persona UX friction reports with audience-specific prompting.
```

## Task 4.2 — i18n / RTL Audit
```
Read: SCOPE.md → "Feature 9: i18n / RTL Audit"
Check for truncation risks, RTL layout issues, hardcoded strings.
```

## Task 4.3 — Accessibility Deep-Dive
```
WCAG 2.1 AA comprehensive audit beyond basic contrast checks.
Check: alt text, keyboard nav, focus order, screen reader compatibility.
```

## Task 4.4 — Test Suite Versioning
```
Diff between test suite runs. Show added/removed/modified test cases.
Visual: side-by-side comparison with highlighting.
```

## Task 4.5 — Exploratory Testing Ideas
```
AI-generated creative testing scenarios based on project context.
"What if a user tries to..." style suggestions.
```

## Task 4.6 — Launch Readiness Score
```
Read: SCOPE.md → "Feature 10: Launch Readiness Score"
Composite score from: test coverage, UX score, gaps, open bugs.
Visual dashboard with blocking issues highlighted.
```

## Task 4.7 — Project Templates
```
Pre-configured project templates: E-commerce, SaaS, FinTech, Social.
Each template pre-fills description, scope, focus areas, and persona defaults.
```

---

# Phase 5 — Collaboration & Scale

**Goal:** Google OAuth, teams, comments, sharing, analytics, persistent chat.
**Duration:** 3-4 weeks
**Dependencies:** Phase 4 complete

### Phase 5 Head Prompt
```
You are continuing Tesifye development. Phases 1-4 are complete.

Read all 4 markdown files before starting any Phase 5 work.

Phase 5 adds: Google OAuth, team workspaces, comments, sharing, analytics dashboard, activity feed, persistent Sidekick chat.
```

## Task 5.1 — Google OAuth
```
Activate Google OAuth via Supabase Dashboard.
The callback route already exists from Phase 1.
Add "Sign in with Google" button to login/signup pages.
```

## Task 5.2 — Team Workspaces
```
Add organizations/teams with multi-user access.
New tables: teams, team_members.
RLS policies for team-shared projects.
Invite flow via email.
```

## Task 5.3 — Comments & Annotations
```
Add commenting on generated artifacts.
Thread-style comments on individual test cases, UX findings.
```

## Task 5.4 — Shared Report Links
```
Generate token-based read-only links for sharing reports externally.
No authentication required for viewers.
Expiry: configurable (24h, 7d, 30d, never).
```

## Task 5.5 — Analytics Dashboard
```
Dashboard showing: coverage %, score trends, generation history, token usage.
Charts: recharts.
Data: aggregate from generated_artifacts.
```

## Task 5.6 — Activity Feed
```
Timeline of all project activity: generations, uploads, edits, comments.
Real-time via Supabase realtime subscriptions.
```

## Task 5.7 — Sidekick Chat v2
```
Read: SCOPE.md → "Feature 6" → v1 vs v2 comparison.
Persist chat to chat_sessions table.
Cross-session memory: chat knows what was discussed last time.
Cross-artifact awareness: "Compare today's UX score with last week's"
```

---

## Appendix: Risk Matrix

| Risk | Severity | Phase | Mitigation |
|---|---|---|---|
| GROQ rate limits | Medium | 1 | Multi-provider fallback |
| All providers rate-limited | Low | 1 | Queue + countdown + cached artifacts |
| Vision model inaccuracy | Medium | 1 | Judge self-corrects + manual labels |
| Zod schema mismatch | Medium | 1 | try/catch, fallback to raw text |
| Context poisoning | High | 1 | Semantic truncation (14K budget) |
| Data privacy (Google) | Medium | 2 | User opt-in toggle |
| IndexedDB limits | Low | 1 | Warn at 50MB, force promote |
| Supabase free egress | Medium | 1 | Compression, serve from IDB |
| Scanned PDFs | Low | 3 | Tesseract.js OCR fallback |
| pHash dedup failure | Low | 1 | Hamming distance threshold tuning |
| Mid-stream failure | Medium | 1 | Partial stream recovery |
| Prompt regression | Medium | 3 | Version tracking, re-gen option |
| Model deprecation | Low | 1 | MODEL_REGISTRY easy swap |
