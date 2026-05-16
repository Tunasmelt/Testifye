# ⚡ COMMAND GRID — read this first, every session

| Command        | What it does                                   | Run when                                     |
|----------------|------------------------------------------------|----------------------------------------------|
| /ctx-search    | Semantic symbol/function search via index      | Need to find where something lives           |
| /ctx-map       | Rebuild .agent/index.json symbol index         | Files added/deleted, index stale             |
| /ctx-dump      | Write session state → HANDOFF.md               | Before /clear, end of session, context >50%  |
| /ctx-load      | Read HANDOFF.md and resume                     | Starting any session mid-task                |
| /ctx-scope     | Restrict file reads to specified paths         | Focused sub-task, avoid context bleed        |
| /ctx-audit     | Report context health, token estimate          | Session feels slow or drifting               |
| /plan          | Plan-only mode — no edits until approved       | Non-trivial multi-file tasks                 |

> RULE 1: Never read a file to find a symbol — run /ctx-search first.
> RULE 2: Check for HANDOFF.md before any first action in a session.
> RULE 3: Never let context exceed 60% before running /ctx-dump.
> RULE 4: Never install packages without listing them and asking first.
> RULE 5: Never generate code before reading the relevant section of ARCHITECTURE.md, SCHEMA.md, or SCOPE.md.

---

# §PROJECT

```yaml
name:        Tesifye
type:        saas
agent-index: .agent/index.json
handoff:     HANDOFF.md
```

## Stack
- Next.js 15 (App Router) + TypeScript 5
- Supabase (Auth + Postgres + Storage)
- Vercel AI SDK · GROQ (primary) · Google AI Studio · Cerebras (fallbacks)
- Zustand · TanStack React Query
- Vanilla CSS (glassmorphic design system, no Tailwind)

## Architecture pointers
Read only the file relevant to your current task.

| Area                    | File to read                          |
|-------------------------|---------------------------------------|
| Tech stack & conventions | ARCHITECTURE.md                      |
| Feature scope & edge cases | SCOPE.md                           |
| All data schemas & API contracts | SCHEMA.md                  |
| Phase roadmap & head prompts | PHASES.md                        |
| AI pipeline (Scout→Generator→Judge) | ARCHITECTURE.md § AI Pipeline |
| CSS tokens & design system | ARCHITECTURE.md § Visual Identity  |
| Image pipeline           | ARCHITECTURE.md § Image Pipeline     |
| Rate limit & fallback    | ARCHITECTURE.md § Multi-Provider Fallback |
| Auth flow                | ARCHITECTURE.md § Auth Architecture  |

## Open decisions (do not assume — flag and ask)
- [ ] Pricing tiers and feature gates (Pricing page exists in mockup but limits not defined)
- [ ] Whether to support team workspaces in Phase 1 or defer to Phase 5
- [ ] Preferred Jira/Linear OAuth flow vs API key input

## Locked decisions (do not revisit)
- [x] No Tailwind CSS — vanilla CSS only, using custom properties from app.css
- [x] No standalone backend — all server logic in Next.js Route Handlers
- [x] Email/password auth in Phase 1, Google OAuth prepared but inactive
- [x] Multi-provider fallback: GROQ → Google AI Studio → Cerebras
- [x] Images compressed to ≤150KB WebP, cached in IndexedDB, promoted on save
- [x] Streaming-first: streamObject for user-facing, generateObject for internal
- [x] Accent color is #8B5CF6 (NOT #7C3AED — old value)
- [x] CQRS-inspired hybrid manifest: generated_artifacts (truth) + manifest_snapshot (read cache)

---

# §RULES

## Structural (hooks enforce these)
- Never commit directly to main/master
- Never read more than 3 files without running /ctx-search first
- All AI logic lives in `src/lib/ai/` — never import AI SDK directly in components
- All Zod schemas live in `src/lib/schemas/` — shared between API and UI
- Route handlers are THIN (max ~25 lines) — validate → call service → respond
- 'use client' only where necessary — Server Components by default

## Behavioural
- Output diffs not full files for targeted edits
- Batch questions — not sequential turns
- Skip recaps: "No recap. Proceed."
- Do not auto-install packages — list and ask
- Always check SCHEMA.md before creating any data structure
- Always check PHASES.md for the correct phase before starting any feature

---

# §SESSION

## Starting a session
```
1. ls HANDOFF.md → read it in full if exists
2. Run /ctx-audit
3. Run /ctx-scope [relevant dirs for this task]
4. State session goal in one sentence
```

## Ending a session
```
1. Run /ctx-dump
2. git add .agent/ HANDOFF.md && git commit -m "ctx: session handoff [date]"
```

## Context emergency
```
1. /ctx-dump immediately
2. /clear
3. "Read HANDOFF.md and continue from where we left off."
```

## Task brief format
```
Context: [2–3 sentences on current project state and phase]
Goal:    [one sentence — this session accomplishes X]
Files:   [explicit list of relevant files]
Avoid:   [areas not to touch]
Task:    [specific instruction with acceptance criteria]
```

<!-- Keep this file under 150 lines. Detail goes in .agent/docs/ -->
