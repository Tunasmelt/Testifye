# Tesifye — System Architecture

> **Purpose:** Single source of truth for system architecture. Any agent reads this file to understand HOW the system works.
> **Related files:** [SCOPE.md](./SCOPE.md) (WHAT it does) · [SCHEMA.md](./SCHEMA.md) (DATA structures) · [PHASES.md](./PHASES.md) (WHEN to build it)

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 16.2.6 (App Router; `package.json` `^16.2.6`) | Full-stack React, serverless. Decision 2026-11-08: Next 16.2.6 is the target version. |
| Language | TypeScript | 5.x | Type safety everywhere |
| Styling | Vanilla CSS | — | Custom properties, glassmorphic tokens |
| Auth + DB + Storage | Supabase | Latest | Postgres, RLS, Auth, Storage buckets |
| AI SDK | Vercel AI SDK (`ai`) | Latest | `streamObject`, `generateObject`, provider registry |
| AI Primary | GROQ (`@ai-sdk/groq`) | Latest | Fastest inference, vision via Llama-4-Scout |
| AI Fallback | Google AI Studio / Gemini (`@ai-sdk/google`) | Latest | Only fallback provider, used only when the project opted into Extended mode; vision-capable; code maps every model key to `gemini-2.0-flash`. Decision 2026-11-08: Cerebras is dropped and will not be used. |
| Schema Validation | Zod | Latest | All AI outputs validated, shared between API + UI |
| Client State | Zustand | Latest | Generation state (in use); rate-limit queue store exists but is not yet wired up |
| Server State | TanStack React Query | Latest | Caching, invalidation, optimistic updates. **Implementation status: NOT installed** (absent from `package.json`, no usage in `src/`); data is fetched with plain `fetch`/Supabase client calls. |
| Image Compression | browser-image-compression | Latest | Client-side WebP compression |
| Image Cache | idb-keyval | Latest | IndexedDB binary blob storage |
| Animations | Framer Motion | Latest | Skeleton→content transitions, dirty state pulse. *Installed, currently unused in `src/` (animations are CSS in `animations.css`).* |
| Icons | Lucide React | Latest | Icon set (a local `components/ui/Icons.tsx` is also used) |
| Markdown Render | react-markdown | Latest | *Installed, currently unused;* chat uses the in-repo `components/sidekick/SimpleMarkdown.tsx` |
| Fonts | Inter + JetBrains Mono + Instrument Serif | Google Fonts | UI text + code/serif headings |

### Phase 2+ Additions
| Library | Phase | Purpose | Status (checked against `package.json` + `Grep src/`) |
|---|---|---|---|
| `wcag-contrast-utils` | 2 | Deterministic WCAG contrast ratios | Installed, **unused** |
| `extract-colors` | 2 | Dominant color extraction from screenshots | Installed; imported only by `lib/utils/screen-metrics.ts`, which no other file imports (the `screenMetricsSummary` field accepted by `/api/generate/ux-audit` is never sent by the client) |
| `json2csv` | 2 | CSV export | Installed, **unused** (verified 2026-11-08: referenced only in `package.json`, zero imports in src/scripts/config). CSV is the hand-written `toCsv` in `src/lib/services/export.service.ts`. Decision pending: wire in or remove. |
| `cmdk` | 2 | Command palette (`⌘K`) | **Not installed**; Topbar has a search-trigger stub only |
| `pdfjs-dist` | 3 | PDF text extraction | Installed, used in `lib/services/document.service.ts` |
| `mammoth` | 3 | DOCX text extraction | Installed, used in `document.service.ts` |
| `tesseract.js` | 3 | Scanned PDF OCR (lazy-loaded WASM, ~2MB) | Installed, used in `document.service.ts` |
| `@faker-js/faker` | 4 | Synthetic test data | Installed, **unused** (verified 2026-11-08: referenced only in `package.json`, zero imports in src/scripts/config; test-data generation is model-only via `/api/generate/test-data`). Decision pending: wire in or remove. |
| `vitest` | dev tooling | Unit tests (`npm test`) | Approved and installed 2026-11-08 (v3; v5 conflicts with `@types/node` 20); `test` script and `vitest.config.ts` present. First tests: `src/lib/services/launch-readiness.service.test.ts` (pure scoring function). Other modules have no tests. |
| `recharts` | 2 in practice (docs said 4) | UX score history chart | Installed, used in `dashboard/[projectId]/ux-audit/UXAuditClient.tsx` |
| `date-fns` | 4 | Date utilities | **Not installed** |

---

## Project Directory Structure

> Verified against the filesystem. Items marked **(planned, not present)** are in the original design but have no file in the repo.

