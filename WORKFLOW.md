# Tesifye — Developer Workflow Guide

> **How to develop Tesifye task-by-task with any AI agent (Gemini, Claude, GPT, Cursor) and guarantee no gaps.**

---

## The Core Rule

**One task. One session. One acceptance test.**

Never ask an agent to build more than one PHASES.md task per session. The moment a session tries to cover Task 1.3 AND Task 1.4 together, it will skip the hard parts of one of them.

---

## Step 1 — The Session Opening Ritual (always do this)

Before ANY coding message, paste this block at the top of every **fresh** session (no `HANDOFF.md` context loaded yet):

> Scope note: this ritual is for orienting a *fresh* session. It does not override `CLAUDE.md` RULE 1 / RULE 5 for reads *within* a task — once working, search first (`/ctx-search`) and read only the relevant section of ARCHITECTURE.md / SCHEMA.md / SCOPE.md rather than re-reading whole files. In a Claude Code session, `CLAUDE.md` is already loaded automatically; if you are resuming mid-task, use `/ctx-load` instead of the full ritual.

```
You are developing "Tesifye" — an AI-native QA web platform.

Read these files IN ORDER before writing any code:
1. CLAUDE.md              — rules, locked decisions, command grid
2. ARCHITECTURE.md        — tech stack, conventions, streaming patterns, AI pipeline
3. SCHEMA.md              — all data schemas (Zod, SQL, TypeScript)
4. SCOPE.md               — what each feature does, inputs, outputs, edge cases
5. .agent/docs/README.md  — pointer to all architecture doc files

Then read the specific doc for this task:
- [PASTE RELEVANT .agent/docs/ FILE PATH HERE]

Do NOT write any code until you confirm you have read all 5 files above.
State in one sentence what you are about to build.
```

---

## Step 2 — The Task Prompt (copy from PHASES.md)

After the opening ritual, paste the **head prompt** for the specific task from PHASES.md verbatim:

```
[PASTE THE FULL HEAD PROMPT FROM PHASES.md TASK X.Y HERE]
```

The head prompts in PHASES.md are already written to be agent-ready — they include:
- Exact files to create
- Exact field names to use from SCHEMA.md
- Acceptance test criteria
- What NOT to do

---

## Step 3 — Acceptance Test Verification

After the agent finishes, **never move to the next task** until you verify the acceptance test from the task's head prompt.

For **every task**, run:

```bash
# 1. Does it start?
npm run dev

# 2. Does it type-check?
npx tsc --noEmit

# 3. Does it lint?
npm run lint

# 4. Manual check from the acceptance test list in PHASES.md
```

If any of these fail → paste the error back to the agent and say:
```
Fix this error. Do not change anything else. Do not refactor. Just fix this specific error.
[PASTE ERROR]
```

---

## Step 4 — Session End (critical — never skip)

At the end of every session where code was written:

```bash
bash .agent/scripts/ctx-dump.sh
```

This prompts the agent to write `HANDOFF.md` with:
- What was built
- Key decisions made
- Next steps
- Gotchas discovered

Create a feature branch first — CLAUDE.md forbids committing directly to main/master (e.g. `git switch -c feat/task-1-x`). Then commit:
```bash
git add .
git commit -m "feat: Task 1.X — [task name]"
git add .agent/ HANDOFF.md
git commit -m "ctx: session handoff [date]"
```

---

## The Full Task Sequence

**`PHASES.md` is the canonical source for task numbers, names, head prompts and acceptance tests.** Do not rely on any copy of the list elsewhere. Work through tasks in strict order within a phase; do not skip.

Phase 1 task headings, as of 2026-11-08 (generated from `PHASES.md` headings `## Task 1.x`; if they differ from PHASES.md, PHASES.md wins):

| # | Task (PHASES.md heading) |
|---|---|
| 1.1 | Project Scaffold |
| 1.2 | Design System |
| 1.3 | Supabase Setup |
| 1.4 | Auth Flow |
| 1.5 | Image Pipeline |
| 1.6 | Project CRUD + App Shell |
| 1.7 | Provider Registry |
| 1.8 | Scout Pipeline |
| 1.9 | Generator Pipeline |
| 1.10 | Judge Pipeline |
| 1.11 | Context Budget |
| 1.12 | System Prompts |
| 1.13 | Test Case UI |
| 1.14 | Partial Stream Recovery |
| 1.15 | Export Engine Page |
| 1.16 | Rate Limit Queue |
| 1.17 | Landing Page |
| 1.18 | Manifest Trigger |
| 1.19 | Landing Page (full mockup) |
| 1.20 | Sidekick Chat (v1 Session) |
| 1.21 | TweaksPanel (Theme Switcher) |

For Phases 2+ see the `## Task N.x` headings in `PHASES.md`. Acceptance tests live in each task's head prompt there.

---

## How to Handle Agent Drift (common problems)

### Problem: Agent makes up field names
**Fix:** Add to your session prompt:
```
CRITICAL: All data field names must come EXACTLY from SCHEMA.md.
Do not invent field names. If you are unsure, read SCHEMA.md section [X] first.
```

