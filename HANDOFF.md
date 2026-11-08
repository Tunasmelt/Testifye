# HANDOFF — Testifye

**Date:** 2026-11-08
**Branch:** `docs-and-fixes-2026-11-08` (feature branch; see Repository state — no git remote configured)
**TypeScript:** Last verified 0 errors (`npx tsc --noEmit`) at the 2026-05-16 handoff (Phase 1 only) and after Phase 4 work in the prior session; NOT re-run in the 2026-11-08 docs pass — re-verify before relying on it.

---

## Repository state (checked 2026-11-08 via `git status` / `git log`)

- **Branch:** `master` (only local branch; main branch per tooling is `main`, which does not exist locally).
- **Last commit:** `5be3ec1` — `ctx: session handoff 2026-05-16 — Phase 1 complete` (previous: `c07a137` feat: complete Phase 1 UI). Only 2 commits exist.
- **Working tree:** ~100 entries in `git status --short` (102 at last check: 61 modified, 41 untracked) — the count moves while docs are being edited.
- **Phase 2–4 work is UNCOMMITTED.** Everything listed below for Phases 2, 3 and 4 (new API routes under `src/app/api/{artifacts,chat,projects,generate/*}`, dashboard pages `bug-reports`, `gap-analysis`, `i18n-audit`, `launch-readiness`, `persona-friction`, etc.) exists only in the working tree. The last commit covers Phase 1 only.
- **Branching (update 2026-11-08):** CLAUDE.md says never commit directly to main/master. Work is being committed on a feature branch, `docs-and-fixes-2026-11-08`.
- **Remote:** NO git remote is configured (`git remote -v` printed nothing when checked). Push is pending the user adding a remote.

---

## Phase 1 — COMPLETE ✅

All 21 tasks complete. Key deliverables:

| Task | Status | Notes |
|------|--------|-------|
| 1.1  | ✅ | Project scaffold, tsconfig, next.config |
| 1.2  | ✅ | Design system — app.css, animations.css, marketing.css |
| 1.3  | ✅ | Supabase clients + SQL migrations |
| 1.4  | ✅ | Auth: login/signup/callback/middleware |
| 1.5  | ✅ | Image pipeline: SHA-256 + pHash dedup, compress, IndexedDB, upload |
| 1.6  | ✅ | Project CRUD, AppShell, Sidebar, Topbar, Overview |
| 1.7–1.12 | ✅ | AI pipeline: providers, Scout→Generator→Judge, context-budget |
| 1.13 | ✅ | Streaming test case UI with skeleton→animated cards |
| 1.14 | ✅ | Partial stream recovery: PartialBanner + resume |
| 1.15 | ✅ | Export Engine: 6 formats, download/copy, toggle bundles |
| 1.16 | ✅ | Rate limit queue store |
| 1.17–1.19 | ✅ | Landing, pricing, about pages |
| 1.20 | ✅ | Sidekick Chat v0 (session-only SSE, SimpleMarkdown) |
| 1.21 | ✅ | TweaksPanel theme switcher |

> Note: the task numbers/names in this table are a summary and do NOT match PHASES.md numbering 1:1 (e.g. PHASES.md 1.7 = Provider Registry, 1.18 = Manifest Trigger). Treat PHASES.md as canonical.

---

## Phase 2 — COMPLETE with gaps (see Known issues; 2.2 and 2.4 are Partial)

| Task | Status | Notes |
|------|--------|-------|
| 2.1 UX/UI Auditor | ✅ | Streaming, score history chart, stale nudge, single-screen note |
| 2.2 Pre-AI Screen Metrics | ⚠️ Partial | extract-colors + contrast + density util exists in screen-metrics.ts, but `UXAuditClient` calls `run({ projectId, auditFocus })` and never sends `screenMetricsSummary` (route/service accept it), so it is not wired end-to-end |
| 2.3 Screenshot Labeling | ✅ | Inline label edit on ScreenThumbnail |
| 2.4 Dirty State Detection | ⚠️ Partial | `is_dirty` is set (upload; description/scope change via settings route) but never reset to false; the Overview "Re-analyze" button only links to the test-cases page |
| 2.5 Bug Report Formatter | ✅ | Schema, route, BugReportsClient, severity/priority UI |
| 2.6 Role-Based Output | ✅ | Role passed through API → prompt |
| 2.7 Gherkin Export | ✅ | Deterministic Gherkin string builder (`toGherkin` in export.service.ts), download button in TestCasesClient (no model) |
| 2.8 UX Score History | ✅ | recharts line chart from artifact history |
| 2.9 Sidekick Chat Persistence | ✅ | chat_sessions table, DB upsert, clears on demand |
| 2.10 Data Privacy Toggle | ✅ | projects.extended_providers_enabled; toggle lives in OverviewClient.tsx (calls `/api/projects/[projectId]/settings`) — no dedicated settings page |
| 2.11 Shadow Scout | ✅ | after() in upload route, vision_map_status tracking |

