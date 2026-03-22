---
phase: 09-supabase-auth-infrastructure
plan: 01
subsystem: auth
tags: [supabase, supabase-ssr, next-js-16, proxy, middleware, cookie-auth, rls, postgres, migrations]

requires: []
provides:
  - "@supabase/ssr browser client factory (createBrowserClient singleton)"
  - "Server Supabase client factory (createServerClient + next/headers cookies)"
  - "proxy.ts updateSession helper with token refresh and Cache-Control headers"
  - "src/proxy.ts with route protection: /chat, /projects, /api/chat require auth"
  - "Database schema for projects, conversations, estimates, share_links with RLS"
  - "Private storage bucket floor-plans with user-scoped RLS policies"
affects:
  - "09-02 — AuthProvider will import createClient from browser client factory"
  - "09-03 — Sign-in page depends on client factory for auth calls"
  - "10-chat-persistence — Route handler uses server client factory"
  - "11-project-list — Server Component uses server client factory"

tech-stack:
  added:
    - "@supabase/supabase-js ^2.99.3 — Supabase JS client"
    - "@supabase/ssr ^0.9.0 — Cookie-based session management for Next.js"
    - "supabase ^2.83.0 (devDep) — CLI for migrations and local dev"
  patterns:
    - "Two-factory pattern: browser factory (client.ts) + server factory (server.ts)"
    - "Proxy pattern: src/proxy.ts calls updateSession, never creates new NextResponse"
    - "getUser() not getSession() — JWT validation on every server-side auth check"
    - "Cache-Control: private, no-store on all auth-touching responses"

key-files:
  created:
    - "src/lib/supabase/client.ts — Browser Supabase client factory (singleton via createBrowserClient)"
    - "src/lib/supabase/server.ts — Async server Supabase client factory (createServerClient + cookies)"
    - "src/lib/supabase/proxy.ts — updateSession helper: token refresh + Cache-Control"
    - "src/proxy.ts — Next.js 16 proxy with route protection and redirect logic"
    - "src/lib/supabase/__tests__/client.test.ts — 7 tests for browser + server client factories"
    - "src/lib/supabase/__tests__/proxy.test.ts — 13 tests for updateSession + route protection"
    - "supabase/config.toml — Supabase CLI project config"
    - "supabase/migrations/0001_initial_schema.sql — 4 tables + RLS + floor-plans storage bucket"
    - ".env.local.example — Template with NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY"
  modified:
    - "package.json — Added @supabase/supabase-js, @supabase/ssr, supabase CLI"

key-decisions:
  - "Use getUser() not getSession() in all server code (D-03) — validates JWT, cannot be spoofed"
  - "proxy.ts (not middleware.ts) follows Next.js 16 naming convention"
  - "Always return supabaseResponse from updateSession — never create a new NextResponse.next()"
  - "Test assertions use URL-encoded next param (%2Fchat) matching actual URL.searchParams behavior"
  - ".env.local.example force-added to git despite .env* gitignore pattern (intentional template)"

patterns-established:
  - "Server factory pattern: async createClient() with try/catch in setAll for RSC compatibility"
  - "Proxy route protection: check pathname prefix array, redirect to /auth/sign-in?next=pathname"
  - "matcher excludes: _next/static, _next/image, favicon.ico, share/, auth/, api/health, api/cron/"

requirements-completed: [AUTH-02, AUTH-03]

duration: 5min
completed: 2026-03-22
---

# Phase 09 Plan 01: Supabase Infrastructure Summary

**Cookie-based Supabase auth infrastructure with @supabase/ssr client factories, Next.js 16 proxy.ts with route protection, and database migration for projects/conversations/estimates/share_links with RLS**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T05:48:32Z
- **Completed:** 2026-03-22T05:53:23Z
- **Tasks:** 3 completed
- **Files modified:** 9 created, 1 modified

## Accomplishments

- Browser and server Supabase client factories using @supabase/ssr cookie pattern, 7 unit tests passing
- proxy.ts session middleware with token refresh via getUser() and route protection (20 unit tests passing)
- Database migration SQL with 4 tables, RLS enabled on all, plus private floor-plans storage bucket

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Supabase packages, create client factories, env template** - `75487a9` (feat)
2. **Task 2: Create proxy.ts with updateSession and route protection** - `5c91197` (feat)
3. **Task 3: Create database migration SQL and initialize Supabase config** - `d7c9890` (feat)

