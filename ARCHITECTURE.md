# Tesifye — System Architecture

> **Purpose:** Single source of truth for system architecture. Any agent reads this file to understand HOW the system works.
> **Related files:** [SCOPE.md](./SCOPE.md) (WHAT it does) · [SCHEMA.md](./SCHEMA.md) (DATA structures) · [PHASES.md](./PHASES.md) (WHEN to build it)

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 15 (App Router) | Full-stack React, serverless |
| Language | TypeScript | 5.x | Type safety everywhere |
| Styling | Vanilla CSS | — | Custom properties, glassmorphic tokens |
| Auth + DB + Storage | Supabase | Latest | Postgres, RLS, Auth, Storage buckets |
| AI SDK | Vercel AI SDK (`ai`) | Latest | `streamObject`, `generateObject`, provider registry |
| AI Primary | GROQ (`@ai-sdk/groq`) | Latest | Fastest inference, vision via Llama-4-Scout |
| AI Fallback 1 | Google AI Studio (`@ai-sdk/google`) | Latest | Vision-capable fallback, Gemini Flash |
| AI Fallback 2 | Cerebras (direct API) | — | Text-only, 1M tokens/day free |
| Schema Validation | Zod | Latest | All AI outputs validated, shared between API + UI |
| Client State | Zustand | Latest | Rate limit queue, generation state, optimistic UI |
| Server State | TanStack React Query | Latest | Caching, invalidation, optimistic updates |
| Image Compression | browser-image-compression | Latest | Client-side WebP compression |
| Image Cache | idb-keyval | Latest | IndexedDB binary blob storage |
| Animations | Framer Motion | Latest | Skeleton→content transitions, dirty state pulse |
| Icons | Lucide React | Latest | Consistent icon set |
| Markdown Render | react-markdown | Latest | AI prose output display |
| Fonts | Inter + JetBrains Mono + Instrument Serif | Google Fonts | UI text + code/serif headings |

### Phase 2+ Additions
| Library | Phase | Purpose |
|---|---|---|
| `wcag-contrast-utils` | 2 | Deterministic WCAG contrast ratios |
| `extract-colors` | 2 | Dominant color extraction from screenshots |
| `json2csv` | 2 | CSV export |
| `cmdk` | 2 | Command palette (`⌘K`) |
| `pdfjs-dist` | 3 | PDF text extraction |
| `mammoth` | 3 | DOCX text extraction |
| `tesseract.js` | 3 | Scanned PDF OCR (lazy-loaded WASM, ~2MB) |
| `@faker-js/faker` | 4 | Synthetic test data |
| `recharts` | 4 | Score trend charts |
| `date-fns` | 4 | Date utilities |

---

## Project Directory Structure

