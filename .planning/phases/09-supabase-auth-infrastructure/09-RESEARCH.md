# Phase 9: Supabase Auth Infrastructure - Research

**Researched:** 2026-03-22
**Domain:** Supabase Auth + Next.js 16 proxy.ts + @supabase/ssr cookie-based sessions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Two client factories following `@supabase/ssr` pattern:
  - `src/lib/supabase/server.ts` — `createServerClient()` for Server Components and Route Handlers (reads cookies from `next/headers`)
  - `src/lib/supabase/client.ts` — `createBrowserClient()` singleton for Client Components
- **D-02:** Lazy initialization pattern (getter functions, not module-scope) to prevent build-time crashes when env vars aren't present
- **D-03:** Use `getUser()` (validates JWT) never `getSession()` (trusts cookie blindly) in all server code
- **D-04:** Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- **D-05:** Single `signInWithOtp({ email })` call — Supabase sends one email with BOTH a clickable magic link AND a 6-digit OTP code
- **D-06:** Sign-in page shows email input first, then OTP entry field after submission
- **D-07:** Magic link callback at `src/app/auth/callback/route.ts` (PKCE code exchange)
- **D-08:** OTP verified client-side via `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- **D-09:** OTP is the PRIMARY flow; magic link is the convenience fallback
- **D-10:** Create `src/proxy.ts` (Next.js 16 naming, placed alongside `src/app/`)
- **D-11:** Calls `updateSession(request)` which internally calls `supabase.auth.getUser()` to refresh tokens
- **D-12:** MUST return the supabaseResponse object directly — never create a new `NextResponse.next()`
- **D-13:** Sets `Cache-Control: private, no-store` on all responses that touch auth
- **D-14:** Matcher config: protect `/chat/:path*`, `/projects/:path*`, `/api/chat/:path*`. Exclude: `/`, `/auth/:path*`, `/share/:path*`, `/api/health`, `/api/cron/:path*`, `/_next/:path*`, `/favicon.ico`
- **D-15:** Unauthenticated users on protected routes redirect to `/auth/sign-in?next={originalUrl}`
- **D-16:** Route: `/auth/sign-in` — Server Component wrapper + Client Component form
- **D-17:** Dark theme matching existing Nelo design (bg-surface, text-on-surface). Centered card layout.
- **D-18:** Flow: Nelo logo → "Sign in to Nelo" → email input → "Continue" → OTP 6-digit input + "Check your email" + resend link
- **D-19:** Error states: invalid email format, expired OTP, rate limited, network error — all shown inline
- **D-20:** After successful auth → redirect to `next` query param or `/projects` by default
- **D-21:** Bilingual — use existing `useLocale()` / `t()` for all strings
- **D-22:** Sign out via `supabase.auth.signOut()` client-side
- **D-23:** Add user menu to header: small avatar circle (first letter of email) + dropdown with "Sign out" option
- **D-24:** After sign-out → redirect to `/` (landing page)
- **D-25:** On landing page, show "Sign in" button in header instead of user menu when not authenticated
- **D-26:** Create `src/lib/auth/context.tsx` — AuthProvider wrapping the app
- **D-27:** `useAuth()` hook returns `{ user, loading, signOut }` — throws if used outside AuthProvider
- **D-28:** AuthProvider listens to `supabase.auth.onAuthStateChange()` for real-time session updates
- **D-29:** Add AuthProvider to `src/components/providers.tsx` (wraps LocaleProvider)
- **D-30:** Create tables via Supabase SQL migration: `projects`, `conversations`, `estimates`, `share_links`
- **D-31:** RLS enabled on EVERY table from creation with ownership-based policies
- **D-32:** Floor plan storage: create private Supabase Storage bucket `floor-plans` with RLS
- **D-33:** No data is written to these tables in Phase 9 — created and ready for Phase 10+
- **D-34 through D-40:** Route protection matrix — `/` public, `/auth/sign-in` public, `/chat` protected, `/projects` protected, `/share/[token]` public, `/api/chat` protected, `/api/health` and `/api/cron/*` public

### Claude's Discretion

- Loading skeleton design for auth state check
- Exact spacing/typography within the sign-in card
- OTP input implementation (6 separate boxes vs. single input)
- Email validation approach (regex vs. Zod)
- Error message copy (as long as bilingual)

### Deferred Ideas (OUT OF SCOPE)

- Chat persistence (onFinish + consumeStream) — Phase 10
- Project list page with history — Phase 11
- Estimate versioning and comparison — Phase 12
- Shareable estimate links — Phase 13
- Social login (Google/GitHub) — future milestone
- Custom SMTP (Resend/Postmark) for better deliverability — operational task, not code phase
- Anonymous-first UX (chat without signing in) — explicitly out of scope for v1.1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign in via email with magic link (clickable) and OTP (6-digit code) in the same email | `signInWithOtp()` sends both; PKCE callback handles magic link; `verifyOtp()` handles OTP code client-side |
| AUTH-02 | User session persists across browser refresh via cookie-based auth tokens | `@supabase/ssr` cookie pattern + `proxy.ts` `updateSession()` refreshes tokens on every request |
| AUTH-03 | Protected routes (/chat, /projects) redirect unauthenticated users to sign-in | `proxy.ts` matcher with `supabase.auth.getUser()` check + redirect to `/auth/sign-in?next=` |
| AUTH-04 | User can sign out, clearing session and redirecting to landing page | `supabase.auth.signOut()` client-side + router.push('/') |
</phase_requirements>

---

## Summary

Phase 9 installs Supabase Auth into the existing Next.js 16 Nelo app using the `@supabase/ssr` package for cookie-based sessions. The two-client pattern (browser singleton + per-request server client) is the required architecture for App Router. The critical integration point is `src/proxy.ts` — Next.js 16's renamed middleware file — which refreshes auth tokens on every request.

Two important version facts to lock in before writing any code: (1) `@supabase/ssr` is now at **0.9.0** (STACK.md cited 0.8.1 — no breaking changes, but install the current version). (2) Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function name changes from `middleware` to `proxy`. All Supabase examples referencing `middleware.ts` must be adapted accordingly.

The auth method — `signInWithOtp()` — is a single API call that sends an email containing both a magic link and a 6-digit OTP. The OTP is the primary flow because it is immune to email link scanners (Proofpoint, Apple MPP) that consume single-use magic links before the user clicks them. The magic link callback requires a PKCE code exchange route at `/auth/callback`. The database schema (four tables) is created in this phase but intentionally left unwritten until Phase 10+.

**Primary recommendation:** Build in this order — (1) install packages + env vars, (2) Supabase client factories, (3) `proxy.ts` with `updateSession`, (4) auth callback route, (5) sign-in page UI, (6) AuthProvider + header user menu, (7) database migration SQL. Validate middleware token refresh works end-to-end before building any protected page UI on top of it.

---

## Standard Stack

### Core (New Additions Only)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.99.3 | Supabase JS client — auth, database queries, storage | Official Supabase client; v2 is current stable major |
| `@supabase/ssr` | ^0.9.0 | Cookie-based auth for Next.js App Router — `createServerClient`, `createBrowserClient` | Replaces deprecated `@supabase/auth-helpers-nextjs`; PKCE by default; supports Node.js runtime |
| `supabase` (CLI) | latest | Local dev stack, migrations, type generation | `npm install -D supabase`; manages Docker-based local Supabase |

**Verified versions (2026-03-22):**
- `@supabase/supabase-js`: 2.99.3 (confirmed via `npm view`)
- `@supabase/ssr`: 0.9.0 (confirmed via `npm view`)

### What NOT to Install

| Avoid | Why |
|-------|-----|
| `@supabase/auth-helpers-nextjs` | Deprecated; replaced by `@supabase/ssr` |
| `next-auth` / `Auth.js` | Adds a conflicting auth layer; Supabase Auth handles magic link + OTP natively |
| Prisma / Drizzle | CLAUDE.md explicitly prohibits ORMs |
| `nanoid` | Already in `package.json` — do not re-install |

### Installation

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D supabase
```

### Environment Variables (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Note: Supabase recently introduced `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as an alias for the anon key. Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` — this is the name in all existing templates and official tutorials.

---

## Architecture Patterns

### Recommended Project Structure (New Files Only)

```
src/
├── proxy.ts                          # Next.js 16 session proxy — token refresh + route protection
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient singleton (Client Components)
│   │   ├── server.ts                 # createServerClient per-request (Server Components, Route Handlers)
│   │   └── proxy.ts                  # updateSession helper called by src/proxy.ts
│   │
│   └── auth/
│       └── context.tsx               # AuthProvider + useAuth() hook (mirrors LocaleProvider pattern)
│
├── components/
│   └── providers.tsx                 # MODIFIED: wrap AuthProvider around LocaleProvider
│   └── header.tsx                    # MODIFIED: add user menu / sign-in button
│
└── app/
    └── auth/
        ├── sign-in/
        │   └── page.tsx              # Server Component wrapper + Client Component form
        └── callback/
            └── route.ts             # PKCE magic link code exchange (GET handler)
```

### Database Migration

```
supabase/
└── migrations/
    └── 0001_initial_schema.sql       # projects, conversations, estimates, share_links + RLS
```

---

### Pattern 1: Next.js 16 proxy.ts with @supabase/ssr

**What:** The `proxy.ts` file (Next.js 16 renamed from `middleware.ts`) handles token refresh on every request. The key difference from Next.js 15: the exported function must be named `proxy`, not `middleware`. Supabase's `updateSession` helper is called from a separate utility file at `src/lib/supabase/proxy.ts`.

**Critical constraint (D-12):** Always return the `supabaseResponse` object from `updateSession`. Never create a new `NextResponse.next()` — doing so drops the `Set-Cookie` headers that carry the refreshed token.

**src/lib/supabase/proxy.ts** — the `updateSession` helper:

```typescript
// Source: Supabase official SSR docs + Next.js 16 proxy.ts naming
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: use getUser() not getSession() — validates JWT with Supabase auth server
  const { data: { user } } = await supabase.auth.getUser()

  // Prevent CDN cache poisoning (D-13)
  supabaseResponse.headers.set('Cache-Control', 'private, no-store')

  return { supabaseResponse, user }
}
```

**src/proxy.ts** — the main proxy file with route protection:

```typescript
// Source: Next.js 16 proxy.ts docs (function named 'proxy', not 'middleware')
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  // D-15: redirect unauthenticated users to sign-in preserving intended destination
  const { pathname } = request.nextUrl
  const isProtected =
    pathname.startsWith('/chat') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/api/chat')

  if (!user && isProtected) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // D-35: redirect already-signed-in users away from sign-in page
  if (user && pathname.startsWith('/auth/sign-in')) {
    return NextResponse.redirect(new URL('/projects', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // D-14: run on all routes EXCEPT static assets and excluded paths
    '/((?!_next/static|_next/image|favicon.ico|share/|auth/|api/health|api/cron/).*)',
  ],
}
```

### Pattern 2: Supabase Client Factories (D-01, D-02)

**What:** Two factory functions — browser singleton for Client Components, per-request server client for Server Components and Route Handlers. Both are function calls (not module-scope singletons) to prevent session leaks on Vercel's warm instances.

**src/lib/supabase/client.ts:**

```typescript
// Source: Supabase @supabase/ssr docs — createBrowserClient
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // createBrowserClient already uses singleton pattern internally
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**src/lib/supabase/server.ts:**

```typescript
// Source: Supabase @supabase/ssr docs — createServerClient
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies — proxy.ts handles the refresh
          }
        },
      },
    }
  )
}
```

### Pattern 3: Magic Link + OTP Auth Flow (D-05 through D-09)

**What:** `signInWithOtp({ email })` sends a single email with BOTH the magic link and the 6-digit OTP. The magic link is handled server-side via PKCE callback; the OTP is verified client-side.

**Sending OTP (sign-in form action):**

```typescript
// Source: Supabase passwordless email docs
const supabase = createClient() // browser client
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

**PKCE callback route — src/app/auth/callback/route.ts (D-07):**

```typescript
// Source: Supabase PKCE flow docs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/projects'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) =>
            cs.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            ),
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=callback_failed`)
}
```

**OTP verification (client-side, D-08):**

```typescript
// Source: Supabase passwordless email docs
const supabase = createClient() // browser client
const { error } = await supabase.auth.verifyOtp({
  email,
  token: otpCode, // 6-digit string entered by user
  type: 'email',
})
if (!error) {
  router.push(nextParam ?? '/projects')
}
```

### Pattern 4: AuthProvider (mirrors LocaleProvider, D-26 through D-29)

**What:** AuthProvider wraps the app in `src/components/providers.tsx`, listens to `onAuthStateChange`, and exposes `{ user, loading, signOut }` via `useAuth()`.

**src/lib/auth/context.tsx:**

```typescript
// Source: mirrors src/lib/i18n/context.tsx pattern
"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
  }, [supabase, router])

  const value = useMemo(
    () => ({ user, loading, signOut }),
    [user, loading, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

**Updated src/components/providers.tsx (D-29):**

```typescript
"use client"

import { LocaleProvider } from '@/lib/i18n/context'
import { AuthProvider } from '@/lib/auth/context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </AuthProvider>
  )
}
```

### Pattern 5: Database Migration SQL (D-30 through D-32)

**What:** The schema matches CONTEXT.md D-30 exactly. Note: CONTEXT.md uses `conversations` (not `messages`/`chats` as the ARCHITECTURE.md baseline). The CONTEXT.md schema is the locked decision for this phase.

```sql
-- Source: CONTEXT.md D-30, D-31, D-32

-- Projects
CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'New Project',
  locale     TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Conversations
CREATE TABLE conversations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  messages       JSONB NOT NULL DEFAULT '[]'::jsonb,
  project_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estimates
CREATE TABLE estimates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  version        INTEGER NOT NULL,
  label          TEXT,
  project_inputs JSONB NOT NULL,
  result         JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Share links
CREATE TABLE share_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: enable on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Projects: owner CRUD
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Conversations: access via project ownership
CREATE POLICY "users_access_conversations" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

-- Estimates: access via conversation -> project ownership
CREATE POLICY "users_access_estimates" ON estimates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN projects p ON p.id = c.project_id
      WHERE c.id = conversation_id AND p.user_id = auth.uid()
    )
  );

-- Share links: owner CRUD
CREATE POLICY "users_manage_share_links" ON share_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM estimates e
      JOIN conversations c ON c.id = e.conversation_id
      JOIN projects p ON p.id = c.project_id
      WHERE e.id = estimate_id AND p.user_id = auth.uid()
    )
  );

-- Share links: anon SELECT where token matches and not expired (D-31)
CREATE POLICY "anon_read_valid_share_links" ON share_links
  FOR SELECT USING (
    token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Storage bucket: floor-plans (private, owner RLS)
-- Run in Supabase dashboard or via migration:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('floor-plans', 'floor-plans', false);

CREATE POLICY "users_upload_floor_plans" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'floor-plans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_read_floor_plans" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'floor-plans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Pattern 6: Protecting the Chat API Route (D-39)

**What:** Add an auth check at the top of the existing `POST` handler in `src/app/api/chat/route.ts`.

```typescript
// Add to top of existing POST handler in src/app/api/chat/route.ts
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // Auth check (add before existing validation)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... rest of existing handler unchanged ...
}
```

### Anti-Patterns to Avoid

- **Return `new NextResponse.next()` from proxy.ts:** Drops Supabase `Set-Cookie` headers. Session never refreshes. Always return the `supabaseResponse` object from `updateSession`.
- **Use `getSession()` in server code:** Trusts cookie blindly without JWT revalidation. Can be spoofed. Always use `getUser()` server-side.
- **Initialize Supabase client at module scope in server files:** Causes session leaks under Vercel's warm instance reuse. Client must be created inside each request handler.
- **Export `middleware` function from proxy.ts:** Next.js 16 requires the export to be named `proxy`. The file is `src/proxy.ts` (not `src/middleware.ts`).
- **Apply auth matcher to `/share/**`:** Share pages are public. Protecting them defeats the sharing feature. Exclude from matcher; RLS is the security boundary.
- **Cache authenticated responses:** Set `Cache-Control: private, no-store` on all responses that touch auth state. Without this, Vercel Edge Network can serve one user's session to another.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based JWT sessions | Custom cookie management | `@supabase/ssr` `createServerClient` / `createBrowserClient` | Token refresh timing, PKCE, secure cookie attributes are all handled; manual implementation will have subtle security bugs |
| Magic link + OTP email | Custom email with nodemailer | `supabase.auth.signInWithOtp()` | Supabase handles rate limiting, expiry, PKCE code generation, email templates |
| JWT validation in proxy | Custom JWT decode + verify | `supabase.auth.getUser()` in updateSession | Validates against Supabase's published public keys; handles key rotation |
| Auth state synchronization | Custom polling or localStorage | `supabase.auth.onAuthStateChange()` | Real-time broadcast channel; handles tab visibility, token refresh events |
| PKCE code exchange | Custom OAuth code verifier | `supabase.auth.exchangeCodeForSession(code)` | PKCE implementation requires cryptographic verifier; single-use enforcement built in |

---

## Common Pitfalls

### Pitfall 1: Wrong Export Name in proxy.ts
**What goes wrong:** Exporting `export function middleware()` or `export default function()` in `proxy.ts`. Next.js 16 requires `export function proxy()`. The middleware will silently not run.
**Why it happens:** All Supabase examples and docs still use `middleware.ts` naming. Next.js 16 is recent.
**How to avoid:** File is `src/proxy.ts`. Export is `export async function proxy(request: NextRequest)`. Config export remains `export const config = { matcher: [...] }`.
**Warning signs:** Protected routes are accessible without auth; no `Set-Cookie` on responses.

### Pitfall 2: Returning New NextResponse Instead of supabaseResponse
**What goes wrong:** `return NextResponse.next()` discards the refreshed auth cookie. User appears logged in (React state from onAuthStateChange) but every server-side `getUser()` call returns null after the initial token expires (~1 hour).
**Why it happens:** Developers add routing logic after `updateSession` and create a new response object for the redirect or pass-through, discarding the Supabase response.
**How to avoid:** Only return `supabaseResponse` or a redirect. When redirecting, redirect from the original `supabaseResponse` to preserve cookies, OR accept that redirects don't need to carry the refreshed cookie (redirect happens before the page load that needs it).
**Warning signs:** Auth works on page load, breaks silently ~1 hour later; RLS queries return empty.

### Pitfall 3: Schema Mismatch Between CONTEXT.md and ARCHITECTURE.md
**What goes wrong:** ARCHITECTURE.md uses a `chats`/`messages` schema; CONTEXT.md (locked decisions) uses `projects`/`conversations`/`estimates`/`share_links`. These are different designs. Using the ARCHITECTURE.md schema will break Phases 10–13 which are designed around the CONTEXT.md schema.
**Why it happens:** ARCHITECTURE.md was written before CONTEXT.md decisions were finalized.
**How to avoid:** Use ONLY the CONTEXT.md D-30 schema for migration SQL. The ARCHITECTURE.md schema is superseded.

### Pitfall 4: CDN Cache Poisoning (Pitfall 2 from PITFALLS.md)
**What goes wrong:** A response that sets `Set-Cookie` gets cached by Vercel Edge Network and served to other users. User A's session cookie goes to User B.
**Why it happens:** Next.js 16 routes are dynamic by default, but edge caching can still capture the first response.
**How to avoid:** In `updateSession`, set `supabaseResponse.headers.set('Cache-Control', 'private, no-store')` before returning. Do not use `export const revalidate = N` on any page that reads auth state.

### Pitfall 5: Module-Scope Supabase Client on Server (Pitfall 3 from PITFALLS.md)
**What goes wrong:** `const supabase = createClient()` at the top of a server file (outside a handler). Vercel warm instances reuse the module — User A's cookie state leaks to User B's request.
**Why it happens:** Looks identical to the safe browser singleton pattern.
**How to avoid:** `createClient()` calls must be inside the Route Handler or Server Component function body. The browser client's singleton is safe (it uses the browser's own cookie storage); the server client must be per-request.

### Pitfall 6: OTP Email Rate Limit in Development
**What goes wrong:** Supabase free tier limits OTP emails to 2 per hour. Testing the sign-in flow rapidly will trigger rate limits, making development painful.
**Why it happens:** Supabase default SMTP is shared and rate-limited.
**How to avoid:** Use the Supabase local development stack (`npx supabase start`) which has no email rate limits. Local Studio at `http://localhost:54323` shows sent OTP codes directly in the Auth section — no email needed for development.
**Warning signs:** `Email rate limit exceeded` error from `signInWithOtp()`.

---

## Code Examples

### Checking Auth in a Protected Server Component Page

```typescript
// Source: Supabase SSR docs — server-side auth check
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in?next=/projects')
  }

  return <div>Welcome {user.email}</div>
}
```

### Sign-Out in Header

```typescript
// Source: mirrors useLocale() hook pattern in src/lib/i18n/use-locale.ts
"use client"
import { useAuth } from '@/lib/auth/context'

export function Header({ projectName }: { projectName?: string }) {
  const { user, signOut } = useAuth()
  // ...
  return (
    <header>
      {/* existing header content */}
      {user ? (
        <button onClick={signOut} className="...">
          {user.email?.[0].toUpperCase()}  {/* avatar circle */}
        </button>
      ) : (
        <Link href="/auth/sign-in">Sign in</Link>
      )}
    </header>
  )
}
```

### Local Development Setup

```bash
# Initialize Supabase (creates supabase/ directory with config.toml)
npx supabase init