### Phase 2 edge case fixes applied (prior session):
- `useStreamUXAudit` `receivedDone` flag — abrupt stream close → error state
- `BugReportsClient` CSS hex literals — replaced `var(--error)` with hex to fix alpha appending
- `UXAuditClient` severity + a11y color maps — hex literals
- `bug-report/route.ts` — added `prompt_version: PROMPT_VERSION` (was missing → all reports always stale)
- `stream-with-fallback.ts` — `probeReader.releaseLock()` after probe to prevent stream lock leak
- `UXAuditClient` — `useStaleArtifact` wired, stale nudge banner added
- `ux-auditor.ts` + `weaver.service.ts` — `singleScreenNote` parameter injects limitation text when screenMaps.length === 1
- `generate/chat/route.ts` — enriched Sidekick system prompt with `uxScore` + `coverageSummary` from artifacts

---

## Phase 3 — COMPLETE ✅ (3.5 qualified: text exports + hand-written CSV only)

| Task | Status | Notes |
|------|--------|-------|
| 3.1 Requirement Gap Finder | ✅ | PDF/DOCX/TXT → pdfjs-dist + mammoth, GapAnalysisClient |
| 3.2 Scanned PDF OCR | ✅ | tesseract.js lazy-loaded, single worker, progress in document.service.ts |
| 3.3 Semantic Link Engine | ✅ | Traceability matrix, coverage bar (verified ÷ total), filter by status |
| 3.4 Synthetic Test Data | ✅ | TestDataClient, AbortController 115s, dataset count slider |
| 3.5 Full Export | ✅ | Hand-written `toCsv` in export.service.ts (json2csv installed, unused — verified: referenced only in package.json; decision pending: wire in or remove). Jira/Linear are text formats only, no API integration. |
| 3.6 Prompt Versioning | ✅ | PROMPT_VERSION in prompt-version.ts; useStaleArtifact hook |
| 3.7 Token Budget Estimator | ✅ | useTokenEstimate hook, estimate shown before generation |
| 3.8 Coverage Gap Analysis | ✅ | CoverageGapAnalysis.tsx with scope area bars and AREA_SYNONYMS map |

### Phase 3 edge case fixes applied (prior session):
- `TestCaseList` — `PRIORITY_ORDER` map + priority sort in filtered useMemo (only when complete)
- `GapAnalysisClient` + `SemanticLinkClient` — `truncated` state + warning banner when extractedChars > threshold
- `GapAnalysisClient` + `SemanticLinkClient` — `useStaleArtifact` wired, stale nudge banner added
- `stream-with-fallback.ts` — `probeReader.releaseLock()` (shared fix with Phase 2)

---

## Phase 4 — IN PROGRESS 🚧

| Task | Status | Notes |
|------|--------|-------|
| 4.1 Persona Friction Analysis | ✅ | Streaming, 5 personas, per-persona card + friction items |
| 4.2 i18n / RTL Audit | ✅ | Streaming, locale chip input, findings by category/severity |
| 4.3 Accessibility Deep-Dive | ⬜ | Not started |
| 4.4 Test Suite Versioning | ⬜ | Not started |
| 4.5 Exploratory Testing Ideas | ⬜ | Not started |
| 4.6 Launch Readiness Score | ✅ | Non-AI composite score, blocking issues, dimension bars |
| 4.7 Project Templates | ⬜ | Not started |

