# Auth & Routing
Last updated: 2026-11-08

## Overview
Supabase SSR cookie-based auth. Email/password in Phase 1 (done). Google OAuth callback route is prepared but unused (Task 5.1). Middleware protects `/dashboard/*`.

## Key files
- `src/lib/supabase/client.ts` — `createBrowserClient` (client components only)
- `src/lib/supabase/server.ts` — `createClient()` (async, `import 'server-only'`, anon key + cookies; server components / pages)
- `src/lib/supabase/admin.ts` — `createAdminClient()` (service role key, `server-only`, bypasses RLS)
- `src/middleware.ts` — refreshes the session on every matched request via `createServerClient`; redirects unauthenticated `/dashboard*` to `/login?redirect=<path>`; redirects signed-in users away from `/login` and `/signup` to `/dashboard`
- `src/app/(auth)/login/page.tsx` — `signInWithPassword`, honours `?redirect=` (relative paths only, `//` rejected)
- `src/app/(auth)/signup/page.tsx` — `signUp`; shows “check your email” when no session is returned
- `src/app/(auth)/callback/route.ts` — OAuth/PKCE code exchange; `?next=` sanitized against open redirect; failure → `/login?error=oauth_callback_failed`
- `src/app/(auth)/layout.tsx`

## Patterns
- Sessions persist via cookies (not localStorage).
- DB trigger `on_auth_user_created` auto-creates the `profiles` row.
- Almost every API route handler builds its own `createServerClient` inline (auth) and then `createAdminClient()` for DB access, scoping queries by `.eq('user_id', user.id)`. RLS is therefore bypassed in those routes — the explicit user_id filter is the guard. Keep it on every query.

## Callback URL (inconsistency to resolve)
- `(auth)` is a route group, so the real URL is **`/callback`**, not `/auth/callback`.
- ARCHITECTURE.md line ~400 still says `/auth/callback/route.ts`; PHASES.md Task 1.4 names `src/app/(auth)/callback/route.ts`. When Task 5.1 configures Google OAuth, set the Supabase redirect allow-list and `redirectTo` to `{origin}/callback`, or move the file to `src/app/auth/callback/route.ts` to match ARCHITECTURE.md. No code currently passes `redirectTo`/`emailRedirectTo`, so nothing exercises this yet. Needs a human decision.
- Middleware does not special-case `/callback`; it is not under `/dashboard` and not in the auth-route redirect list, so it is reachable.

## Gotchas
- Never use `createBrowserClient` in server components or route handlers.
- `server.ts` and `admin.ts` throw if imported client-side (`server-only`).
- Middleware matcher excludes only static assets/images; API routes run through it too (they still do their own `getUser()` check and return 401 JSON).
- Signup passes no `emailRedirectTo`; email-confirmation links use the Supabase project's Site URL.
- Google OAuth also needs Supabase Dashboard provider config; the sign-in button is not in the UI yet.

## Do not
- Store auth tokens in localStorage.
- Rely on client-side session checks for protection — middleware plus per-route `getUser()` only.
- Use `createAdminClient` without an explicit `user_id` ownership filter.
