# Phases Quick Reference
Last updated: 2026-11-08

> Rapid lookup. PHASES.md is canonical for task numbering, names, and head prompts — if this file disagrees, PHASES.md wins. Status below reflects the code as of the last-updated date.

Status key: Done · Partial · Not started

## Phase 1 — The Core Engine (Tasks 1.1–1.21) — COMPLETE
**Goal:** Create project → upload screenshots → generate verified test cases → export.

| Task | Name (PHASES.md) | Status |
|---|---|---|
| 1.1 | Project Scaffold | Done |
| 1.2 | Design System | Done |
| 1.3 | Supabase Setup | Done |
| 1.4 | Auth Flow | Done |
| 1.5 | Image Pipeline | Done |
| 1.6 | Project CRUD + App Shell | Done |
| 1.7 | Provider Registry | Done |
| 1.8 | Scout Pipeline | Done |
| 1.9 | Generator Pipeline | Done |
| 1.10 | Judge Pipeline | Done |
| 1.11 | Context Budget | Done |
| 1.12 | System Prompts | Done |
| 1.13 | Test Case UI | Done |
| 1.14 | Partial Stream Recovery | Done |
| 1.15 | Export Engine Page | Done |
| 1.16 | Rate Limit Queue | Done (store exists; not wired to UI — see rate-limit.md) |
| 1.17 | Landing Page | Done |
| 1.18 | Manifest Trigger | Done |
| 1.19 | Landing Page (full mockup) | Done |
| 1.20 | Sidekick Chat (v1 Session) | Done |
| 1.21 | TweaksPanel (Theme Switcher) | Done |

## Phase 2 — Analysis & Richness (Tasks 2.1–2.11) — COMPLETE
**Goal:** UX/UI Auditor, Bug Reports, role-based output, Gherkin export, Sidekick persistence.

| Task | Name | Status | Notes |
|---|---|---|---|
| 2.1 | UX/UI Auditor | Done | features/ux-audit.md |
| 2.2 | Pre-AI Screen Metrics | Done | helpers exist; client does not yet send `screenMetricsSummary` |
| 2.3 | Screenshot Labeling | Done | inline label edit (`PATCH /api/assets/[assetId]`) |
| 2.4 | Dirty State Detection | Done | `is_dirty` set + banner; never cleared (see image-pipeline.md) |
| 2.5 | Bug Report Formatter | Done | non-streaming |
| 2.6 | Role-Based Output | Done | |
| 2.7 | Gherkin Export | Done | deterministic string builder, not AI |
| 2.8 | UX Score History | Done | |
| 2.9 | Sidekick Chat v1 (Persistence) | Done | `chat_sessions` |
| 2.10 | Data Privacy Toggle | Done | `projects.extended_providers_enabled` |
| 2.11 | Shadow Scout | Done | `after()` on upload |

## Phase 3 — Intelligence Layer (Tasks 3.1–3.8) — COMPLETE
**Goal:** PDF/DOCX import, OCR, semantic linking, test data, CSV export, coverage analysis.

| Task | Name | Status | Notes |
|---|---|---|---|
| 3.1 | Requirement Gap Finder | Done | |
| 3.2 | Scanned PDF OCR | Done | tesseract.js fallback in `document.service.ts` |
| 3.3 | Semantic Link Engine | Done | |
| 3.4 | Synthetic Test Data | Done | model-only; faker not wired |
| 3.5 | Full Export | Done | CSV + text formats for test cases only; Jira/Linear API not shipped |
| 3.6 | Prompt Versioning | Done | `prompt-version.ts` |
| 3.7 | Token Budget Estimator | Done | `/api/generate/estimate` |
| 3.8 | Coverage Gap Analysis | Done | `CoverageGapAnalysis.tsx` |

## Phase 4 — Power Features (Tasks 4.1–4.7) — IN PROGRESS
**Goal:** Persona analysis, i18n audit, accessibility deep-dive, versioning, launch readiness.

| Task | Name | Status |
|---|---|---|
| 4.1 | Persona Friction Analysis | Done |
| 4.2 | i18n / RTL Audit | Done |
| 4.3 | Accessibility Deep-Dive | Not started |
| 4.4 | Test Suite Versioning | Not started |
| 4.5 | Exploratory Testing Ideas | Not started |
| 4.6 | Launch Readiness Score | Done |
| 4.7 | Project Templates | Not started |

## Phase 5 — Collaboration & Scale (Tasks 5.1–5.7) — NOT STARTED
**Goal:** Google OAuth, teams, comments, sharing, analytics, persistent chat.

| Task | Name | Status |
|---|---|---|
| 5.1 | Google OAuth | Not started (callback route exists, unused) |
| 5.2 | Team Workspaces | Not started (open decision: Phase 1 vs 5 — CLAUDE.md) |
| 5.3 | Comments & Annotations | Not started |
| 5.4 | Shared Report Links | Not started |
| 5.5 | Analytics Dashboard | Not started |
| 5.6 | Activity Feed | Not started |
| 5.7 | Sidekick Chat v2 | Not started |

Not in PHASES.md (do not build as tasks): Command Palette, Public Roadmap Page, Public API / GitHub Actions integration.

Jira/Linear: Task 3.5 lists Jira/Linear integration; it is deferred pending the open OAuth-vs-API-key decision (CLAUDE.md). Only text exports shipped.

## Phase guard — which phase am I in?
1. Is the task listed under the current phase in PHASES.md? → Proceed.
2. Is it a later-phase feature? → Do NOT build it early.
3. Does it depend on a later task? → Build the dependency first.

Respect task order inside a phase; if this table and PHASES.md ever differ, trust PHASES.md.