# Start local stack (requires Docker) — provides local auth with no email rate limits
npx supabase start

# Apply migrations
npx supabase db push

# Generate TypeScript types from schema
npx supabase gen types typescript --local > src/lib/database.types.ts

# Stop local stack
npx supabase stop

# For local dev, set in .env.local:
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Old package is deprecated; all new projects use `@supabase/ssr` |
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js v16.0.0 | File must be renamed; function export name must change |
| Edge runtime middleware | Node.js runtime proxy (default) | Next.js v15.5.0 stable | Node.js APIs now available in proxy; Supabase SSR works without workarounds |
| `getSession()` for server-side auth | `getUser()` (validates JWT) / `getClaims()` | 2024 (Supabase security advisory) | `getSession()` is explicitly deprecated for server use; can be spoofed |
| `@supabase/ssr` v0.8.1 | v0.9.0 | 2026-03-02 | No breaking changes; v0.9.0 adds release workflow improvements |

**Deprecated / outdated:**
- `supabase.auth.getSession()` in server code: use `getUser()` instead — official Supabase docs say "Never trust `getSession()` inside server code"
- `@supabase/auth-helpers-nextjs`: fully deprecated, removed from Supabase docs
- `export function middleware()` in `src/middleware.ts`: deprecated in Next.js 16; use `export function proxy()` in `src/proxy.ts`

