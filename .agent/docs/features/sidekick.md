# Feature 6: Sidekick Chat
Phase: 1 (Task 1.20, session-only) → Phase 2 (Task 2.9, DB persistence — built) → Phase 5 (Task 5.7, v2 cross-session memory — not started)
Last updated: 2026-11-08

## Overview
Project-scoped QA chat. Full page (not a slide-in panel). Streams prose via `streamText`; messages are persisted per user+project in `chat_sessions`.

## Key files
- `src/app/dashboard/[projectId]/sidekick/page.tsx` — server page; auth check, loads project, renders chat
- `src/components/sidekick/SidekickChat.tsx` — chat UI, SSE reader, load/persist/clear calls
- `src/components/sidekick/SimpleMarkdown.tsx` — regex markdown renderer (bold, italic, code, numbered/bullet lists; no dependency)
- `src/app/api/generate/chat/route.ts` — streaming route (`streamText`, SSE)
- `src/app/api/chat/[projectId]/route.ts` — persistence (GET load, POST upsert, DELETE clear)
- `supabase/migrations/002_chat_sessions.sql` — `chat_sessions` table
- `supabase/migrations/003_fix_vision_map_latest_and_chat_unique.sql` — guarantees `UNIQUE (project_id, user_id)` (`chat_sessions_unique_active`) when 001 created the table first; **not yet applied to the live DB**

## Streaming route (`POST /api/generate/chat`)
- Body: `{ projectId, messages: [{role, content}] }`; last 50 messages are used (`MAX_CHAT_MESSAGES`).
- Uses Vercel AI SDK `streamText` (prose), NOT `streamObject`. `maxOutputTokens: 800`, `temperature: 0.5`, `maxDuration = 60`.
- SSE events: `{type:'delta', text}` … `{type:'done'}` | `{type:'error', message}`.
- Model: `getModel('reasoning_large', false)` directly — Groq only, bypasses `streamWithFallback`, so no Google fallback and no rate-limit/provider-chain handling.
- System prompt (built in the route) includes: project name, description, app type, platform, tester role, analyzed screen count, generated test case count, test-suite `coverage_summary` (if any), latest UX audit `overall_score` (if any). It does NOT include screen-map contents, finding details, or chat history summaries, and does NOT use `context-budget.ts`.
- Asks for concise markdown replies (2–4 short paragraphs).

## Persistence (`/api/chat/[projectId]`)
- GET → `{ messages, updatedAt }` for the active session. POST `{ messages }` → upsert on `(project_id, user_id)`, capped at last 200 messages. DELETE → clear.
- The client loads on mount, POSTs the full message array after each exchange (shows saving/saved state), DELETEs on “Clear”.
- Table: one row per project per user (`UNIQUE(project_id, user_id)` — may be missing if 001 ran first, see database.md), `messages JSONB`, `is_active`, RLS own-rows.

## UI
- Four preset chips when empty: “Summarize test coverage”, “What's missing from UX?”, “Generate edge case ideas”, “Explain the Gap findings”.
- Typing indicator via `.tf-typing-dot`; footer text “Context: {project} · Enter to send, Shift+Enter newline”; Clear button.

## Phase table

| Aspect | Phase 1 (v0) | Phase 2 (built) | Phase 5 (v2, not started) |
|---|---|---|---|
| Memory | React state | `chat_sessions` per project/user | Cross-session + cross-project |
| Survives refresh | No | Yes | Yes |
| Context | project summary | project summary + counts + coverage + UX score | cross-project patterns |

## Gotchas
- Assistant text is plain markdown prose, not `{ message }` JSON.
- Persist POST replaces the whole array (client sends everything), so concurrent tabs overwrite each other (last write wins).
- `/api/chat/[projectId]` GET/POST/DELETE call `ownsProject(projectId, user.id)` (admin client, checks `projects.user_id`) and return 404 if the project is not owned. Fixed; type-checked, no automated test.
- The upsert needs the `UNIQUE (project_id, user_id)` constraint; on a DB where 001 ran before 002 it exists only after migration 003 is applied (not yet applied).
- Route handler is long (context building inline) — violates thin-route rule; chat bypasses fallback layer.
- Page `<title>` says “Testifye”.

## Do not
- Do not switch this route to `streamObject`.
- Do not pass raw `manifest_snapshot` into the chat prompt.
