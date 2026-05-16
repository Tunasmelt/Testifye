# Tesifye — Developer Workflow Guide

> **How to develop Tesifye task-by-task with any AI agent (Gemini, Claude, GPT, Cursor) and guarantee no gaps.**

---

## The Core Rule

**One task. One session. One acceptance test.**

Never ask an agent to build more than one PHASES.md task per session. The moment a session tries to cover Task 1.3 AND Task 1.4 together, it will skip the hard parts of one of them.

---

## Step 1 — The Session Opening Ritual (always do this)

Before ANY coding message, paste this block at the top of every new session:

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

Then commit:
```bash
git add .
git commit -m "feat: Task 1.X — [task name]"
git add .agent/ HANDOFF.md
git commit -m "ctx: session handoff [date]"
```

---

## The Full Task Sequence (Phase 1)

Work through these in strict order. Do not skip:

| # | Task | Prerequisite check |
|---|---|---|
| 1.1 | Project Scaffold | `npm run dev` works at localhost:3000 |
| 1.2 | Design System | Dark bg (#07070A) loads, fonts load, glassmorphic cards visible |
| 1.3 | Supabase Schema | All tables exist in Supabase dashboard, trigger fires on test insert |
| 1.4 | Auth Pages | Sign up creates a user in Supabase auth |
| 1.5 | Auth Middleware | `/dashboard` redirects to `/login` when signed out |
| 1.6 | Project CRUD + App Shell | All 10 sidebar items visible, breadcrumb updates |
| 1.7 | Image Upload | Upload a PNG, check IDB cache, check Supabase Storage |
| 1.8 | AI Providers | `MODEL_REGISTRY` accessible, no import errors |
| 1.9 | Context Budget | `buildContext()` returns ≤14K token estimate |
| 1.10 | Scout Stage | Upload screenshot → `vision_map` artifact in generated_artifacts |
| 1.11 | Generator Stage | Click "Generate" → streaming cards appear one by one |
| 1.12 | Judge Stage | After streaming → `is_verified: true` badge on cards |
| 1.13 | Rate Limit Queue | `rate-limit.store.ts` exists, Zustand provider in app |
| 1.14 | Fallback Chain | 429 from GROQ → falls back without crashing |
| 1.15 | Export Engine Page | Export sidebar nav item → 6 format cards + toggle switches |
| 1.16 | Generation Store | Partial recovery banner appears after simulated stream error |
| 1.17 | Manifest Snapshot | Generate test cases → `manifest_snapshot` JSON has updated `test_suite` key |
| 1.18 | Trigger Validation | Run SQL test from SCHEMA.md — trigger fires, manifest updates |
| 1.19 | Landing Page | All 11 sections render, CountUp animates, pricing page exists |
| 1.20 | Sidekick v0 | Chat message → streaming response, typing indicator shows |
| 1.21 | TweaksPanel | 3 themes change appearance, choice persists on refresh |

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

### Using Gemini CLI (this tool)
- You're already in the right place — this tool has access to the filesystem
- For each task, start a new conversation and paste the opening ritual + head prompt
- Use `/ctx-search` to find symbols before reading files

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

Each task should produce tests alongside the feature code. Use this rule:

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
- [ ] Relevant test file written alongside new service/schema files
- [ ] No hardcoded color hex values (must use CSS custom properties)
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
