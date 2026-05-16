# .agent/docs — Architecture Pointer Files

These files are what agents read **instead of scanning the whole codebase**.
Each file covers one area and points to the exact source files relevant to that area.

## Quick reference table

| File | What it covers |
|---|---|
| [ai-pipeline.md](./ai-pipeline.md) | Scout→Generator→Judge, model registry, fallback chains, context budget |
| [database.md](./database.md) | SQL schema, RLS, trigger, Zod schemas, Supabase clients |
| [design-system.md](./design-system.md) | CSS tokens, class names, theme variants, TweaksPanel |
| [auth.md](./auth.md) | Supabase SSR auth, middleware, route protection |
| [image-pipeline.md](./image-pipeline.md) | 4-layer dual-hash, compression, IDB cache, Shadow Scout |
| [state-management.md](./state-management.md) | Zustand stores, TanStack Query, optimistic UI |
| [rate-limit.md](./rate-limit.md) | Rate limit queue, provider fallback, priority ordering |
| [export.md](./export.md) | Export engine page, format support, bundle builder |
| [features/test-cases.md](./features/test-cases.md) | Test Case Generator — inputs, streaming UI, edge cases |
| [features/ux-audit.md](./features/ux-audit.md) | UX/UI Auditor — heuristics, screen metrics, effort filter |
| [features/bug-report.md](./features/bug-report.md) | Bug Report Formatter — schema fields, Jira/Linear tabs |
| [features/gap-finder.md](./features/gap-finder.md) | Requirement Gap Finder — PDF/DOCX/OCR pipeline |
| [features/semantic-link.md](./features/semantic-link.md) | Semantic Link Engine — traceability matrix |
| [features/sidekick.md](./features/sidekick.md) | Sidekick Chat — v1 session, v2 persistent |
| [features/test-data.md](./features/test-data.md) | Synthetic Test Data Generator |
| [features/persona-friction.md](./features/persona-friction.md) | Persona Friction Analysis |
| [features/i18n-audit.md](./features/i18n-audit.md) | i18n / RTL Audit |
| [features/launch-readiness.md](./features/launch-readiness.md) | Launch Readiness Score |
| [phases-quick-ref.md](./phases-quick-ref.md) | Phase 1–5 task checklist — quick lookup without reading PHASES.md |

## Primary sources of truth
These 4 files in the project root are the authoritative specification:
- **ARCHITECTURE.md** — how the system works (tech stack, conventions, pipelines)
- **SCOPE.md** — what it does (10 features, roles, edge cases)
- **SCHEMA.md** — data shapes (SQL, Zod, API contracts, system prompts)
- **PHASES.md** — when to build it (phase roadmap + task head prompts)

The `.agent/docs/` files here are **compact summaries with gotchas** — read them for quick orientation, then go to the root markdown for full detail.

## How agents should use this folder

1. **Starting a session:** run `/ctx-audit` → read HANDOFF.md → state goal
2. **Finding a symbol:** `/ctx-search <name>` — never open files to scan
3. **Working on a feature:** read the relevant `features/*.md` file first
4. **Touching data:** read `database.md` — check SCHEMA.md for exact field names
5. **Touching AI:** read `ai-pipeline.md` — never import AI SDK outside `src/lib/ai/`
6. **Touching CSS:** read `design-system.md` — use exact token names from ARCHITECTURE.md
