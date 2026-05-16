# Phases Quick Reference
Last updated: 2026-05-09

> Read PHASES.md for full task head prompts. This file is a rapid lookup table.

## Phase 1 — Foundation (Tasks 1.1–1.21)
**Goal:** Scaffold, design system, auth, project CRUD, Test Case Generator, image pipeline, rate limit queue, landing page, Sidekick v0, theme switcher.

| Task | Description | Key output |
|---|---|---|
| 1.1 | Project Scaffold | Next.js 15 app, dir structure, env.local |
| 1.2 | Design System | app.css, marketing.css, animations.css, 14 UI components |
| 1.3 | Supabase Schema | All tables, RLS, triggers, storage bucket |
| 1.4 | Auth Pages | Login, Signup, OAuth callback route |
| 1.5 | Auth Middleware | Protects /dashboard/*, redirects to /login |
| 1.6 | Project CRUD + App Shell | AppShell, Sidebar (10 items), Topbar, Breadcrumb, OverviewPage |
| 1.7 | Image Upload | AssetUploader, SHA256 dedup, pHash, compress, IDB |
| 1.8 | AI Providers | providers.ts, MODEL_REGISTRY, FEATURE_MODEL_MAP |
| 1.9 | Context Budget | context-budget.ts, semantic truncation |
| 1.10 | Scout Stage | weaver.service.ts Scout, ScreenElementMap schema |
| 1.11 | Generator Stage | streamObject wrapper, streaming UX in TestCasePage |
| 1.12 | Judge Stage | generateObject verification, is_verified flag |
| 1.13 | Rate Limit Queue | rate-limit.store.ts, Zustand queue |
| 1.14 | Fallback Chain | generate-with-fallback.ts, stream-with-fallback.ts |
| 1.15 | Export Engine Page | ExportPage with 6 format cards, bundle builder, Toggle switches |
| 1.16 | Generation Store | generation.store.ts, partial stream recovery |
| 1.17 | Manifest Snapshot | manifest_snapshot JSONB, TanStack Query invalidation |
| 1.18 | Trigger Validation | SQL test: INSERT artifact → snapshot auto-updated |
| 1.19 | Landing Page | 11 sections, pricing, about, MNav, MFooter, CountUp |
| 1.20 | Sidekick v0 | SidekickPage (session-only), SimpleMarkdown, /api/generate/chat |
| 1.21 | TweaksPanel | Theme switcher, data-theme, localStorage, flash prevention |

---

## Phase 2 — Analysis & Richness (Tasks 2.1–2.10)
**Goal:** UX Auditor, Bug Reports, role-based output, Gherkin export, Sidekick DB persistence, dashboard analytics, Shadow Scout.

| Task | Description |
|---|---|
| 2.1 | Shadow Scout (background scan post-upload via after()) |
| 2.2 | UX/UI Auditor (screen metrics + heuristics) |
| 2.3 | Dirty State System (is_dirty flag, pulsing UI, re-analyze prompt) |
| 2.4 | Command Palette (cmdk library, ⌘K, global search) |
| 2.5 | Bug Report Formatter (full schema with frequency, root_cause_hypothesis, labels) |
| 2.6 | Role-Based Output (language adaptation per user_role) |
| 2.7 | Gherkin Export (fast_format model, .feature file download) |
| 2.8 | Dashboard Analytics (Recharts: coverage bar, UX trend line, gap pie) |
| 2.9 | Sidekick Chat v1 (DB persistence via chat_sessions table) |
| 2.10 | Data Privacy Toggle (projects.extended_providers_enabled) |

---

## Phase 3 — PRD Intelligence (Tasks 3.1–3.6)
**Goal:** Gap Finder, Semantic Link, Test Data Generator, Jira/Linear integrations, CSV export.

| Task | Description |
|---|---|
| 3.1 | Document Parser (pdfjs-dist, mammoth, Tesseract.js OCR) |
| 3.2 | Requirement Gap Finder (7 gap types, confidence scores) |
| 3.3 | Semantic Link Engine (traceability matrix, verified/missing/mismatch/untested) |
| 3.4 | Synthetic Test Data Generator (Faker.js + GROQ field mapping) |
| 3.5 | Jira & Linear Integration (API key input, push tickets) |
| 3.6 | CSV Export (json2csv, downloadable from ExportPage) |

---

## Phase 4 — Intelligence & Depth (Tasks 4.1–4.4)
**Goal:** Persona Friction, i18n Audit, Launch Readiness Score, public roadmap.

| Task | Description |
|---|---|
| 4.1 | Persona Friction Analysis (5 personas, drop_off_risk, friction_type) |
| 4.2 | i18n / RTL Audit (readiness_score, rtl_risk_score, 6 category types) |
| 4.3 | Launch Readiness Score (deterministic computation, 4-component composite) |
| 4.4 | Public Roadmap Page (non-auth landing page section) |

---

## Phase 5 — Scale & Collaboration (Tasks 5.1–5.4)
**Goal:** Team workspaces, Sidekick v2 persistent memory, API, GitHub Actions integration.

| Task | Description |
|---|---|
| 5.1 | Team Workspaces (org-level RLS, role-based access) |
| 5.2 | Sidekick v2 (cross-session memory, cross-project patterns) |
| 5.3 | Public API (API keys, rate limiting per key, webhook events) |
| 5.4 | GitHub Actions Integration (post test results as PR comments) |

---

## Phase guard — which phase am I in?

Ask yourself:
1. Is this task listed under the current phase? → Proceed
2. Is this a Phase 2+ feature? → Do NOT build it in Phase 1
3. Is it a Phase 1 task but depends on a later task? → Build the dependency first

**The locked sequence within each phase matters.** Do not skip tasks or build out of order.