```
src/
├── middleware.ts                       # Supabase session refresh; guards /dashboard/*; redirects signed-in users away from /login, /signup
├── app/
│   ├── api/                            # Route Handlers (convention: THIN; several currently exceed it, see Known deviations)
│   │   ├── generate/
│   │   │   ├── test-cases/route.ts     # SSE
│   │   │   ├── ux-audit/route.ts       # SSE
│   │   │   ├── persona-friction/route.ts  # SSE
│   │   │   ├── i18n-audit/route.ts     # SSE
│   │   │   ├── bug-report/route.ts     # JSON (not SSE)
│   │   │   ├── gap-analysis/route.ts   # multipart in, JSON out
│   │   │   ├── semantic-link/route.ts  # multipart in, JSON out
│   │   │   ├── test-data/route.ts      # JSON
│   │   │   ├── launch-readiness/route.ts # JSON, computed — no AI call
│   │   │   ├── estimate/route.ts       # token-budget estimate, JSON
│   │   │   └── chat/route.ts           # Sidekick streaming (SSE delta events)
│   │   ├── chat/[projectId]/route.ts   # GET/POST/DELETE Sidekick session persistence
│   │   ├── artifacts/
│   │   │   ├── stale/route.ts          # prompt-version staleness check
│   │   │   └── ux-history/[projectId]/route.ts  # UX score history
│   │   ├── assets/
│   │   │   ├── upload/route.ts         # Upload + Shadow Scout via after()
│   │   │   ├── signed-url/route.ts
│   │   │   └── [assetId]/route.ts      # PATCH label
│   │   └── projects/[projectId]/settings/route.ts  # PATCH settings
│   │   # (no /api/projects CRUD route and no /api/export route — see SCHEMA.md)
│   ├── (auth)/                         # Route group: adds NO URL segment
│   │   ├── layout.tsx
│   │   ├── login/page.tsx              # URL /login
│   │   ├── signup/page.tsx             # URL /signup
│   │   └── callback/route.ts           # URL /callback  (NOT /auth/callback) — OAuth/code exchange
│   ├── dashboard/                      # Protected pages; each feature = page.tsx (server) + XClient.tsx (client)
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Project listing
│   │   ├── ProjectListClient.tsx
│   │   └── [projectId]/
│   │       ├── layout.tsx              # passthrough
│   │       ├── page.tsx + OverviewClient.tsx
│   │       ├── test-cases/       page.tsx + TestCasesClient.tsx
│   │       ├── ux-audit/         page.tsx + UXAuditClient.tsx
│   │       ├── bug-reports/      page.tsx + BugReportsClient.tsx
│   │       ├── gap-analysis/     page.tsx + GapAnalysisClient.tsx
│   │       ├── semantic-link/    page.tsx + SemanticLinkClient.tsx
│   │       ├── test-data/        page.tsx + TestDataClient.tsx
│   │       ├── persona-friction/ page.tsx + PersonaFrictionClient.tsx
│   │       ├── i18n-audit/       page.tsx + I18nAuditClient.tsx
│   │       ├── launch-readiness/ page.tsx + LaunchReadinessClient.tsx
│   │       ├── export/           page.tsx + ExportClient.tsx
│   │       └── sidekick/         page.tsx   (renders components/sidekick/SidekickChat)
│   ├── about/page.tsx                  # Marketing
│   ├── pricing/page.tsx                # Marketing
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Landing page
│   └── globals.css                     # Imports app.css, marketing.css, animations.css; font @import
├── lib/
│   ├── ai/                             # ★ AI Brain (all AI logic lives here)
│   │   ├── providers.ts                # MODEL_REGISTRY, FEATURE_MODEL_MAP, FALLBACK_CHAINS (unused), Groq + Google factories (Cerebras dropped)
│   │   ├── generate-with-fallback.ts   # generateObject: Groq -> Google on 429 (only if project opted in)
│   │   ├── stream-with-fallback.ts     # streamObject: same, via first-chunk probe
│   │   ├── weaver.service.ts           # Scout / Generator / Judge orchestration + per-feature entry points
│   │   ├── context-budget.ts           # Token budget, history compression, estimateTokens()
│   │   ├── prompt-version.ts           # PROMPT_VERSION, MIN_FRESH_VERSION, isStale()
│   │   └── prompts/                    # scout, generator, judge, ux-auditor, bug-report, gap-analysis,
│   │                                   # semantic-link, persona-friction, i18n-audit, test-data (.ts)
│   ├── supabase/                       # client.ts, server.ts, admin.ts, types.ts (DB row types)
│   ├── schemas/                        # Zod schemas (shared between API + UI)
│   │   ├── test-case.ts · ux-review.ts · bug-report.ts · gap-analysis.ts · semantic-link.ts
│   │   └── persona-friction.ts · i18n-audit.ts · screen-element-map.ts · test-data.ts · launch-readiness.ts
│   ├── services/                       # Non-AI business logic
│   │   ├── project.service.ts          # Browser-side CRUD via anon client + RLS
│   │   ├── asset.service.ts            # Client upload pipeline, hash, IndexedDB cache
│   │   ├── document.service.ts         # PDF/DOCX/TXT text extraction (pdfjs-dist, mammoth, tesseract.js)
│   │   └── export.service.ts           # Format conversion
│   ├── stores/                         # Zustand stores (NOT top-level src/stores/)
│   │   ├── generation.store.ts         # Test-case generation / streaming state
│   │   └── rate-limit.store.ts         # Queue/cooldown state — defined, currently unused
│   ├── hooks/                          # Custom React hooks (NOT top-level src/hooks/)
│   │   ├── useStreamTestCases.ts · useStreamUXAudit.ts · useStreamPersonaFriction.ts · useStreamI18nAudit.ts
│   │   └── useStaleArtifact.ts · useTokenEstimate.ts
│   └── utils/
│       ├── hash.ts                     # SHA-256 + perceptual hash
│       ├── compression.ts              # browser-image-compression wrapper
│       └── screen-metrics.ts           # Contrast/color extraction (currently not imported anywhere)
├── hooks/ , stores/                    # EMPTY stray directories (unused; safe to delete)
├── components/
│   ├── ui/                             # Design system primitives
│   │   └── Button · Card · Badge · Chip · Skeleton · Modal · Input · Tabs · Toggle · Icons · TweaksPanel (.tsx)
│   ├── layout/                         # AppShell.tsx · Sidebar.tsx · Topbar.tsx
│   │                                   #   (provider badge is inline in Topbar; search is a stub)
│   ├── project/                        # AssetUploader.tsx · ProjectForm.tsx · ScreenThumbnail.tsx
│   ├── sidekick/                       # SidekickChat.tsx · SimpleMarkdown.tsx
│   ├── test-cases/                     # TestCaseList.tsx · TestCaseRow.tsx · CoverageGapAnalysis.tsx
│   ├── marketing/                      # MarketingNav.tsx · MarketingFooter.tsx · CountUp.tsx · useScrollReveal.ts
│   ├── features/ , generation/ , shared/   # EMPTY directories
│   │   # (planned, not present): layout/CommandPalette.tsx, layout/FeatureTabs.tsx,
│   │   #   project/ProjectCard.tsx (a local ProjectCard function lives in dashboard/ProjectListClient.tsx),
│   │   #   project/OverviewPage.tsx (replaced by dashboard/[projectId]/OverviewClient.tsx),
│   │   #   generation/TestCaseCard.tsx, generation/UXReviewPanel.tsx,
│   │   #   generation/BugReportCard.tsx (a local BugReportCard lives in bug-reports/BugReportsClient.tsx),
│   │   #   generation/StreamingOverlay.tsx, shared/ProviderBadge.tsx, shared/DirtyStatePulse.tsx
│   │   #   (UX review / persona / i18n UIs are inline in their dashboard XClient.tsx files)
└── styles/
    ├── app.css                         # App shell tokens (sidebar, cards, badges)
    ├── marketing.css                   # Landing, pricing, about pages
    └── animations.css                  # Keyframes for pulse, fade, skeleton shimmer
```