_Note: TDD tasks — tests written first (RED), then implementation (GREEN)_

## Files Created/Modified

- `src/lib/supabase/client.ts` - Browser singleton factory via createBrowserClient
- `src/lib/supabase/server.ts` - Async server factory via createServerClient + next/headers cookies
- `src/lib/supabase/proxy.ts` - updateSession: creates supabaseResponse, calls getUser(), sets Cache-Control
- `src/proxy.ts` - Route protection: /chat, /projects, /api/chat require auth; redirects to /auth/sign-in?next=
- `src/lib/supabase/__tests__/client.test.ts` - 7 tests for both client factories
- `src/lib/supabase/__tests__/proxy.test.ts` - 13 tests for updateSession and proxy route logic
- `supabase/config.toml` - Supabase CLI config (from npx supabase init)
- `supabase/migrations/0001_initial_schema.sql` - 4 tables + 5 policies + storage bucket
- `.env.local.example` - Template with all 3 required env vars
- `package.json` - Added @supabase/supabase-js, @supabase/ssr, supabase CLI

## Decisions Made

- `getUser()` always used instead of `getSession()` — validates JWT against Supabase auth server, cannot be spoofed by cookie manipulation (D-03)
- `src/proxy.ts` at src root (not `middleware.ts`) per Next.js 16 naming convention (D-10)
- `supabaseResponse` always returned from `updateSession`, never a new `NextResponse.next()` — preserving Set-Cookie headers for token refresh (D-12)
- Test assertions for redirect URL match URL-encoded format (`%2Fchat`) — this is the actual behavior of `URL.searchParams.set()`, tests verify the real behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed proxy.test.ts assertions to match URL-encoded redirect params**
- **Found during:** Task 2 (proxy tests GREEN phase)
- **Issue:** Test asserted `?next=/chat` but `URL.searchParams.set("next", "/chat")` produces `?next=%2Fchat` — URL encoding is standard behavior
- **Fix:** Updated test assertions to use `stringMatching` with regex for URL-encoded paths
- **Files modified:** `src/lib/supabase/__tests__/proxy.test.ts`
- **Verification:** All 13 proxy tests pass
- **Committed in:** `5c91197` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug in test assertion)
**Impact on plan:** Test assertion fixed to match actual correct behavior. Implementation is correct; the test was wrong.

## Issues Encountered

- `.env.local.example` was blocked by `.gitignore` pattern `.env*` — added with `git add -f` since it is an intentional template file for developer onboarding, not a secret.
- Package.json/supabase files appeared in a parallel agent's commit (`699878c`) but were correctly installed before this plan's task commits.

## User Setup Required

To use Supabase auth, the developer must:
1. Create a Supabase project at https://supabase.com
2. Copy `.env.local.example` to `.env.local`
3. Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from the Supabase dashboard
4. Run the migration: `npx supabase db push` or apply manually in Supabase SQL Editor

## Next Phase Readiness

- Client factories importable: `import { createClient } from "@/lib/supabase/client"` and `"@/lib/supabase/server"`
- proxy.ts ready: export `proxy` and `config` with correct matcher for Next.js 16
- Database schema ready for Phase 10+ (tables exist, RLS enforced, no data written yet)
- Blocker from STATE.md: `@supabase/ssr` not officially tested on Next.js 16 — validate token refresh in first integration test before building protected routes on top

---
*Phase: 09-supabase-auth-infrastructure*
*Completed: 2026-03-22*

## Self-Check: PASSED

All files verified present. All commits verified in git log.

| Check | Result |
|-------|--------|
| src/lib/supabase/client.ts | FOUND |
| src/lib/supabase/server.ts | FOUND |
| src/lib/supabase/proxy.ts | FOUND |
| src/proxy.ts | FOUND |
| supabase/config.toml | FOUND |
| supabase/migrations/0001_initial_schema.sql | FOUND |
| .env.local.example | FOUND |
| commit 75487a9 | FOUND |
| commit 5c91197 | FOUND |
| commit d7c9890 | FOUND |