### Problem: Agent builds more than asked
**Fix:**
```
STOP. You are only building Task 1.X. 
Remove everything you added that is not in the task's file list.
```

### Problem: Agent ignores the acceptance test
**Fix:** At the end of every task, say:
```
Now run the acceptance test from the task:
[PASTE ACCEPTANCE TEST FROM PHASES.md]
Verify each bullet point. Show me the result of each check.
```

### Problem: Agent writes AI code without using weaver.service.ts
**Fix:**
```
You must not import @ai-sdk/groq or @ai-sdk/google directly.
All AI calls go through src/lib/ai/weaver.service.ts or generate-with-fallback.ts.
Refactor this to use those files.
```

### Problem: Agent uses Tailwind
**Fix:**
```
Remove all Tailwind classes. Use only CSS custom properties from app.css.
Class names must use the .tf-* prefix system from ARCHITECTURE.md.
```

---

## Agent-Specific Tips

### Using a filesystem-capable CLI agent (e.g. Gemini CLI)
- Any agent with filesystem access works; the steps below are tool-neutral
- For each task, start a new conversation and paste the opening ritual + head prompt
- Use `/ctx-search` to find symbols before reading files (where the tool supports the command grid)

### Using Claude Code (VS Code / terminal)
- Claude Code natively reads CLAUDE.md at session start — it will see the command grid
- Use `/ctx-audit` first to check health
- Use `/ctx-load` if resuming from a previous session

### Using Cursor
- Copy the §COMMANDS and §RULES sections from CLAUDE.md into `.cursorrules`
- Cursor will apply them automatically to every chat
- Reference `.agent/docs/` files explicitly: "Read .agent/docs/features/test-cases.md first"

### Using any agent (general)
- Always paste the opening ritual block
- Never say "build the app" — always say "build Task X.Y from PHASES.md"
- Always verify the acceptance test before the next session
- Always run ctx-dump at end

---

## Testing Strategy Per Task

> **Status (2026-11-08):** `vitest` (v3) is installed as a devDependency with a `test` script and `vitest.config.ts`. Run unit tests with `npm test`. First tests: `src/lib/services/launch-readiness.service.test.ts` (pure scoring function). Other modules still have no tests, so the table below is a target for new work, not a description of current coverage.

Each task should produce tests alongside the feature code:

| File created | Test to write |
|---|---|
| `src/lib/services/*.ts` | Unit test with `vitest` (mock Supabase) |
| `src/lib/ai/*.ts` | Unit test with mocked AI response |
| `src/lib/schemas/*.ts` | Schema validation tests (valid + invalid inputs) |
| `src/app/api/**/*.ts` | Integration test (mock auth + mock DB) |
| `src/components/**/*.tsx` | Component snapshot or interaction test |

Add to your task prompt:
```
After creating each service file, write a corresponding test file in the same directory
with a `.test.ts` extension. Mock Supabase using a local mock object, not the real client.
```

---

## The "No Gaps" Checklist

Before marking any task done, check:

- [ ] All files listed in the task head prompt exist
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm run lint` passes
- [ ] Every acceptance test bullet passes manually
- [ ] Relevant test file written alongside new service/schema files (vitest approved 2026-11-08; run `npm test` — see Testing Strategy)
- [ ] No hardcoded color hex values (must use CSS custom properties) — **one deliberate exception:** CSS variables cannot have an alpha suffix appended (e.g. `var(--error)` + `'18'` is invalid). Severity/status color maps that need alpha tints (suffixes seen in code: `'12'|'18'|'22'|'30'|'40'|'44'`) therefore use hex literals, e.g. in `PersonaFrictionClient`, `TestDataClient`, `LaunchReadinessClient`, `I18nAuditClient`, `GapAnalysisClient` (also `BugReportsClient`, `UXAuditClient`). Use hex only for such alpha-suffix maps; everything else uses `var(--*)` tokens.
- [ ] No direct AI SDK imports outside `src/lib/ai/`
- [ ] No Tailwind classes
- [ ] ctx-dump run and HANDOFF.md updated
- [ ] Git commit made

---

## Quick Reference — Session Prompt Template

Copy this every time you start a new task:

```
You are developing "Tesifye" — an AI-native QA web platform.

Read these files IN ORDER before writing any code:
1. CLAUDE.md
2. ARCHITECTURE.md
3. SCHEMA.md
4. SCOPE.md
5. .agent/docs/README.md

Specific doc for this task: [.agent/docs/RELEVANT_FILE.md]

──────────────────────────────
TASK: [PASTE FULL HEAD PROMPT FROM PHASES.md TASK X.Y HERE]
──────────────────────────────

After completing the task:
1. Run: npx tsc --noEmit — fix all errors before reporting done
2. Verify each bullet in the acceptance test
3. Write test files alongside any new service/schema files
4. Report: "Task X.Y complete. Acceptance test results: [list each bullet with ✓ or ✗]"
```