### Convention Rules
1. **Route handlers are THIN** — max ~25 lines (validate → call service → respond). *Target only; see Known deviations.*
2. **All AI logic in `lib/ai/`** — never import AI SDK in components or route handlers directly. *(Route `generate/chat` currently imports `streamText` from `ai` directly.)*
3. **All Zod schemas in `lib/schemas/`** — shared between server validation and client type inference
4. **All Supabase clients in `lib/supabase/`** — never call `createBrowserClient` outside these files. *(API routes also construct `createServerClient` inline for auth.)*
5. **Zustand stores in `lib/stores/`** — never use `useState` for cross-component state
6. **`'use client'` only where necessary** — Server Components by default

---

## Data Flow: CQRS-Inspired Hybrid Manifest

```
                    ┌─────────────────────────────────┐
                    │         Browser (React)          │
                    │                                  │
                    │  Zustand ←──── streamObject ─────┤──── Next.js Route Handler
                    │    │                             │         │
                    │    ▼                             │         ▼
                    │  Optimistic UI                   │    lib/ai/weaver.service.ts
                    │  (skeleton → content → verified) │         │
                    └────────┬────────────────────────┘         │
                             │                                   │
                    ┌────────▼────────────────────────────────────▼───┐
                    │                 Supabase                        │
                    │                                                 │
                    │  COMMAND SIDE (Truth):                          │
                    │  ┌─────────────────────────┐                   │
                    │  │  generated_artifacts     │ ← Each AI run    │
                    │  │  (individual rows)       │   = new row      │
                    │  │  Full history, rollback  │                   │
                    │  └─────────────────────────┘                   │
                    │           │  Postgres Trigger                   │
                    │           ▼                                     │
                    │  QUERY SIDE (Read Cache):                      │
                    │  ┌─────────────────────────┐                   │
                    │  │  projects.manifest_snapshot │ ← Auto-synced │
                    │  │  (JSONB read cache)     │   latest state    │
                    │  └─────────────────────────┘                   │
                    │                                                 │
                    │  STORAGE:                                      │
                    │  ┌─────────────────────────┐                   │
                    │  │  project-assets/         │                   │
                    │  │  {user}/{project}/       │                   │
                    │  │    {sha256}.webp         │                   │
                    │  │  (no docs stored)        │                   │
                    │  └─────────────────────────┘                   │
                    └────────────────────────────────────────────────┘
```

