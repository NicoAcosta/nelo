# Stack Research

**Domain:** Supabase persistence additions to existing Next.js 16 AI chatbot
**Researched:** 2026-03-21
**Confidence:** HIGH for core Supabase packages; MEDIUM for version-specific Next.js 16 middleware behavior

---

## Context: What Already Exists (Do Not Change)

The following are validated and in production. This research covers only the NEW additions for v1.1 Persistence & Sharing:

| Already In Use | Version | Notes |
|----------------|---------|-------|
| next | ^16.2 | App Router, Turbopack |
| ai | ^6.0 | streamText, useChat, tools |
| @ai-sdk/react | ^3.0 | useChat hook |
| zod | ^4.0 | Schema validation |
| tailwindcss | ^4.1 | Utility CSS |
| shadcn/ui (CLI v4) | latest | UI primitives |
| nanoid | ^5.x | ID generation — already present |

---

## Recommended Stack (NEW Additions Only)

### Core New Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@supabase/supabase-js` | ^2.99.x | Supabase JS client — auth, database queries, storage SDK | The official Supabase client. v2 is the current stable major. As of 2026-03-20, latest is 2.99.3. |
| `@supabase/ssr` | ^0.8.1 | Cookie-based auth for Next.js App Router — createServerClient, createBrowserClient, middleware proxy | Replaces the deprecated `@supabase/auth-helpers-nextjs`. Framework-agnostic, PKCE by default. Latest stable is 0.8.1 (2026-03-02). NOT at v1 yet — treat as stable beta. |
| `supabase` (CLI) | latest | Local development stack, migrations, type generation | `npx supabase` or `npm install -D supabase`. Manages Docker-based local Supabase, generates TypeScript types from schema, creates migration files. |

### What NOT to Add

| Avoid | Why | What to Use Instead |
|-------|-----|---------------------|
| `@supabase/auth-helpers-nextjs` | Deprecated. Replaced by `@supabase/ssr`. | `@supabase/ssr` |
| `@supabase/auth-helpers-shared` | Deprecated. Same reason. | `@supabase/ssr` |
| Prisma / Drizzle | CLAUDE.md explicitly prohibits ORMs for this project. Supabase JS client with raw Postgres queries via RPC or the query builder is sufficient. | `@supabase/supabase-js` query builder |
| next-auth / Auth.js | Adds a separate auth layer that conflicts with Supabase Auth. Supabase Auth handles magic link + OTP natively. | Supabase Auth via `@supabase/ssr` |
| UploadThing / Cloudinary | Third-party upload services with their own env vars and billing. Supabase Storage is already part of the Supabase project — no new service needed. | Supabase Storage (built into `@supabase/supabase-js`) |
| Vercel Blob | Would require a separate service. Supabase Storage serves the same purpose and is already in the project. | Supabase Storage |

---

## Package Setup

### Installation

```bash
# New runtime dependencies
npm install @supabase/supabase-js @supabase/ssr

# New dev dependencies (CLI + type generation)
npm install -D supabase
```