```
src/
├── app/
│   ├── api/                            # Route Handlers (THIN — validate, call service, respond)
│   │   ├── generate/
│   │   │   ├── test-cases/route.ts     # ~20 lines: parse body → call weaver → stream response
│   │   │   ├── ux-audit/route.ts
│   │   │   ├── bug-report/route.ts
│   │   │   ├── gap-analysis/route.ts
│   │   │   ├── semantic-link/route.ts
│   │   │   └── test-data/route.ts
│   │   ├── assets/
│   │   │   └── upload/route.ts         # Upload + Shadow Scout via after()
│   │   ├── projects/
│   │   │   └── route.ts                # CRUD
│   │   └── export/
│   │       └── route.ts
│   ├── (auth)/                         # Auth pages (login, signup, callback)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts           # OAuth callback
│   ├── dashboard/                      # Protected pages
│   │   ├── page.tsx                    # Project listing
│   │   └── [projectId]/
│   │       ├── page.tsx                # Project workspace
│   │       └── layout.tsx              # Feature tab navigation
│   ├── layout.tsx                      # Root layout (fonts, global styles)
│   ├── page.tsx                        # Landing page
│   └── globals.css                     # Design system tokens
├── lib/
│   ├── ai/                             # ★ AI Brain (all AI logic lives here)
│   │   ├── providers.ts                # Provider registry (GROQ + Google + Cerebras)
│   │   ├── generate-with-fallback.ts   # Multi-provider fallback utility
│   │   ├── stream-with-fallback.ts     # Streaming variant of fallback
│   │   ├── weaver.service.ts           # Orchestrates Scout → Generator → Judge
│   │   ├── context-budget.ts           # Semantic truncation + token estimation
│   │   └── prompts/                    # System prompt templates
│   │       ├── scout.ts
│   │       ├── generator.ts
│   │       └── judge.ts
│   ├── supabase/                       # Supabase client factories
│   │   ├── client.ts                   # Browser client (createBrowserClient)
│   │   ├── server.ts                   # Server client (createServerClient + cookies)
│   │   └── admin.ts                    # Service role client (bypasses RLS)
│   ├── schemas/                        # Zod schemas (shared between API + UI)
│   │   ├── test-case.ts
│   │   ├── ux-review.ts
│   │   ├── bug-report.ts
│   │   ├── gap-analysis.ts
│   │   ├── semantic-link.ts
│   │   ├── persona-friction.ts
│   │   ├── i18n-audit.ts
│   │   └── screen-element-map.ts
│   ├── services/                       # Non-AI business logic
│   │   ├── project.service.ts          # CRUD, manifest updates
│   │   ├── asset.service.ts            # Upload, hash, compress, promote
│   │   └── export.service.ts           # Format conversion
│   └── utils/                          # Pure utilities
│       ├── hash.ts                     # SHA-256 + perceptual hash
│       ├── compression.ts              # browser-image-compression wrapper
│       ├── token-estimator.ts          # Rough token count from string
│       └── screen-metrics.ts           # Canvas-based contrast/color extraction
├── stores/                             # Zustand stores
│   ├── rate-limit.store.ts             # Per-model queue, cooldowns, token budgets
│   └── generation.store.ts             # Optimistic UI + partial stream state
├── components/                         # React components
│   ├── ui/                             # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Chip.tsx                    # Filter chips / tags (tf-chip)
│   │   ├── Skeleton.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Tabs.tsx                    # Segmented control tabs (tf-tabs)
│   │   └── Toggle.tsx                  # On/off toggle switch (export bundle picker)
│   ├── layout/                         # Structural components
│   │   ├── AppShell.tsx                # Grid: Sidebar + Topbar + main content
│   │   ├── Sidebar.tsx                 # Nav items, project switcher, user footer
│   │   ├── Topbar.tsx                  # Breadcrumb, search, provider badge
│   │   ├── CommandPalette.tsx          # ⌘K global search (Phase 2)
│   │   └── FeatureTabs.tsx
│   ├── project/                        # Project-specific components
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── AssetUploader.tsx
│   │   ├── ScreenThumbnail.tsx         # Phone / browser frame thumbnail
│   │   └── OverviewPage.tsx            # Stat cards + activity feed + feature grid
│   ├── generation/                     # AI output display
│   │   ├── TestCaseCard.tsx
│   │   ├── UXReviewPanel.tsx
│   │   ├── BugReportCard.tsx
│   │   └── StreamingOverlay.tsx
│   └── shared/                         # Cross-cutting
│       ├── ProviderBadge.tsx           # "✦ Powered by GROQ" — topbar + per-artifact
│       ├── DirtyStatePulse.tsx         # Violet glow for dirty assets
│       └── SimpleMarkdown.tsx          # Inline **bold** / `code` renderer for chat
├── hooks/                              # Custom React hooks
│   ├── useProject.ts
│   ├── useGeneration.ts
│   └── useStreamObject.ts
└── styles/                             # Additional CSS
    ├── app.css                         # App shell tokens (sidebar, cards, badges)
    ├── marketing.css                   # Landing, pricing, about pages
    └── animations.css                  # Keyframes for pulse, fade, skeleton shimmer
```