---

## AI Pipeline: Scout → Generator → Judge

```
┌──────────────────────────────────────────────────────────────────┐
│  lib/ai/weaver.service.ts                                        │
│                                                                  │
│  Stage 1: SCOUT (Vision)                                        │
│  ┌────────────────────────────────────────────────┐              │
│  │ Model: llama-4-scout-17b (GROQ) or gemini-flash (Google)    │
│  │ Input: Individual screenshot                                 │
│  │ Output: ScreenElementMap (JSON)                              │
│  │ Method: generateObject (NOT streaming — needs full map)      │
│  │ Runs: Once per screenshot, cached in generated_artifacts     │
│  └─────────────────────────┬──────────────────────┘              │
│                             │                                     │
│  Stage 2: GENERATOR (Reasoning)                                 │
│  ┌────────────────────────────────────────────────┐              │
│  │ Model: llama-3.3-70b (GROQ) or gemini-flash (Google)       │
│  │ Input: Project context + ScreenElementMaps + user request   │
│  │ Output: Structured artifact (test cases, UX review, etc.)   │
│  │ Method: streamObject (streaming — user sees cards appear)    │
│  │ Context: Built by context-budget.ts (max ~14K tokens input)  │
│  └─────────────────────────┬──────────────────────┘              │
│                             │                                     │
│  Stage 3: JUDGE (Verification)                                  │
│  ┌────────────────────────────────────────────────┐              │
│  │ Model: llama-3.1-8b (GROQ) or gemini-flash (Google)        │
│  │ Input: Complete generated artifact + ScreenElementMaps      │
│  │ Output: Same artifact with verified booleans set            │
│  │ Method: generateObject (NOT streaming — needs full input)    │
│  │ Purpose: Cross-reference element labels against vision maps │
│  └────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

> **Implementation status:** Scout runs in the background after upload (`after()` in `/api/assets/upload` → `runScout`), one `vision_map` artifact per screenshot. **Judge (`runJudge`) is only wired into `/api/generate/test-cases`.** UX audit, persona friction and i18n audit do not call a Judge (their artifacts are saved with `is_verified: false`), even though `FEATURE_MODEL_MAP` lists a judge model for them. The test-case artifact's `is_verified` is `true` only when the Judge succeeded (`false` if it failed and raw generator output was saved); the Judge honors `extended_providers_enabled` (no Google fallback in Private mode).

### Model Registry
```typescript
// lib/ai/providers.ts — MODEL_REGISTRY
const MODEL_REGISTRY = {
  vision_scout:     'meta-llama/llama-4-scout-17b-16e-instruct',
  reasoning_large:  'llama-3.3-70b-versatile',
  ux_narrative:     'meta-llama/llama-4-maverick-17b-128e-instruct',
  long_context:     'mixtral-8x7b-32768',
  fast_format:      'llama-3.1-8b-instant',
  quick_labels:     'gemma2-9b-it',
} as const;
```

> **Caution — UNVERIFIED model IDs:** these Groq model IDs were copied from `src/lib/ai/providers.ts` and were **not** re-checked against Groq's current model list in this pass. Some of them (e.g. `mixtral-8x7b-32768`, `gemma2-9b-it`, the Llama 4 preview IDs) may have been renamed or retired by Groq; re-verify each against Groq's published models page before relying on them. A wrong ID fails at request time, not at build time. `quick_labels` is not referenced by `FEATURE_MODEL_MAP`.

**Google AI Studio mapping:** when the Google fallback is used, `getModel(key, true)` maps *every* model key to `gemini-2.0-flash` (not `gemini-2.5-flash`).

### Feature → Model Mapping
| Feature | Stage 1 (Scout) | Stage 2 (Generator) | Stage 3 (Judge) |
|---|---|---|---|
| Test Case Generator | vision_scout | reasoning_large | fast_format |
| UX/UI Auditor | vision_scout | ux_narrative | fast_format |
| Bug Report Formatter | — (optional) | fast_format | — |
| Gap Finder | — | long_context | — |
| Semantic Link | vision_scout | reasoning_large | — |
| Test Data Generator | — | fast_format | — |
| Sidekick Chat | — | reasoning_large | — |
| Persona Friction | vision_scout | reasoning_large | fast_format |
| i18n Audit | vision_scout | reasoning_large | fast_format |
| Launch Readiness | — | **no AI call** (pure computation from stored artifacts) | — |

The rows above (except Launch Readiness, which is not in the map) mirror `FEATURE_MODEL_MAP` in `providers.ts` (keys `test_suite`, `ux_review`, `bug_report`, `gap_analysis`, `semantic_link`, `test_data`, `sidekick`, `persona_friction`, `i18n_audit`). Note: "Scout" is run per uploaded screenshot, not per feature, and only `test-cases` actually invokes the Judge stage (see Implementation status above). The `/api/generate/chat` route calls `getModel('reasoning_large', false)` directly and does not read `FEATURE_MODEL_MAP.sidekick`. `FALLBACK_CHAINS` in `providers.ts` is exported but not referenced anywhere.

---

## Multi-Provider Fallback

```
Request → GROQ (primary, ~200ms latency)
            │
            ├─ 200 OK → return result, badge: "✦ Powered by GROQ"
            │
            └─ 429 Rate Limited
                  │
                  └─ Project opted into Extended mode?
                        │
                        ├─ No → throw original error (GROQ only)
                        └─ Yes → Google AI Studio / Gemini (gemini-2.0-flash in code, ~800ms)
                                   │
                                   ├─ 200 OK → return, badge: "✦ Powered by Google AI"
                                   └─ Fail → error (no retry queue wired)
