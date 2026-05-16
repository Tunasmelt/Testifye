# Auth & Routing
Last updated: 2026-05-09

## Overview
Supabase SSR cookie-based auth. Email/password in Phase 1. Google OAuth route prepared but inactive. Middleware protects all `/dashboard/*` routes.

## Key files
- `src/lib/supabase/client.ts` — `createBrowserClient` (client components only)
- `src/lib/supabase/server.ts` — `createServerClient` with cookie handling (server components, route handlers)
- `src/middleware.ts` — protects `/dashboard/*`, redirects to `/login`
- `src/app/(auth)/login/page.tsx` — login form
- `src/app/(auth)/signup/page.tsx` — signup form
- `src/app/(auth)/callback/route.ts` — OAuth callback (prepared for Google)

## Patterns
- Sessions persist via cookies (not localStorage)
- On signup: DB trigger auto-creates `profiles` row for new `auth.users` entry
- Middleware uses `createServerClient` to validate session on every protected route

## Gotchas
- Never use `createBrowserClient` in server components or route handlers
- `server.ts` is marked `import 'server-only'` — will throw if accidentally imported client-side
- Google OAuth just needs Supabase Dashboard config — the callback route is already built

## Do not
- Store auth tokens in localStorage
- Use any client-side only session check for route protection — always use middleware
