# Phase 9: Supabase Auth Infrastructure - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up Supabase project, install packages, create auth client infrastructure, build sign-in page with magic link + OTP, add proxy.ts middleware for session refresh, protect routes, and create the initial database schema (tables for future phases). Users can sign in, stay signed in, sign out, and be redirected correctly.

This phase does NOT implement chat persistence, estimate saving, or sharing — it creates the foundation all those depend on.

</domain>

<decisions>
## Implementation Decisions

### Supabase Client Architecture
- **D-01:** Two client factories following `@supabase/ssr` pattern:
  - `src/lib/supabase/server.ts` — `createServerClient()` for Server Components and Route Handlers (reads cookies from `next/headers`)
  - `src/lib/supabase/client.ts` — `createBrowserClient()` singleton for Client Components
- **D-02:** Lazy initialization pattern (getter functions, not module-scope) to prevent build-time crashes when env vars aren't present
- **D-03:** Use `getUser()` (validates JWT) never `getSession()` (trusts cookie blindly) in all server code
- **D-04:** Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)

### Auth Method — Magic Link + OTP
- **D-05:** Single `signInWithOtp({ email })` call — Supabase sends one email containing BOTH a clickable magic link AND a 6-digit OTP code (configured via Supabase dashboard email template)
- **D-06:** Sign-in page shows email input first. After submission, show OTP entry field with a message: "Check your email — click the link or enter the code below"
- **D-07:** Magic link callback handled by `src/app/auth/callback/route.ts` (PKCE code exchange)
- **D-08:** OTP verified client-side via `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- **D-09:** OTP is the PRIMARY flow (immune to email link scanners like Proofpoint/Apple MPP that consume single-use magic links). Magic link is the convenience fallback.

### Proxy.ts (Session Middleware)
- **D-10:** Create `src/proxy.ts` (Next.js 16 naming, placed alongside `src/app/`)
- **D-11:** Calls `updateSession(request)` which internally calls `supabase.auth.getUser()` to refresh tokens
- **D-12:** MUST return the supabaseResponse object directly — never create a new `NextResponse.next()` (drops Set-Cookie headers)
- **D-13:** Sets `Cache-Control: private, no-store` on all responses that touch auth (prevents CDN cache poisoning)
- **D-14:** Matcher config: protect `/chat/:path*`, `/projects/:path*`, `/api/chat/:path*`. Exclude: `/`, `/auth/:path*`, `/share/:path*`, `/api/health`, `/api/cron/:path*`, `/_next/:path*`, `/favicon.ico`
- **D-15:** Unauthenticated users on protected routes → redirect to `/auth/sign-in?next={originalUrl}` (preserve intended destination)

### Sign-In Page Design
- **D-16:** Route: `/auth/sign-in` — Server Component wrapper + Client Component form
- **D-17:** Dark theme matching existing Nelo design (bg-surface, text-on-surface). Centered card layout.
- **D-18:** Flow: Nelo logo at top → "Sign in to Nelo" heading → email input → "Continue" button → (after submit) OTP 6-digit input appears below with "Check your email" message + resend link
- **D-19:** Error states: invalid email format, expired OTP, rate limited, network error — all shown inline below the relevant input
- **D-20:** After successful auth → redirect to `next` query param or `/projects` by default
- **D-21:** Bilingual — use existing `useLocale()` / `t()` for all strings

### Sign-Out Flow
- **D-22:** Sign out via `supabase.auth.signOut()` client-side
- **D-23:** Add user menu to header: small avatar circle (first letter of email) + dropdown with "Sign out" option
- **D-24:** After sign-out → redirect to `/` (landing page)
- **D-25:** On landing page, show "Sign in" button in header instead of user menu when not authenticated

### Auth Context (Client-Side)
- **D-26:** Create `src/lib/auth/context.tsx` — AuthProvider wrapping the app (mirrors the existing LocaleProvider pattern)
- **D-27:** `useAuth()` hook returns `{ user, loading, signOut }` — throws if used outside AuthProvider
- **D-28:** AuthProvider listens to `supabase.auth.onAuthStateChange()` for real-time session updates
- **D-29:** Add AuthProvider to `src/components/providers.tsx` (wraps LocaleProvider)

### Database Schema (Created Now, Used in Later Phases)
- **D-30:** Create tables via Supabase SQL migration (not ORM):
  - `projects` — id (uuid), user_id (uuid references auth.users), title (text), locale (text default 'es'), created_at, updated_at
  - `conversations` — id (uuid), project_id (uuid references projects), messages (jsonb default '[]'), project_inputs (jsonb default '{}'), updated_at
  - `estimates` — id (uuid), conversation_id (uuid references conversations), version (integer), label (text null), project_inputs (jsonb), result (jsonb), created_at
  - `share_links` — id (uuid), estimate_id (uuid references estimates), token (text unique), expires_at (timestamptz null), created_at
- **D-31:** RLS enabled on EVERY table from creation. Policies:
  - `projects`: user can CRUD own rows (`auth.uid() = user_id`)
  - `conversations`: user can CRUD via project ownership join
  - `estimates`: user can CRUD via conversation→project ownership join
  - `share_links`: user can CRUD own; anon can SELECT where token matches and not expired
- **D-32:** Floor plan storage: create private Supabase Storage bucket `floor-plans` with RLS (owner read/write only). Path convention: `{user_id}/{project_id}/{filename}`
- **D-33:** No data is written to these tables in Phase 9 — they're created and ready for Phase 10+

### Route Protection
- **D-34:** `/` (landing) — public, shows "Sign in" or user menu based on auth state
- **D-35:** `/auth/sign-in` — public, redirects to `/projects` if already signed in
- **D-36:** `/chat` and `/chat/[id]` — protected (redirect to sign-in)
- **D-37:** `/projects` — protected (redirect to sign-in)
- **D-38:** `/share/[token]` — public (no auth required, read-only via RLS)
- **D-39:** `/api/chat` — protected (return 401 if no valid user)
- **D-40:** `/api/health`, `/api/cron/*` — public

### Claude's Discretion
- Loading skeleton design for auth state check
- Exact spacing/typography within the sign-in card
- OTP input implementation (6 separate boxes vs. single input)
- Email validation approach (regex vs. Zod)
- Error message copy (as long as bilingual)

</decisions>

<specifics>
## Specific Ideas

- The sign-in page should feel minimal and professional — not a heavy form. Think Linear's login page: logo, one field, one button, clean.
- OTP entry should auto-advance between digit fields and auto-submit when all 6 digits are entered
- The user menu in header should be subtle — just a small circle with the first letter of the email, not a full profile section
- When proxy.ts redirects to sign-in, the loading state should be instant (no flash of protected content)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Supabase Auth Integration
- `.planning/research/STACK.md` — Package versions, SSR client patterns, env var names, what NOT to install
- `.planning/research/ARCHITECTURE.md` — System diagram, data flow, file structure, schema design
- `.planning/research/PITFALLS.md` §1-2 — Cookie mis-wiring in proxy.ts, CDN cache poisoning (critical)

### Existing Patterns to Mirror
- `src/lib/i18n/context.tsx` — AuthProvider should mirror this LocaleProvider pattern
- `src/lib/i18n/use-locale.ts` — useAuth() should mirror this hook pattern
- `src/components/providers.tsx` — Where AuthProvider gets added
- `src/components/header.tsx` — Where user menu / sign-in button goes

### Project Guidelines
- `CLAUDE.md` — Tech stack constraints (no Prisma/Drizzle, no Auth.js)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LocaleProvider` pattern (`src/lib/i18n/context.tsx`): exact template for AuthProvider — React Context, hook with error boundary, Provider component
- `src/components/providers.tsx`: simple wrapper, just add AuthProvider here
- Geist fonts already configured in layout.tsx
- shadcn/ui components available for form inputs, buttons, cards
- `nanoid` already in dependencies — use for share tokens later

### Established Patterns
- Client Components use `"use client"` directive — auth components will too
- Header is a client component with `useLocale()` — will also use `useAuth()`
- API routes read headers (e.g., `x-locale`) — will also read auth from Supabase server client
- Landing page is a client component with direct Link navigation

### Integration Points
- `src/components/providers.tsx` — add AuthProvider wrapping LocaleProvider
- `src/components/header.tsx` — add user menu / sign-in button
- `src/app/api/chat/route.ts` — add auth check at top of POST handler
- `src/app/layout.tsx` — no changes needed (Providers component handles it)
- New `src/proxy.ts` — doesn't exist yet, clean creation

</code_context>

<deferred>
## Deferred Ideas

- Chat persistence (onFinish + consumeStream) — Phase 10
- Project list page with history — Phase 11
- Estimate versioning and comparison — Phase 12
- Shareable estimate links — Phase 13
- Social login (Google/GitHub) — future milestone
- Custom SMTP (Resend/Postmark) for better deliverability — operational task, not code phase
- Anonymous-first UX (chat without signing in) — explicitly out of scope for v1.1

</deferred>

---

*Phase: 09-supabase-auth-infrastructure*
*Context gathered: 2026-03-22*