### Phase 4 files:
- `src/lib/ai/prompts/persona-friction.ts` — NEW
- `src/lib/ai/prompts/i18n-audit.ts` — NEW
- `src/lib/schemas/launch-readiness.ts` — NEW
- `src/lib/ai/weaver.service.ts` — EDITED: added `streamPersonaFriction` + `streamI18nAudit`
- `src/app/api/generate/persona-friction/route.ts` — NEW (SSE streaming)
- `src/app/api/generate/i18n-audit/route.ts` — NEW (SSE streaming)
- `src/app/api/generate/launch-readiness/route.ts` — NEW (non-AI; thin handler, scoring in `src/lib/services/launch-readiness.service.ts`)
- `src/lib/hooks/useStreamPersonaFriction.ts` — NEW
- `src/lib/hooks/useStreamI18nAudit.ts` — NEW
- `src/app/dashboard/[projectId]/persona-friction/page.tsx` — NEW
- `src/app/dashboard/[projectId]/persona-friction/PersonaFrictionClient.tsx` — NEW
- `src/app/dashboard/[projectId]/i18n-audit/page.tsx` — NEW
- `src/app/dashboard/[projectId]/i18n-audit/I18nAuditClient.tsx` — NEW
- `src/app/dashboard/[projectId]/launch-readiness/page.tsx` — NEW
- `src/app/dashboard/[projectId]/launch-readiness/LaunchReadinessClient.tsx` — NEW
- `src/components/layout/Sidebar.tsx` — EDITED: added `launch-readiness` nav item
- `src/components/ui/Icons.tsx` — EDITED: added `Rocket` + `Shield` icons

---

## Open questions / unresolved decisions

Carried forward from CLAUDE.md "Open decisions" — do not assume, ask the owner:

- [ ] **Pricing tiers and feature gates** — Pricing page exists but limits are not defined.
- [ ] **Team workspaces: Phase 1 vs Phase 5** — PHASES.md currently places teams in Phase 5 (Collaboration & Scale); CLAUDE.md still lists the question as open. Confirm and close it.
- [ ] **Jira/Linear: OAuth flow vs API key input.**

---

## Known issues / follow-ups

### (a) Launch Readiness (`src/lib/services/launch-readiness.service.ts`)
- Scoring/thin-route/bug-aggregation/`coverage_score`/`heuristic ?` items are FIXED (see "Fixed on 2026-11-08" below).
- Still open: "show only after 2 artifact types exist" gating is NOT implemented (no such check in the service, route or `LaunchReadinessClient.tsx`; the rule is not written in SCOPE.md/PHASES.md either — confirm where it was specified). `a11y_blocker` is never emitted. Bugs have no open/closed status, so "open bugs" = all filed bug reports.
- Weights in code: test 30% / UX 30% / gaps 20% / bugs 20%; labels Ready >=80 / Needs Attention >=60 / Not Ready >=40 / Critical Issues.

### (b) AI providers (`src/lib/ai/providers.ts`)
- **Cerebras dropped (decision 2026-11-08):** the provider chain is GROQ (primary) → Google AI Studio / Gemini (fallback, Extended mode only). Code already has only Groq and Google (`getModel(key, useGoogle)`), which matches. Note `FALLBACK_CHAINS` entries are Groq-model-to-Groq-model pairs (unused).
- Gemini model id actually used: `gemini-2.0-flash` for every `ModelKey` (verify it is still available/current).
- Groq model ids in `MODEL_REGISTRY` (`meta-llama/llama-4-scout-17b-16e-instruct`, `llama-3.3-70b-versatile`, `meta-llama/llama-4-maverick-17b-128e-instruct`, `mixtral-8x7b-32768`, `llama-3.1-8b-instant`, `gemma2-9b-it`) are UNVERIFIED against Groq's current model list — re-check before relying on them (not asserted deprecated).