```

> Decision 2026-11-08: Cerebras is dropped. The chain is GROQ (primary) → Google AI Studio / Gemini (fallback, Extended mode only).

> **Implementation status (what the code actually does):** In `generate-with-fallback.ts` / `stream-with-fallback.ts` there is a single fallback hop, **GROQ → Google AI (`gemini-2.0-flash`)**, taken only when (a) the error message looks like a rate limit (non-stream `generate-with-fallback.ts` matches `429`, "rate limit" or "too many requests"; the stream variant's `isRateLimitError` in `stream-with-fallback.ts` matches only `429`, "rate limit" or "rate_limit") **and** (b) the project has `extended_providers_enabled = true`. Otherwise the original error is thrown. There is **no Cerebras provider** (dropped by decision 2026-11-08; Gemini is the only fallback), **no vision-vs-text split**, **no retry queue** (the Zustand `rate-limit.store.ts` is not wired in), and the streaming variant only detects a 429 via a first-chunk probe when fallback is allowed. Sidekick chat (`/api/generate/chat`) has no fallback at all.

### Provider Privacy Rules
- **GROQ**: Does NOT use free-tier data for training ✅
- **Google AI Studio / Gemini**: Free-tier data MAY be used for training ⚠️
- **Default**: GROQ only (privacy-first)
- **Extended**: Requires explicit user opt-in per project

---

## Image Pipeline: 4-Layer Dual-Hash

```
Layer 1: CAPTURE + EXACT HASH
  crypto.subtle.digest('SHA-256', arrayBuffer) → exact_hash
  → Exists in project_assets? → Skip (free)

Layer 2: PERCEPTUAL SIMILARITY CHECK
  Canvas 8×8 downscale → grayscale luminance → 64-bit pHash
  → Hamming distance < 10? → "Similar image detected. Replace?"

Layer 3: CACHE (IndexedDB via idb-keyval)
  Key: tf:asset:{exact_hash}   (code: `IDB_PREFIX + sha256` in asset.service.ts; not project-scoped)
  Survives refresh. Cleared on save or eviction.

Layer 4: PROMOTE (to Supabase Storage)
  On save / tab switch / generation trigger
  → Upload compressed WebP → Insert project_assets row → Clear IDB
