# HANDOFF — Testifye Phase 1

**Date:** 2026-05-16  
**Session goal:** Complete Phase 1 UI features — Sidekick Chat, Landing Page, Pricing, About.  
**Branch:** master (root commit c07a137)  
**TypeScript:** 0 errors (`npx tsc --noEmit`)

---

## Phase 1 completion status

| Task  | Status    | Notes |
|-------|-----------|-------|
| 1.1   | ✅ Done   | Project scaffold, tsconfig, next.config |
| 1.2   | ✅ Done   | Design system CSS tokens, app.css, animations.css, marketing.css |
| 1.3   | ✅ Done   | Supabase clients (browser/server/admin), migrations, types |
| 1.4   | ✅ Done   | Auth flow: login/signup/callback, middleware, Suspense fix |
| 1.5   | ✅ Done   | Image pipeline: hash, compress, IndexedDB, upload, dedup |
| 1.6   | ✅ Done   | Project CRUD, AppShell, Sidebar, Topbar, overview page |
| 1.7–12 | ✅ Done  | AI pipeline: providers, Scout→Generator→Judge, prompts, fallback, context-budget |
| 1.13  | ✅ Done   | Test case UI: streaming → verified cards, TestCaseList, TestCaseRow |
| 1.14  | ✅ Done   | Partial stream recovery: PartialBanner/resume in generation store |
| 1.15  | ✅ Done   | Export Engine page: 6 formats, download + copy, include toggles |
| 1.16  | ✅ Done   | Rate limit queue store (useRateLimitStore) |
| 1.17  | ✅ Done   | Landing page, pricing page, about page, marketing components |
| 1.18  | ✅ Done   | Manifest trigger SQL in 001_initial_schema.sql |
| 1.19  | ✅ Done   | Sidekick Chat v0: SidekickChat, SimpleMarkdown, /sidekick page |
| 1.20  | ✅ Done   | TweaksPanel (theme + accent switcher) |
| 1.21  | ✅ Done   | Git checkpoint committed |

**Phase 1 is COMPLETE.**

---

## Key architectural decisions locked

- **No Tailwind** — vanilla CSS only, `--tf-*` custom properties in `src/styles/app.css`
- **Supabase clients untyped** — no `Database` generic, explicit `as T` casts at service boundaries
- **AI SDK v6 + Zod v4** — use `z.ZodType<T, any, any>` and `as any` cast on `streamObject()`
- **SSE streaming** — `partialObjectStream` for test cases, `textStream` (via `streamText`) for chat
- **Per-page AppShell** — `dashboard/layout.tsx` and `dashboard/[projectId]/layout.tsx` are passthroughs; each page renders its own `<AppShell projectId={...}>`
- **Accent color** — `#8B5CF6` (NOT `#7C3AED`)
- **GROQ → Google AI Studio → Cerebras** fallback chain

---

## File map (key files)

### AI pipeline
- `src/lib/ai/providers.ts` — `getModel(role, vision)` with fallback chain
- `src/lib/ai/stream-with-fallback.ts` — `streamWithFallback()` wraps AI SDK v6
- `src/lib/ai/generate-with-fallback.ts` — `generateWithFallback()` for internal calls
- `src/lib/ai/weaver.service.ts` — `scoutScreens()`, `generateTestCases()`, `judgeTestSuite()`
- `src/lib/ai/context-budget.ts` — `buildChatContext()` for Sidekick
- `src/lib/ai/prompts/` — scout.ts, generator.ts, judge.ts

### Schemas
- `src/lib/schemas/test-case.ts` — `TestCase`, `TestSuiteOutput`
- `src/lib/schemas/screen-element-map.ts` — `ScreenElementMap`
- `src/lib/schemas/ux-review.ts`, `bug-report.ts`, `gap-analysis.ts`, `persona-friction.ts`, `semantic-link.ts`, `i18n-audit.ts`

### Routes
- `src/app/api/generate/test-cases/route.ts` — SSE, `partialObjectStream`
- `src/app/api/generate/chat/route.ts` — SSE, `streamText`, Sidekick
- `src/app/api/assets/upload/route.ts` — image dedup + Storage upload
- `src/app/api/assets/signed-url/route.ts` — signed URL for display

### UI pages
- `src/app/page.tsx` — Landing (client, useScrollReveal)
- `src/app/pricing/page.tsx` — Pricing with billing toggle + FAQ
- `src/app/about/page.tsx` — About with team grid
- `src/app/dashboard/[projectId]/test-cases/` — test case generation UI
- `src/app/dashboard/[projectId]/sidekick/page.tsx` — Sidekick chat
- `src/app/dashboard/[projectId]/export/` — export engine

### Stores
- `src/lib/stores/generation.store.ts` — status, cases[], streaming[], buffer, resumeFrom
- `src/lib/stores/rate-limit.store.ts` — queue, retryAfter, QueueStatus

### Marketing components
- `src/components/marketing/MarketingNav.tsx`
- `src/components/marketing/MarketingFooter.tsx`
- `src/components/marketing/CountUp.tsx`
- `src/components/marketing/useScrollReveal.ts`

### Sidekick
- `src/components/sidekick/SidekickChat.tsx` — full chat UI, SSE streaming
- `src/components/sidekick/SimpleMarkdown.tsx` — inline markdown: **bold**, *italic*, `code`, lists

---

## Phase 2 priorities (next session)

1. **DB-persisted chat sessions** — `chat_sessions` table, upsert per project, messages JSONB
2. **UX Audit feature** — `/api/generate/ux-audit` route + UXAuditClient page
3. **Bug Report formatter** — `/api/generate/bug-report` + BugReportClient page
4. **Manifest snapshot trigger** — SQL trigger already in migration, needs verification
5. **Rate limit badge** — connect `useRateLimitStore` to Topbar provider badge
6. **Auth: Google OAuth** — prepared but inactive; activate when env vars available
7. **Settings page** — profile, notifications, API keys, danger zone

---

## Open questions (do not assume)
- [ ] Jira/Linear OAuth vs API key input flow
- [ ] Pricing tiers finalized? (Session decided: Solo $0, Team $29/mo, Scale custom)
- [ ] Team workspaces deferred to Phase 5 ✅

---

## Known issues / gotchas

- `useScrollReveal` uses `IntersectionObserver` — SSR-safe because it's inside `useEffect`
- Pricing and About pages are `'use client'` — cannot export `metadata`; add to route segment config or use a server wrapper if metadata is needed
- `SidekickChat` phase 1: session memory only, refreshing clears history (shown in UI notice)
- `pipeline-output` in hero uses `position: absolute` — relies on `.pipeline` being `position: relative`
