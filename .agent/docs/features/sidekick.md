# Feature 6: Sidekick Chat
Phase: 1 (UI, session-only) → Phase 2 (DB persistence) → Phase 5 (cross-session memory)

## What it does
Context-aware AI chat that knows the current project. Answers questions like "What test cases don't cover the payment flow?" or "Why did the UX score drop?". Sidekick is a **full page** — not a slide-in panel.

## Key files
- `src/components/features/SidekickPage.tsx` — full chat page (Phase 1)
- `src/components/shared/SimpleMarkdown.tsx` — lightweight regex-based markdown renderer
- `src/app/api/generate/chat/route.ts` — streaming chat route handler
- `src/lib/ai/context-budget.ts` — builds compressed project context for chat
- `src/app/dashboard/[projectId]/sidekick/page.tsx` — route

## Phase differences

| Aspect | Phase 1 (v0) | Phase 2 (v1) | Phase 5 (v2) |
|---|---|---|---|
| Memory | Session (React state only) | DB-persisted (chat_sessions table) | Cross-session + cross-project |
| Clear on refresh | Yes | No | No |
| Context | Current project summary | Current project + last 4 AI actions | Cross-project patterns |
| Model | reasoning_large | reasoning_large | reasoning_large |

## SidekickPage layout
- **Header:** "Sidekick" title + green live dot + "AI QA Assistant" label + model badge
- **Messages area:** flex-1, scrollable, with auto-scroll to bottom
- **Bubble types:**
  - User: right-aligned, `--accent-strong` border
  - Assistant: left-aligned, `.tf-card` style
- **Typing indicator:** 3-dot bounce animation (`.tf-typing-dot` keyframes)
- **Input area:** sticky bottom, textarea + Send button
- **Context line** below input: "Context: {project name} · {active feature}"
- **Suggested prompts** (shown when chat is empty — 4 chips):
  1. "Summarize test coverage"
  2. "What's missing from UX?"
  3. "Generate edge case ideas"
  4. "Explain the Gap findings"

## Context budget for chat
```
chat_system(1K) + project_summary(2K) + screen_maps(3K) + 
test_suite_summary(2K) + ux_score(500) + history(last 4 turns)(2K) + user_msg(1K)
= ~11.5K tokens max
```
Context built by `context-budget.ts` — never pass raw manifest_snapshot to chat.

## SimpleMarkdown.tsx
Lightweight regex-based inline markdown (no external dependency):
- `**bold**` → `<strong>`
- `*italic*` → `<em>`
- `` `code` `` → `<code>`
- Numbered lists
- Bullet lists

## Phase 2: DB persistence (chat_sessions table)
- On session start: `upsert` a `chat_sessions` row for this project
- Per message pair: `append` to `messages JSONB` array
- On page load: `fetch` messages from `chat_sessions` where `project_id = X`
- "Clear Chat" button: sets `messages = []`

## Gotchas
- Phase 1: page refresh clears chat — communicate this clearly in UI ("Chat history cleared on refresh")
- Phase 2: `chat_sessions` table has one row per project (upsert, not insert)
- The chat route uses `streamObject` returning `{ message: string }` — prose, not structured JSON
- Suggested prompts disappear once first message is sent