```

### Compression Config
```typescript
{ maxSizeMB: 0.15, maxWidthOrHeight: 1024, useWebWorker: true, fileType: 'image/webp', initialQuality: 0.75 }
```

---

## Context Budget: Semantic Truncation

Every AI call follows a strict token budget:

| Slot | Budget | Content |
|---|---|---|
| System prompt | 2,000 tokens | Role instructions, output format |
| Current screen maps | 5,000 tokens | Latest ScreenElementMaps (verbatim) |
| Active artifact | 4,000 tokens | What we're generating against |
| Historical summary | 2,000 tokens | Compressed older artifacts (via 8B) |
| User message | 1,000 tokens | Query or generation request |
| **Total input** | **~14,000 tokens** | |
| Remaining for output | ~114,000 tokens | (128K context window) |

### Rule: Summarize, don't truncate
- Use `llama-3.1-8b-instant` to compress older artifacts into bullet-point summaries
- Never send raw `manifest_snapshot` to AI — it's for UI reads only
- Current artifact always gets full fidelity (verbatim)
- Log `token_count` on every artifact for budget tracking

> **Implementation status:** history is compressed via the 8B model only when the raw older-artifact text exceeds 2K tokens (and falls back to a hard character cut if that call fails). The screen-map (5K) and active-artifact (4K) slots are **hard-truncated** by character count when over budget, not summarized. No route currently writes `token_count` on insert (the column stays NULL). The `estimatedTokens` in the SSE `meta` event comes from `buildFullContext` (`ctx.estimatedTokens`) in `weaver.service.ts`; `/api/generate/estimate` exposes the same estimate pre-flight for `test_suite` / `ux_review` only.

---

## Streaming-First Convention

| Method | When to Use |
|---|---|
| `streamObject` | Streamed user-facing generation: test cases, UX audit, persona friction, i18n audit (SSE) |
| `generateObject` | Judge, Scout, and the non-streaming features: bug report, gap analysis, semantic link, test data |
| `streamText` | Sidekick chat only (`/api/generate/chat`, SSE `delta` events) |
| *(no model)* | Launch Readiness — computed from stored artifacts |

```
User clicks "Generate" →
  ┌─ UI: Skeleton cards appear immediately
  ├─ Server: streamObject streams partial objects
  │   → Zustand (test cases) / hook state (others) merges each partial → cards fade in (CSS animation)
  ├─ Server: generateObject (Judge) verifies complete output
  │   → UI: green ✓ badges appear on verified cards
  └─ Artifact saved to generated_artifacts