### (c) OAuth callback URL
- Route file is `src/app/(auth)/callback/route.ts` → URL is `/callback` (route groups don't add a segment). ARCHITECTURE.md now documents `/callback`.
- Verified: `src/middleware.ts` guards only `/dashboard*` (redirects signed-out users to `/login`) and redirects signed-in users only from `/login` and `/signup`, so `/callback` is reachable when signed out.
- No `signInWithOAuth` / `redirectTo` / `emailRedirectTo` usage found in `src/` (signup uses `supabase.auth.signUp`), so no code currently points at the callback URL.
- **Remaining external check before Phase 5 (Google OAuth):** add the `/callback` URL to the Supabase redirect allow-list.

### (d) Previously listed gaps (#7–#13) — re-checked 2026-11-08 by grep, all still open

| # | Gap | Priority | Check |
|---|-----|----------|-------|
| 7 | Screenshot drag-drop reordering for UX audit | Medium | No reorder/drag handlers beyond upload dropzones |
| 8 | Bug report screenshot attachment | Medium | No screenshot/attachment code in `bug-reports/` |
| 9 | Bug report component as scope dropdown | Low | `component` is still a free-text input in `BugReportsClient.tsx` |
| 10 | Duplicate generation → "Cached result" badge | Low | No such badge in components/pages |
| 11 | Test case Levenshtein/Jaccard deduplication | Low | No matches in `src/` |
| 12 | All providers exhausted → countdown + cached result | Medium | `rate-limit.store.ts` exists but is imported nowhere else |
| 13 | `@faker-js/faker` not used in test data (SCOPE.md spec) | Low | Verified 2026-11-08: referenced only in `package.json` (zero imports in src/scripts/config). Test-data generation is model-only. Installed, unused — decision pending: wire in or remove |

### (e) Further issues verified in code/migrations (2026-11-08; docs-only pass — fixed items moved to "Fixed on 2026-11-08")
- **Chat route provider/layering:** `src/app/api/generate/chat/route.ts` uses `getModel('reasoning_large', false)` (Groq directly, no fallback chain) and imports `streamText` from `ai` in the route, outside `src/lib/ai/`.
- **Retired accent (RESOLVED 2026-11-08):** `[data-theme="mono-violet"]` in `src/styles/app.css` now uses `--accent: #8B5CF6`, `--accent-2: #A78BFA`, glow `rgba(139,92,246,0.15)`, strong `rgba(139,92,246,0.40)` (verified by reading the CSS). Matches the locked accent.
- **Next version (RESOLVED 2026-11-08):** Next.js 16.2.6 (`package.json` `^16.2.6`) is the target; docs updated.
- **To verify (open items, not asserted either way):** (1) `eslint-config-next` is pinned at `15.3.2` in `package.json`, mismatched with Next 16; (2) `next build` on 16.2.6 prints "The `middleware` file convention is deprecated. Please use `proxy` instead" — `src/middleware.ts` still works (build output lists "Proxy (Middleware)") but should be migrated to `proxy`; (3) `npm run lint` is broken: the script is `next lint`, which no longer exists in Next 16 (it treats `lint` as a project directory) — switch to running ESLint directly. `npm run build` passes on 16.2.6 after removing an invalid `export const metadata = undefined` from the `'use client'` file `src/app/pricing/page.tsx` (Next 16 rejects metadata exports from client components). Also still open: `@faker-js/faker` and `json2csv` installed but unused (wire in or remove).
- **No error handling in bug-report route:** `generateBugReport(...)` in `src/app/api/generate/bug-report/route.ts` is not wrapped in try/catch (only the request JSON parse is), so AI failures surface as unhandled 500s.

### Fixed on 2026-11-08
All five fixes are type-checked (`npx tsc --noEmit` clean). Vitest (`^3`, devDependency; v5 conflicts with the project's `@types/node` 20) was approved and installed on 2026-11-08 with a `test` script, `vitest.config.ts`, and 10 passing unit tests at `src/lib/services/launch-readiness.service.test.ts` for the pure launch-readiness scoring function (`npm test`); the other fixes and all other modules still have NO automated tests. The migration SQL was NOT executed or tested.
- **vision_map `is_latest` (per asset)** — new `supabase/migrations/003_fix_vision_map_latest_and_chat_unique.sql` replaces `handle_new_artifact()` so the `vision_map` flip is scoped by `input_snapshot->>'asset_id'`, and backfills `is_latest` on the newest complete `vision_map` per surviving asset. Idempotent. **Takes effect only after the migration is applied.**
- **`chat_sessions` UNIQUE** — same migration 003 dedupes `chat_sessions` (keeps newest per `(project_id, user_id)`) and adds `chat_sessions_unique_active UNIQUE (project_id, user_id)` if missing. **Takes effect only after the migration is applied.**
- **`/api/chat/[projectId]` ownership** — GET/POST/DELETE call `ownsProject(projectId, user.id)` (admin client, `projects.user_id`) and return 404 if not owned.
- **Launch Readiness** — new `src/lib/services/launch-readiness.service.ts` (`computeLaunchReadiness` pure + `loadAndComputeLaunchReadiness`); `src/app/api/generate/launch-readiness/route.ts` is now a thin handler (auth + ownership + service call). Test coverage = volume (`min(count,50)/50*50`) + category breadth (`min(categories,6)/6*30`) + judge-verified ratio (`*20`); `coverage_score` is no longer read. UX blocking source is `Heuristic {heuristic_number} — {heuristic_name}`. ALL complete `bug_report` artifacts are loaded; bug score = 100 − sum of per-bug penalties (blocker 40, critical 30, major 15, minor 5, trivial 2), floored at 0; up to 5 blocker/critical bugs listed as blocking issues.
- **Test-cases Judge** — `src/app/api/generate/test-cases/route.ts` passes `project.extended_providers_enabled` to the Judge (Private mode no longer falls back to Google), and the artifact's `is_verified` is `true` only if the Judge succeeded.

### TODO (user action)
- [ ] **Apply migration 003 in Supabase (SQL editor) — not applied.** `supabase/migrations/003_fix_vision_map_latest_and_chat_unique.sql`. Until then multi-screen context still hides earlier screens' vision maps and the chat upsert can fail on a DB where 001 ran before 002. After applying, re-verify with two uploaded screenshots (both `vision_map` rows `is_latest = true`).

### (f) Docs reconciliation
On 2026-11-08 SCOPE.md, PHASES.md, SCHEMA.md, ARCHITECTURE.md and the `.agent/` docs were reconciled with the code. `testifye_final_plan.md` (v1.2) is superseded and now bannered as historical. Canonical specs: ARCHITECTURE / SCOPE / SCHEMA / PHASES.

---

## Phase 4 next tasks (remaining Phase 4 work)

1. **4.3 Accessibility Deep-Dive** — WCAG 2.1 AA audit beyond UX auditor's basic checks
2. **4.4 Test Suite Versioning** — diff view between test suite runs (added/removed/changed)
3. **4.5 Exploratory Testing Ideas** — AI creative testing scenarios tab in test-cases page
4. **4.7 Project Templates** — E-commerce, SaaS, FinTech, Social templates in ProjectForm

---

## Architecture decisions (locked)

- No Tailwind — vanilla CSS only; `--*` custom properties (`--accent`, `--bg-0`, …) in `src/styles/app.css`; class prefix `.tf-*`
- Supabase clients untyped — explicit `as T` casts at service boundaries
- AI SDK v6 + Zod v4 — `z.ZodType<T, any, any>` and `as any` cast on `streamObject()`
- SSE streaming — `partialObjectStream` for structured output, `textStream` for chat
- Accent color — `#8B5CF6` (NOT `#7C3AED`)
- GROQ → Google AI / Gemini fallback chain (Extended mode only); Cerebras dropped 2026-11-08
- Next.js 16.2.6 is the target framework version (decision 2026-11-08)
- vitest approved for unit tests (2026-11-08); run with `npm test`
- `is_latest` artifact pattern — flip previous rows false before inserting new
- `PROMPT_VERSION` in `prompt-version.ts` — bump when prompts change; `isStale(null)` = true
- Route handlers thin (≤25 lines) — validate → call service → respond
- All AI logic in `src/lib/ai/` — never import AI SDK directly in components
- All Zod schemas in `src/lib/schemas/` — shared between API and UI

---

## File map (Phase 4 additions)

### AI prompts
- `src/lib/ai/prompts/persona-friction.ts` — PERSONA_FRICTION_SYSTEM_PROMPT + buildPersonaFrictionPrompt
- `src/lib/ai/prompts/i18n-audit.ts` — I18N_AUDIT_SYSTEM_PROMPT + buildI18nAuditPrompt

### Schemas
- `src/lib/schemas/persona-friction.ts` — PersonaFrictionOutputSchema (was pre-existing)
- `src/lib/schemas/i18n-audit.ts` — I18nAuditOutputSchema (was pre-existing)
- `src/lib/schemas/launch-readiness.ts` — LaunchReadinessOutputSchema (NEW)

### Weaver service additions
- `streamPersonaFriction(opts)` → returns stream + provider + model + estimatedTokens
- `streamI18nAudit(opts)` → returns stream + provider + model + estimatedTokens

### Hooks
- `src/lib/hooks/useStreamPersonaFriction.ts`
- `src/lib/hooks/useStreamI18nAudit.ts`

### Routes
- `POST /api/generate/persona-friction` — SSE, max 300s
- `POST /api/generate/i18n-audit` — SSE, max 300s
- `POST /api/generate/launch-readiness` — non-AI, max 30s