---

## Open Questions

1. **`@supabase/ssr` official Next.js 16 validation**
   - What we know: SSR package is tested against Next.js 14+; proxy.ts (Node.js runtime) removes all prior Edge runtime compat issues
   - What's unclear: No official Supabase statement confirming v0.9.0 + Next.js 16.2 is fully validated
   - Recommendation: Write a smoke test for middleware token refresh (OTP → callback → protected page load → refresh → still authed) as the first integration test before building protected pages on top of it. STATE.md explicitly flags this as a concern.

2. **`supabase.auth.getClaims()` vs `getUser()`**
   - What we know: PITFALLS.md references `getClaims()` as more secure; STACK.md uses `getUser()`; official Supabase docs consistently reference `getUser()`
   - What's unclear: Whether `getClaims()` is a GA method or experimental/internal
   - Recommendation: Use `getUser()` — it is the consistently documented method. `getClaims()` may be newer; research before using it.

3. **Storage bucket creation in migration SQL**
   - What we know: `INSERT INTO storage.buckets` works in Supabase migrations; dashboard creation is also valid
   - What's unclear: Whether the bucket insert works reliably in local dev migration vs. remote
   - Recommendation: Include bucket creation SQL in migration but also document dashboard steps as fallback. Test with `npx supabase db push` locally first.

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest v4.1.0 |
| Config file | `/Users/nico/dev/arqui/vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

**Vitest limitation:** Cannot test async Server Components or Route Handlers. Proxy (middleware) integration must be validated manually or with Playwright.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `signInWithOtp()` sends OTP + magic link; `verifyOtp()` succeeds with valid code | manual (requires email delivery) | Manual with local Supabase Studio | N/A |
| AUTH-01 | Magic link callback exchanges PKCE code for session | manual (browser flow) | Manual: visit callback URL with valid code | N/A |
| AUTH-02 | Session cookie persists across page refresh | manual smoke test | Manual: sign in → refresh → still authed | N/A |
| AUTH-02 | `updateSession()` utility returns user and supabaseResponse | unit | `npm test -- src/lib/supabase/proxy.test.ts` | ❌ Wave 0 |
| AUTH-03 | Unauthenticated request to `/chat` redirects to `/auth/sign-in?next=/chat` | unit | `npm test -- src/proxy.test.ts` | ❌ Wave 0 |
| AUTH-03 | `/share/**` is NOT redirected (public route passes through) | unit | `npm test -- src/proxy.test.ts` | ❌ Wave 0 |
| AUTH-04 | `signOut()` clears session; `getUser()` returns null after sign-out | manual smoke test | Manual: sign out → navigate to /chat → redirected | N/A |
| AUTH-04 | `useAuth().signOut()` calls `supabase.auth.signOut()` and pushes to `/` | unit (mock) | `npm test -- src/lib/auth/context.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual AUTH-01/AUTH-02/AUTH-04 smoke tests passing before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/proxy.test.ts` — covers AUTH-03 (route protection, /share exclusion). Use `unstable_doesProxyMatch` from `next/experimental/testing/server`.
- [ ] `src/lib/auth/context.test.tsx` — covers AUTH-04 signOut behavior with mocked Supabase client
- [ ] `src/lib/supabase/proxy.test.ts` — covers `updateSession()` return shape with mocked Supabase

---

## Sources

### Primary (HIGH confidence)

- [Supabase SSR — Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — SSR client patterns, proxy setup, cookie handling
- [Supabase Creating a Client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `createServerClient` / `createBrowserClient` API
- [Supabase Passwordless Email Logins](https://supabase.com/docs/guides/auth/auth-email-passwordless) — `signInWithOtp`, `verifyOtp` API
- [Supabase PKCE Flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow) — `exchangeCodeForSession`, auth callback
- [Next.js proxy.ts file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — proxy export name, matcher config, migration from middleware.ts
- [Next.js Upgrading to v16 guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — middleware → proxy rename
- `npm view @supabase/supabase-js version` → 2.99.3 (verified 2026-03-22)
- `npm view @supabase/ssr version` → 0.9.0 (verified 2026-03-22)
- `.planning/research/STACK.md` — project-level stack decisions
- `.planning/research/ARCHITECTURE.md` — system diagram and patterns
- `.planning/research/PITFALLS.md` §1-3 — cookie mis-wiring, CDN cache poisoning, session leak

### Secondary (MEDIUM confidence)

- [@supabase/ssr CHANGELOG on GitHub](https://github.com/supabase/ssr/blob/main/CHANGELOG.md) — v0.9.0 has no breaking changes from v0.8.1
- [WebSearch: Next.js 16 proxy.ts auth with Supabase 2026](https://medium.com/@securestartkit/next-js-proxy-ts-auth-migration-guide-ff7489ec8735) — community confirmation of `export function proxy()` naming requirement

### Tertiary (LOW confidence)

- Community reports that `supabase.auth.getClaims()` may be available as a more secure alternative to `getUser()` — not yet verified against official Supabase API docs. Use `getUser()` until confirmed.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry; no breaking changes confirmed in changelog
- Architecture: HIGH — patterns directly from official Supabase SSR docs + Next.js 16 proxy.ts docs
- Proxy.ts naming: HIGH — verified against official Next.js 16 file convention docs
- Pitfalls: HIGH — sourced from official Supabase security advisories and project PITFALLS.md

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable libraries; watch for `@supabase/ssr` v1.0 release which may have breaking changes)