```

### Partial Stream Recovery
On mid-stream failure:
- Status → `'partial'`
- Banner: "Generation interrupted — 5 of ~12 test cases generated."
- Buttons: **[Resume Generation]** | **[Keep Partial Results]**

---

## Rate Limit Queue (Zustand)

> **Implementation status:** the store exists at `src/lib/stores/rate-limit.store.ts` but with a simpler shape than originally designed, and **nothing imports it yet**. Real shape (see SCHEMA.md → Zustand Store Interfaces): `{ status, queue: QueuedJob[], retryAfter, totalQueued, totalRan }` + `enqueue/dequeue/setStatus/setRetryAfter/clearRetry/reset`. The per-model `queues/cooldowns/tokenBudgets/activeProvider` design below is **not implemented**.

```typescript
// ORIGINAL DESIGN (not implemented)
interface ModelQueueState {
  queues: Record<string, PendingRequest[]>;
  cooldowns: Record<string, number>;
  tokenBudgets: Record<string, { used: number; limit: number; resetsAt: number }>;
  activeProvider: Record<string, string>;
}
```

### Priority Order
1. User-triggered generation (highest)
2. Judge verification
3. Shadow Scout (background, Phase 2)
4. Manifest updates (lowest)

---

## Auth Architecture

### Email/Password (Phase 1)
- `@supabase/ssr` for cookie-based sessions
- `createBrowserClient` → client components
- `createServerClient` → server components + route handlers
- Middleware (`src/middleware.ts`) protects `/dashboard/*` only (unauthenticated → `/login?redirect=<path>`); signed-in users hitting `/login` or `/signup` are redirected to `/dashboard`. There is no `/projects/*` route in the app. API routes do their own `auth.getUser()` check.
- Login honors a sanitized `?redirect=` (must start with `/` and not `//`, default `/dashboard`).
- Signup passes `options.data.display_name` only; it does **not** set `emailRedirectTo`, so email-confirmation links use the Supabase project's configured Site URL.

### Google OAuth (Phase 5, prepared)
- Callback route is `src/app/(auth)/callback/route.ts`. `(auth)` is a route group and adds **no** URL segment, so the live URL is **`/callback`**, not `/auth/callback`. The Supabase Dashboard redirect allow-list must therefore contain `{NEXT_PUBLIC_APP_URL}/callback`.
- Handler: exchanges `?code=` via `exchangeCodeForSession`, redirects to `?next=` (open-redirect-sanitized, default `/dashboard`), else to `/login?error=oauth_callback_failed`.
- **Implementation status:** no `signInWithOAuth` call or Google button exists in the code yet, so nothing currently points to `/callback`. Just needs UI + Supabase Dashboard configuration to activate.

---

## Visual Identity: Premium Glassmorphic

> **Source of truth for tokens:** `src/styles/app.css` (app shell) and `src/styles/marketing.css` (public pages).
> Agents implementing UI **must** use these exact variable names.

### Background Scale
| Token | Value | Usage |
|---|---|---|
| `--bg-0` | `#07070A` | Page / root background |
| `--bg-1` | `#0E0E12` | Sidebar, secondary surfaces |
| `--bg-2` | `#15151B` | Cards, panels |
| `--bg-3` | `#1C1C24` | Elevated cards, modals, inputs |

### Text Scale
| Token | Value | Usage |
|---|---|---|
| `--text-0` | `#F2F2F5` | Primary headings / high-emphasis |
| `--text-1` | `#A1A1AA` | Secondary labels, meta |
| `--text-2` | `#65656E` | Placeholder, de-emphasised |

### Accent Scale
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#8B5CF6` | Electric Violet — primary CTAs, active nav |
| `--accent-2` | `#A78BFA` | Violet-400 — icon tints, hover text |
| `--accent-3` | `#6366F1` | Indigo — gradient endpoints |
| `--accent-glow` | `rgba(139,92,246,0.18)` | Hover / focus glow bg |
| `--accent-strong` | `rgba(139,92,246,0.45)` | Active border, user chat bubble border |

### Glass & Surface
| Token | Value | Usage |
|---|---|---|
| `--glass-bg` | `rgba(20,20,26,0.68)` | Sidebar, topbar glass surfaces |
| `--glass-blur` | `18px` | backdrop-filter blur value |
| `--border` | `rgba(255,255,255,0.07)` | Default card/input borders |
| `--border-strong` | `rgba(255,255,255,0.12)` | Hover / focused borders |

### Semantic / Status
| Token | Value | Usage |
|---|---|---|
| `--success` | `#34D399` | Verified, success states |
| `--warning` | `#FBBF24` | Dirty state, warnings |
| `--error` | `#F87171` | Critical bugs, errors |
| `--info` | `#60A5FA` | Info badges |

### Radius Scale
| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Chips, badges |
| `--radius-md` | `12px` | Cards, inputs |
| `--radius-lg` | `16px` | Modals, panels |
| `--radius-xl` | `24px` | Large cards, hero sections |

### Typography
- **Inter** (400, 500, 600, 700) — UI text
- **JetBrains Mono** (400, 500) — code, model names, IDs
- **Instrument Serif** (400 italic) — marketing serif accents (`.serif` class in marketing pages)

### CSS File Strategy
- `src/styles/app.css` — all unprefixed `--bg-*`/`--text-*`/`--accent-*` tokens (class prefix is `.tf-*`), sidebar grid, cards, badges, inputs, animations
- `src/styles/marketing.css` — marketing-only tokens (`.hero`, `.feat-card`, `.pipeline-*`, etc.)
- `src/app/globals.css` — imports `app.css`, `marketing.css` and `animations.css`, sets `body` background and font defaults

### Theme Variants (via `data-theme` on `<html>`)
| Value | Description |
|---|---|
| _(default)_ | Deep Obsidian — primary dark theme |
| `lighter-glass` | Lighter purple-tinted backgrounds |
| `mono-violet` | Pure monochrome with violet accents. Sets `--accent: #8B5CF6`, `--accent-2: #A78BFA`, `--accent-glow: rgba(139,92,246,0.15)`, `--accent-strong: rgba(139,92,246,0.40)` (`app.css`, verified by reading the CSS 2026-11-08). Resolved: fixed from the previously retired `#7C3AED`; matches the locked accent `#8B5CF6`. |

Theme switcher lives in `src/components/ui/TweaksPanel.tsx`. Preference stored in `localStorage`.

**Effects:** `backdrop-filter: blur(var(--glass-blur))`, violet glow pulse on dirty state, streaming card fade-in

---

## Environment Variables

```env
# .env.local (NEVER commit)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=                # Primary — required
GOOGLE_AI_API_KEY=           # Fallback (Gemini) — free from ai.google.dev; used only for Extended-mode projects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Known deviations from this document

Verified against the repo source. Items 11–13 and parts of 4–5 were fixed in code on 2026-11-08 (type-checked with `tsc`, no automated tests for those fixes; vitest was approved 2026-11-08 and covers only the launch-readiness scoring function so far); migration 003 for items 11–12 is written but **not yet applied to any live DB** and its SQL was not run. The rest are not fixed.

1. **(Resolved 2026-11-08)** Cerebras is dropped by human decision. The fallback is Gemini-only: GROQ → Google AI (`gemini-2.0-flash`), and only for projects with `extended_providers_enabled`.
2. **TanStack React Query is not installed**; data fetching is plain `fetch` / Supabase client calls.
3. **Next.js version (Resolved 2026-11-08):** Next.js 16.2.6 (`package.json` `^16.2.6`) is the target version. Observed on `next build` 16.2.6: `eslint-config-next` is pinned at 15.3.2 (mismatched with Next 16); the `middleware` file convention is deprecated in favour of `proxy` (build warns; `src/middleware.ts` still works); and the `lint` script (`next lint`) no longer exists in Next 16 and is broken.
4. **Judge runs only for test cases.** UX audit, persona friction and i18n audit have no Judge stage; the test-case artifact's `is_verified` now reflects whether the Judge succeeded (fixed 2026-11-08), and the Judge no longer ignores Private mode (it uses `extended_providers_enabled`).
5. **Route handlers are not thin** (e.g. `test-cases`, `ux-audit`, `persona-friction`, `i18n-audit`, `assets/upload` are ~150–205 lines and embed auth, DB writes and SSE plumbing), and `generate/chat` imports `streamText` from `ai` directly, which conflicts with "all AI logic in `src/lib/ai/`". `generate/launch-readiness` is now thin (logic moved to `src/lib/services/launch-readiness.service.ts`). Client components also import `DeepPartial` as a type-only import from `'ai'` (`UXAuditClient`, `PersonaFrictionClient`, `useStream*` hooks).
6. **OAuth callback URL is `/callback`**, not `/auth/callback`; no OAuth sign-in UI exists yet.
7. **Storage bucket is `project-assets`** with a flat `{user_id}/{project_id}/{sha256}.webp` path; storage RLS policies are commented out in the migration and must be applied manually.
8. **Rate-limit Zustand store is defined but unused**; its shape differs from the original design.
9. **Installed but unused packages:** `framer-motion`, `react-markdown`, `wcag-contrast-utils`, `json2csv`, `@faker-js/faker`; `extract-colors` is used only by an unimported module. **Not installed:** `cmdk`, `date-fns`, `@tanstack/react-query`.
10. **Planned components that do not exist:** `CommandPalette`, `FeatureTabs`, `ProviderBadge`, `DirtyStatePulse`, `StreamingOverlay`, and the standalone `UXReviewPanel` / `BugReportCard` / `TestCaseCard` / `ProjectCard` / `OverviewPage` files (see directory tree). Empty `src/hooks/`, `src/stores/`, `components/features|generation|shared/` directories exist.
11. **`vision_map` latest-flag bug (FIXED in `supabase/migrations/003_fix_vision_map_latest_and_chat_unique.sql` — apply to the live DB; not yet applied, SQL not run):** the 001 trigger `handle_new_artifact` flipped `is_latest` to FALSE for ALL rows of the same `(project_id, artifact_type)`, so with 2+ analyzed screenshots only the most recently scouted screen's `vision_map` stayed `is_latest` and `getProjectScreenMaps` returned just that one. Migration 003 replaces the function so the `vision_map` flip is scoped per `input_snapshot->>'asset_id'` and backfills `is_latest` on the newest complete `vision_map` per surviving asset. Until 003 is applied the old behavior persists. See SCHEMA.md → Trigger caveat.
12. **`chat_sessions` is defined in both migrations (FIXED in `supabase/migrations/003_fix_vision_map_latest_and_chat_unique.sql` — not yet applied):** `001` has no UNIQUE constraint and `002`'s `CREATE TABLE IF NOT EXISTS` is skipped if `001` ran first, which would break the `onConflict: 'project_id,user_id'` upsert in `/api/chat/[projectId]`. 003 dedupes rows (keeps newest per `(project_id, user_id)`) and adds `chat_sessions_unique_active` if missing. `/api/chat/[projectId]` also now checks project ownership (404 if not owned). See SCHEMA.md.
13. **Launch Readiness field mismatches (FIXED 2026-11-08):** `src/lib/services/launch-readiness.service.ts` no longer reads `coverage_score` (test coverage = volume + category breadth + judge-verified ratio) and uses `heuristic_number` / `heuristic_name` for the UX blocking source; it loads all complete `bug_report` artifacts, not just the latest. Results are still not persisted; the "show only after 2 artifact types exist" gate is still not implemented.
14. **`token_count` and `version` columns are never set** by any insert (NULL / 1).
15. **`manifest_snapshot`** carries per-type summaries only (see SCHEMA.md); `screen_count`, `last_generation_at`, `coverage_score`, `issues_count` in `ManifestSnapshot` (TS type) are not written by any migration.