### Environment Variables (add to `.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
# For server-side admin operations (migrations, seeding) — NEVER expose to client
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Note: Supabase recently introduced `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as an alias for the anon key (new naming convention). Either name works — the anon key is the same value. Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for now as it is the name in all existing community templates and the official tutorials.

---

## Integration Architecture for Next.js 16 App Router

### The SSR Cookie Problem and How @supabase/ssr Solves It

Next.js Server Components can READ cookies but cannot WRITE them. Supabase auth tokens must be refreshed on every request and written back to cookies. `@supabase/ssr` solves this via a **middleware proxy pattern**:

1. `middleware.ts` runs on every request, calls `supabase.auth.getClaims()`, writes refreshed tokens to response cookies.
2. Server Components create a read-only server client from the same cookies.
3. Client Components create a browser client that manages cookies client-side.

### Required Files

**`lib/supabase/server.ts`** — Server Component / Route Handler client

```ts
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
            // Server Components cannot set cookies — middleware handles this
          }
        },
      },
    }
  )
}
```

**`lib/supabase/client.ts`** — Client Component browser client

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`middleware.ts`** (project root) — Token refresh proxy

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // CRITICAL: always call getUser() in middleware to refresh the token
  // Use getClaims() for better security (validates JWT server-side)
  const { data: { user } } = await supabase.auth.getUser()

  // Prevent caching of authenticated responses
  supabaseResponse.headers.set('Cache-Control', 'private, no-store')

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Protecting Routes in Server Components

```ts
// In any Server Component or Route Handler
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  // Use getUser() NOT getSession() — getUser() re-validates with Supabase server
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // ...
}
```

**SECURITY NOTE:** Always use `supabase.auth.getUser()` to protect server routes. `getSession()` reads from the cookie without server-side revalidation — it can be spoofed. `getUser()` validates against the Supabase auth server on every call.

---

## Auth: Magic Link + OTP

Both flows use the same `signInWithOtp()` method. The difference is what the email contains: a magic link (click) or a 6-digit code (type). Configure which in the Supabase dashboard under Authentication > Email Templates.

**Recommended approach: OTP-first with magic link fallback.** OTP works better on mobile (no app-switching) and within webviews. The same single `signInWithOtp()` call handles both — the user sees whichever the dashboard is configured to send.

### Send OTP / Magic Link

```ts
// In a Server Action or Route Handler
const supabase = await createClient()
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true, // create account if first time
    emailRedirectTo: `${origin}/auth/callback`, // for magic link flow
  },
})
```

### Auth Callback Route Handler

Required for the magic link flow (PKCE). Create `app/auth/callback/route.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
```

### OTP Verification (no redirect needed)

```ts
// Client Component
const supabase = createClient() // browser client
const { error } = await supabase.auth.verifyOtp({
  email,
  token: otpCode, // 6-digit code from user input
  type: 'email',
})
```

The PKCE callback route is only needed for magic link. OTP verification happens entirely client-side.

---

## Database Schema (Postgres via Supabase)

No ORM. Use the Supabase JS client query builder for reads and writes. Use migrations (`supabase/migrations/`) for schema management.

### Recommended Schema

```sql
-- Projects: one per estimation conversation
create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'New Project',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Chat messages: the conversation history
create table messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'tool')),
  content     jsonb not null, -- AI SDK message format (supports text, tool calls, tool results)
  created_at  timestamptz not null default now()
);

-- Estimates: versioned snapshots of cost calculations
create table estimates (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  version         integer not null default 1,
  inputs          jsonb not null,  -- the 14 base measurements
  breakdown       jsonb not null,  -- 26-category cost breakdown
  total_ars       numeric(14,2),
  total_usd       numeric(10,2),
  blue_rate       numeric(10,2),   -- exchange rate at time of estimate
  confidence      text check (confidence in ('quick', 'standard', 'detailed')),
  share_token     text unique,     -- nullable; populated when user shares
  share_expires_at timestamptz,    -- nullable; null = no expiry
  created_at      timestamptz not null default now()
);

-- Floor plans: storage references
create table floor_plans (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  storage_path text not null,  -- path in Supabase Storage bucket
  filename    text not null,
  analysis    jsonb,           -- AI-extracted data (room count, area, etc.)
  created_at  timestamptz not null default now()
);
```

### Row Level Security (RLS) Policies

Enable RLS on every table immediately — do not defer.

```sql
-- Enable RLS
alter table projects enable row level security;
alter table messages enable row level security;
alter table estimates enable row level security;
alter table floor_plans enable row level security;

-- Projects: owner access
create policy "Users own their projects"
  on projects for all
  using (auth.uid() = user_id);

-- Messages: via project ownership
create policy "Users access messages through project ownership"
  on messages for all
  using (
    exists (select 1 from projects where projects.id = project_id and projects.user_id = auth.uid())
  );