### Convention Rules
1. **Route handlers are THIN** — max ~25 lines (validate → call service → respond)
2. **All AI logic in `lib/ai/`** — never import AI SDK in components or route handlers directly
3. **All Zod schemas in `lib/schemas/`** — shared between server validation and client type inference
4. **All Supabase clients in `lib/supabase/`** — never call `createBrowserClient` outside these files
5. **Zustand stores in `stores/`** — never use `useState` for cross-component state
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
                    │  │  testifye-assets/        │                   │
                    │  │  {user}/{project}/       │                   │
                    │  │    screenshots/*.webp    │                   │
                    │  │    docs/*.pdf            │                   │
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

---

## Multi-Provider Fallback

```
Request → GROQ (primary, ~200ms latency)
            │
            ├─ 200 OK → return result, badge: "✦ Powered by GROQ"
            │
            └─ 429 Rate Limited
                  │
                  ├─ Vision task? → Google AI Studio (gemini-2.5-flash, ~800ms)
                  │                    │
                  │                    ├─ 200 OK → return, badge: "✦ Powered by Google AI"
                  │                    └─ Fail → queue for retry
                  │
                  └─ Text-only task? → Cerebras (when SDK available)
                                        │
                                        └─ Or Google AI as universal fallback
```

### Provider Privacy Rules
- **GROQ**: Does NOT use free-tier data for training ✅
- **Google AI Studio**: Free-tier data MAY be used for training ⚠️
- **Cerebras**: Does NOT use data for training ✅
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
  Key: {project_id}:{exact_hash}
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

---

## Streaming-First Convention

| Method | When to Use |
|---|---|
| `streamObject` | All user-facing generation (test cases, UX audit, bug report, etc.) |
| `generateObject` | Judge pipeline, Scout pipeline, context compression |

```
User clicks "Generate" →
  ┌─ UI: Skeleton cards appear immediately
  ├─ Server: streamObject streams partial objects
  │   → Zustand merges each partial → cards fade in with framer-motion
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

```typescript
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
- Middleware protects `/dashboard/*`, `/projects/*`

### Google OAuth (Phase 5, prepared)
- Callback route built from day one (`/auth/callback/route.ts`)
- Just needs Supabase Dashboard configuration to activate

---

## Visual Identity: Premium Glassmorphic

> **Source of truth for tokens:** `src/styles/app.css` (app shell) and `src/styles/marketing.css` (public pages).
> Agents implementing UI **must** use these exact variable names.

### Background Scale
| Token | Value | Usage |
|---|---|---|
| `--bg-0` | `#07070A` | Page / root background |
| `--bg-1` | `#0F0F13` | Sidebar, secondary surfaces |
| `--bg-2` | `#141418` | Cards, panels |
| `--bg-3` | `#1C1C22` | Elevated cards, modals, inputs |

### Text Scale
| Token | Value | Usage |
|---|---|---|
| `--text-0` | `#F0F0F4` | Primary headings / high-emphasis |
| `--text-1` | `#9494A8` | Secondary labels, meta |
| `--text-2` | `#5A5A70` | Placeholder, de-emphasised |

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
- **Inter** (400, 600, 700) — UI text
- **JetBrains Mono** (400) — code, model names, IDs
- **Instrument Serif** (400 italic) — marketing serif accents (`.serif` class in marketing pages)

### CSS File Strategy
- `src/styles/app.css` — all `--tf-*` app tokens, sidebar grid, cards, badges, inputs, animations
- `src/styles/marketing.css` — marketing-only tokens (`.hero`, `.feat-card`, `.pipeline-*`, etc.)
- `src/app/globals.css` — imports both, sets `body` background and font defaults

### Theme Variants (via `data-theme` on `<html>`)
| Value | Description |
|---|---|
| _(default)_ | Deep Obsidian — primary dark theme |
| `lighter-glass` | Lighter purple-tinted backgrounds |
| `mono-violet` | Pure monochrome with violet accents |

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
GOOGLE_AI_API_KEY=           # Fallback — free from ai.google.dev
CEREBRAS_API_KEY=            # Fallback — free from cloud.cerebras.ai
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
