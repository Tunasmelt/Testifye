# .agent/docs — Architecture Pointer Files
Last updated: 2026-11-08

These files are what agents read **instead of scanning the whole codebase**.
Each file covers one area and points to the exact source files relevant to that area.

> **Code wins.** These are compact summaries and can drift. If a summary disagrees with the code (`src/lib/schemas/*.ts`, `src/app/api/**/route.ts`, `src/lib/ai/*`, `src/lib/stores/*`, `src/lib/hooks/*`, `supabase/migrations/*.sql`), trust the code, then fix the summary. Where code contradicts a locked decision in CLAUDE.md, the docs say “Implementation status:” or flag it — resolve with a human.

## Quick reference table (every file in this folder)

| File | What it covers |
|---|---|
| [ai-pipeline.md](./ai-pipeline.md) | Scout → Generator → Judge, feature→model map, context budget, prompt versioning |
| [database.md](./database.md) | Migrations, tables, RLS, artifact trigger, storage bucket, Supabase clients, known schema issues |
| [design-system.md](./design-system.md) | CSS files, tokens (#8B5CF6 accent), `.tf-*` classes, themes, hex-literal exception |
| [auth.md](./auth.md) | Supabase SSR auth, middleware, `/callback` route, route protection |
| [image-pipeline.md](./image-pipeline.md) | Compress → hash → IDB → upload, dedup, Shadow Scout, dirty state |
| [state-management.md](./state-management.md) | Zustand stores (`src/lib/stores`), SSE hooks (no React Query in use) |
| [rate-limit.md](./rate-limit.md) | Groq → Google fallback, model registry, privacy flag, what is NOT implemented (countdown; Cerebras dropped 2026-11-08) |
| [export.md](./export.md) | Client-side text exports for the test suite; Export page limits |
| [phases-quick-ref.md](./phases-quick-ref.md) | Phase 1–5 task list with status (PHASES.md is canonical) |
| [features/test-cases.md](./features/test-cases.md) | Test Case Generator — streaming, Judge, recovery, export |
| [features/ux-audit.md](./features/ux-audit.md) | UX/UI Auditor — findings schema, score history, stale nudge |
| [features/bug-report.md](./features/bug-report.md) | Bug Report Formatter — non-streaming, Plain/Jira/Linear text |
| [features/gap-finder.md](./features/gap-finder.md) | Requirement Gap Finder — PDF/DOCX/OCR pipeline, 7 gap types |
| [features/semantic-link.md](./features/semantic-link.md) | Semantic Link Engine — verified/missing/mismatch/untested |
| [features/sidekick.md](./features/sidekick.md) | Sidekick Chat — `streamText` SSE + `chat_sessions` persistence |
| [features/test-data.md](./features/test-data.md) | Synthetic Test Data — scenario-based, model-only |
| [features/persona-friction.md](./features/persona-friction.md) | Persona Friction — single stream, card per persona |
| [features/i18n-audit.md](./features/i18n-audit.md) | i18n / RTL Audit — categories, readiness score |
| [features/launch-readiness.md](./features/launch-readiness.md) | Launch Readiness — deterministic service (`launch-readiness.service.ts`), no AI |

## Primary sources of truth
These files in the project root are the authoritative specification:
- **ARCHITECTURE.md** — how the system works (tech stack, conventions, pipelines)
- **SCOPE.md** — what it does (features, roles, edge cases)
- **SCHEMA.md** — data shapes (SQL, Zod, API contracts, system prompts)
- **PHASES.md** — when to build it (phase roadmap + task head prompts; canonical task numbering)

Root docs are edited separately and may lag the code; for data shapes prefer the real Zod schemas and migrations.

## How agents should use this folder

1. **Starting a session:** run `/ctx-audit` → read HANDOFF.md → state goal
2. **Finding a symbol:** `/ctx-search <name>` — never open files to scan
3. **Working on a feature:** read the relevant `features/*.md` file first
4. **Touching data:** read `database.md`, then the real Zod schema / migration for exact field names
5. **Touching AI:** read `ai-pipeline.md` and `rate-limit.md` — AI logic belongs in `src/lib/ai/`
6. **Touching CSS:** read `design-system.md` — use token names from `src/styles/app.css`
7. **Edited code that changes a documented behavior?** Update the matching summary and its `Last updated:` line.