-- Estimates: owner access OR valid share token (SELECT only)
create policy "Users access their estimates"
  on estimates for all
  using (
    exists (select 1 from projects where projects.id = project_id and projects.user_id = auth.uid())
  );

create policy "Public share token read access"
  on estimates for select
  using (
    share_token is not null
    and (share_expires_at is null or share_expires_at > now())
  );

-- Floor plans: via project ownership
create policy "Users access floor plans through project ownership"
  on floor_plans for all
  using (
    exists (select 1 from projects where projects.id = project_id and projects.user_id = auth.uid())
  );
```

### Shareable Links Pattern

The `share_token` column on `estimates` is a random token (nanoid, 21 chars). When a user shares an estimate:

1. Generate token: `const token = nanoid()`
2. Update estimate: `UPDATE estimates SET share_token = $token WHERE id = $id AND project.user_id = auth.uid()`
3. Link: `/estimates/share/${token}`

The share route reads by token with no auth required — the RLS `public share token read access` policy allows the anonymous client to `SELECT` that row. The estimate's related project/inputs/breakdown are all in the `estimates.breakdown` JSONB, so no join needed for the public view.

---

## Supabase Storage (Floor Plan Files)

### Bucket Setup

Create a private bucket named `floor-plans` in the Supabase dashboard (or via migration). All buckets default to private — do not make it public.

**RLS on `storage.objects`:**

```sql
-- Allow authenticated users to upload to their own folder
create policy "Users upload to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'floor-plans'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their own files
create policy "Users read their own floor plans"
  on storage.objects for select
  using (
    bucket_id = 'floor-plans'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Upload Pattern

Path convention: `{user_id}/{project_id}/{filename}` — this scopes each file to both user and project and satisfies the RLS folder policy.

```ts
// Server Action (preferred — avoids Next.js 1MB body limit)
const supabase = await createClient()
const path = `${userId}/${projectId}/${nanoid()}-${file.name}`

const { data, error } = await supabase.storage
  .from('floor-plans')
  .upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

// Store path in DB (not the full URL — URLs may change, paths don't)
await supabase.from('floor_plans').insert({
  project_id: projectId,
  storage_path: data.path,
  filename: file.name,
})
```

### Retrieving Files for Display / AI Vision

```ts
// Get a short-lived signed URL (valid 60 seconds — enough to send to AI)
const { data } = await supabase.storage
  .from('floor-plans')
  .createSignedUrl(storagePath, 60)

// data.signedUrl is the temporary URL to pass to Claude vision
```

**Why signed URLs, not public URLs:** Floor plans contain private property information. Private bucket + signed URLs ensures only the owner can access them. The signed URL is valid long enough to pass to the AI API.

---

## Integration: Persisting useChat Messages

The existing `useChat` hook manages client-side message state. To persist messages to Supabase, use the `onFinish` callback to save completed assistant turns, and store the project ID in the URL (`/projects/[id]/chat`).

```ts
// In the chat page component
const { messages, sendMessage } = useChat({
  api: '/api/chat',
  onFinish: async (message) => {
    // Save the completed assistant message to Supabase
    await supabase.from('messages').insert({
      project_id: projectId,
      role: message.role,
      content: message.content, // JSON-serializable AI SDK message
    })
  },
})
```

On page load, fetch saved messages from Supabase and pass as `initialMessages` to `useChat`:

```ts
const messages = await supabase
  .from('messages')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: true })

// Pass to useChat
const chat = useChat({ initialMessages: messages.data })
```

This approach does not require changes to the existing `/api/chat` route handler — persistence is layered on top via the hook callbacks and Server Component initial data fetch.

---

## Type Generation

Generate TypeScript types from the Supabase schema to get type safety on all queries:

```bash
npx supabase gen types typescript --project-id <project-ref> > lib/database.types.ts
```

Use in queries:

```ts
import type { Database } from '@/lib/database.types'
// Typed client
const supabase = createClient<Database>()
```

Run this command after each schema migration. Add to CI or as a `package.json` script.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Deprecated; being removed from Supabase docs |
| Supabase Storage | Vercel Blob | Would add a second storage service; Supabase Storage already in project |
| Supabase Storage | AWS S3 | Massive overkill; requires separate IAM setup |
| RLS share_token pattern | Separate `shares` join table | share_token column is simpler for single-resource sharing; a join table adds value only if sharing multiple resource types |
| Server Actions for file upload | Client-side direct upload | Server Actions avoid Next.js 1MB default request body limit; also keeps Supabase service client off the browser |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@supabase/ssr@^0.8.1` | `next@^16.x`, `react@^19.x` | Tested on Next.js 14+; should work on 16. Monitor `supabase/ssr` releases for Next.js 16-specific fixes. |
| `@supabase/supabase-js@^2.99.x` | `@supabase/ssr@^0.8.x` | Peer dependency — they must be on compatible v2 branches. |
| `@supabase/ssr@^0.8.1` | `zod@^4.0` | No direct dependency — no conflict. |
| Supabase middleware | Next.js middleware matchers | The `matcher` config must exclude static files to avoid running auth on every image/font request. |

---

## Local Development Setup

```bash
# Initialize Supabase in project root
npx supabase init

# Start local stack (requires Docker)
npx supabase start

# Apply migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --local > lib/database.types.ts

# Stop
npx supabase stop
```

Local Supabase runs at `http://localhost:54321` (API) and `http://localhost:54323` (Studio dashboard). Set `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321` in `.env.local` for local dev.

---

## Sources

- [Supabase Auth Quickstart for Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) — official setup guide
- [Creating a Supabase Client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `createServerClient` / `createBrowserClient` patterns
- [Passwordless Email Logins](https://supabase.com/docs/guides/auth/auth-email-passwordless) — `signInWithOtp`, `verifyOtp` API
- [PKCE Flow Documentation](https://supabase.com/docs/guides/auth/sessions/pkce-flow) — `exchangeCodeForSession`, auth callback
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — RLS on `storage.objects`
- [Supabase Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) — public vs private, signed URLs
- [@supabase/ssr CHANGELOG](https://github.com/supabase/ssr/blob/main/CHANGELOG.md) — v0.8.1 latest stable (2026-03-02); v1.0 roadmap in progress
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.99.3 latest as of 2026-03-20
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy syntax
- [Supabase SSR issue #2015](https://github.com/supabase/auth/issues/2015) — LOW confidence: documented gap in OTP + Next.js 15 App Router SSR docs; workarounds needed for some edge cases
- [Supabase MVP Architecture 2026](https://www.valtorian.com/blog/supabase-mvp-architecture) — MEDIUM confidence: Postgres-first, RLS-first patterns
- [Advanced SSR Auth Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) — `getClaims()` vs `getSession()` security guidance

---

## Open Questions

1. **`@supabase/ssr` v1.0 ETA**: Package is still pre-1.0. A GitHub discussion ([#27037](https://github.com/orgs/supabase/discussions/27037)) tracks the v1.0 roadmap. Pin to `^0.8.1` and watch for breaking changes in minor versions before v1.0.

2. **Next.js 16 middleware behavior with `@supabase/ssr`**: `@supabase/ssr` is tested against Next.js 14+. Next.js 16 middleware API is unchanged from 15, so breakage is unlikely — but not officially confirmed by Supabase. Validate the middleware token refresh cycle in the first integration test.

3. **`useChat` `initialMessages` format**: AI SDK v6 message format (which includes tool call/result objects) must be stored in the `messages.content` JSONB column exactly as returned by the SDK. Verify the serialization round-trip produces identical objects before considering messages truly persistent.

4. **OTP email deliverability in Argentina**: Supabase uses a default SMTP service capped at 2 emails/hour in development. For production, configure a custom SMTP provider (Resend, Postmark) via Supabase dashboard. This is an operational requirement, not a code change.

---

*Stack research for: Nelo v1.1 — Supabase persistence additions*
*Researched: 2026-03-21*
