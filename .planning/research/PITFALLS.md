# Pitfalls Research

**Domain:** Adding Supabase auth + persistence to an existing stateless Next.js 16 AI chatbot
**Researched:** 2026-03-21
**Confidence:** HIGH (Supabase SSR auth, RLS, streaming persistence) / MEDIUM (estimate versioning, shareable links, email deliverability)

---

## Scope Note

This file covers two contexts:

1. **v1.1 Milestone Pitfalls** (Sections 1–7 below) — adding Supabase auth, chat persistence, estimate versioning, floor plan storage, and shareable links to the existing stateless Nelo app. This is the primary focus for roadmap creation of the current milestone.

2. **v1.0 Hackathon Pitfalls** (Section 8) — AI/LLM, construction domain, and hackathon pitfalls from the original build. Kept for reference.

---

## Critical Pitfalls

### Pitfall 1: SSR Cookie Mis-wiring in proxy.ts

**What goes wrong:**
The `@supabase/ssr` client requires both reading and writing cookies during every request. In Next.js 16, `middleware.ts` was renamed to `proxy.ts`. If you return a `new NextResponse.next()` instead of the `supabaseResponse` object from proxy.ts, the refreshed auth token cookies are never sent to the browser. Every request after the token expires becomes unauthenticated — silently. The user sees the UI as logged in (React state), but all server-side fetches are anonymous.

**Why it happens:**
Developers copy examples from Next.js 15 docs where `middleware.ts` exists and `return NextResponse.next()` was common. The subtle breaking change is that the Supabase response object carries `Set-Cookie` headers; discarding it discards the session refresh.

**How to avoid:**
```ts
// proxy.ts — CORRECT
const supabaseResponse = await updateSession(request)
// Return the supabaseResponse object directly — never create a new NextResponse.next()
return supabaseResponse
```

Never do:
```ts
const response = NextResponse.next({ request })
// This drops the Set-Cookie headers Supabase needs
return response
```

Also: always call `supabase.auth.getClaims()` (not `getSession()`) in Server Components and Route Handlers. `getSession()` reads directly from the cookie without validating the JWT; it can return stale or spoofed session data. `getClaims()` validates the JWT signature against Supabase's published public keys every time.

**Warning signs:**
- User appears logged in on the client but API calls return 401
- Session works on page load but breaks after token expiry (~1 hour)
- RLS queries return empty arrays instead of user's data
- `supabase.auth.getUser()` in a Server Component returns `null` even though the browser shows "logged in"

**Phase to address:** Phase 1 — Supabase auth setup. Get this right before building any protected features.

---

### Pitfall 2: CDN / ISR Cache Poisoning Auth Cookies

**What goes wrong:**
When a session is refreshed during a request, the `Set-Cookie` header is added to the response. If that response is cached by Vercel's Edge Network or any CDN layer (including Vercel's default caching), the cached response — including the stale or another user's session cookie — is served to subsequent visitors. On a Vercel deployment this manifests as: user A logs in, user B (on same ISR-cached route) receives user A's session.

**Why it happens:**
Next.js 16 routes are dynamic by default, but static-ish routes (landing page, public marketing pages that check auth state for conditional UI) can inadvertently get cached if no explicit `Cache-Control: private, no-store` is set.

**How to avoid:**
In proxy.ts, ensure every response that touches Supabase auth sets:
```ts
supabaseResponse.headers.set('Cache-Control', 'private, no-store')
```

Never use `export const revalidate = N` or ISR on any page that reads auth state, even just to conditionally show a "Sign out" button.

**Warning signs:**
- Different users occasionally see each other's names or data in the UI
- Auth state is inconsistent between browser tabs
- Vercel Analytics shows cache HIT on routes that should always be dynamic

**Phase to address:** Phase 1 — auth setup. Add the header in proxy.ts before first deployment.

---

### Pitfall 3: Supabase Client Initialized at Module Scope (Session Leak)

**What goes wrong:**
Vercel's Fluid Compute keeps server instances warm and reuses them across requests. If you initialize a Supabase client outside a request handler (e.g., `const supabase = createServerClient(...)` at the top of a file), that client instance — along with its cached session — is reused for subsequent requests from different users. User A's session leaks into User B's request.

**Why it happens:**
Developers initialize clients at module scope for convenience or to avoid re-creating them. This is safe for stateless clients (database connection pools, etc.) but not for Supabase auth clients that carry per-request cookie state.

**How to avoid:**
```ts
// WRONG — module scope, session leak risk
const supabase = createServerClient(url, key, cookieOptions)

// CORRECT — inside the request handler
export async function GET(req: Request) {
  const supabase = createServerClient(url, key, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      // ...
    }
  })
  // ...
}
```

The browser client (`createBrowserClient`) uses a singleton deliberately — that's safe. The server client must be per-request.

**Warning signs:**
- Occasional wrong-user data appearing in responses
- Hard to reproduce auth bugs that only appear under concurrent load
- Works fine locally (single user), breaks on Vercel under real traffic

**Phase to address:** Phase 1 — auth setup. Code review all files that create Supabase clients.

---

### Pitfall 4: Streaming Response Completes Without Saving (Client Disconnect)

**What goes wrong:**
AI SDK v6 streaming uses backpressure by default. When the user closes the browser tab or navigates away mid-stream, the HTTP connection drops. The `onFinish` callback never fires. The chat message is lost — not in the database, not recoverable. The user returns to find an empty conversation or only the messages up to their last page load.

**Why it happens:**
The natural integration pattern is `onFinish: async ({ messages }) => { await db.insert(messages) }`. This works for normal completions but silently fails on disconnect because `onFinish` is tied to stream completion, which requires the client to be listening.

**How to avoid:**
Use `result.consumeStream()` without awaiting it to detach the persistence write from the client connection:

```ts
// app/api/chat/route.ts
const result = streamText({
  model,
  messages,
  onFinish: async ({ messages }) => {
    await db.insert(chatMessages).values(
      messages.map(m => ({ chatId, ...m }))
    )
  }
})

// Critical: consume the stream server-side so onFinish fires even after client disconnects
result.consumeStream() // do NOT await this

return result.toUIMessageStreamResponse()
```

Also implement stream resumption for the UX side — if the user reconnects, they should see the generation in progress or the completed result.

**Warning signs:**
- Users report "my conversation disappeared when I closed the tab"
- Database has chats with the user's messages but no assistant responses
- `onFinish` log entries are missing for ~15-20% of conversations

**Phase to address:** Phase 2 — chat persistence implementation. This is the first thing to verify in the persistence layer.

---

### Pitfall 5: Storing Base64 Floor Plan Images in the Database

**What goes wrong:**
The current app passes floor plan images as base64 data URLs through the AI SDK attachment mechanism. A single floor plan can be 2–10MB. If this base64 string is stored in the `messages` JSONB column (as part of the message history), the messages table row for that turn becomes 2–14MB. Postgres JSONB has no hard size limit, but rows over ~1MB cause severe performance degradation — table bloat, slow reads on all subsequent queries for that chat, and potential failures on the free-tier Supabase plan.

**Why it happens:**
The stateless app already has the base64 data flowing through the message stream. The naive persistence path just saves the entire `messages` array from `useChat` including all attachment data.

**How to avoid:**
Before persisting any message that contains file attachments:
1. Upload the file to Supabase Storage
2. Replace the base64 data URL with the Storage object path/URL
3. Persist the message with the URL reference, not the raw bytes

```ts
// Before saving messages
const sanitizedMessages = await Promise.all(
  messages.map(async (msg) => {
    if (!msg.experimental_attachments) return msg
    const attachments = await Promise.all(
      msg.experimental_attachments.map(async (att) => {
        if (att.url.startsWith('data:')) {
          const blob = dataURLtoBlob(att.url)
          const { data } = await supabase.storage
            .from('floor-plans')
            .upload(`${userId}/${chatId}/${nanoid()}`, blob)
          return { ...att, url: data.path } // replace base64 with path
        }
        return att
      })
    )
    return { ...msg, experimental_attachments: attachments }
  })
)
```

**Warning signs:**
- Chat table rows are >500KB (check with `SELECT pg_column_size(messages)` on a sample row)
- Page load time for returning users increases with each floor plan uploaded
- Supabase dashboard shows unexpectedly large database size after a few chats with floor plans

**Phase to address:** Phase 3 — floor plan storage migration. Must be done before chat persistence goes live; retrofitting is harder.

---

### Pitfall 6: RLS Policies Missing or Misconfigured

**What goes wrong:**
There are two failure modes with opposite consequences:
- **RLS disabled**: all data is publicly accessible via the Supabase anon key (which is exposed in the client). Any user can read any other user's chat history.
- **RLS enabled with no policies**: all queries silently return empty results. The app appears broken — no error messages, just empty states.

A real-world example: in January 2025, 170+ apps built with Lovable were found to have exposed databases because developers didn't enable RLS on tables they created.

**Why it happens:**
New tables default to RLS disabled. When adding tables through the Supabase dashboard SQL editor, it's easy to miss the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` step. Also, SQL Editor queries bypass RLS entirely — so developers test against it and assume policies are working correctly.

**How to avoid:**
Create all tables with RLS enabled from the start:

```sql
-- chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- User can only see their own chats
CREATE POLICY "Users read own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Test policies using the **client SDK**, not the SQL Editor. The SQL Editor runs as the Postgres superuser and bypasses RLS. Test with:
```ts
const { data, error } = await supabase.from('chats').select('*')
// Should only return the authenticated user's rows
```

For the `user_metadata` trap: never write RLS policies that check `auth.jwt() ->> 'user_metadata'` values — these are user-editable. Only trust `auth.uid()` (derived from the validated JWT) and `auth.role()`.

For shared estimate links (public read): use a `share_token` column and an anon-accessible select policy scoped to that token:

```sql
CREATE POLICY "Public read via share token"
  ON estimates FOR SELECT
  USING (share_token = current_setting('request.jwt.claims', true)::json ->> 'share_token'
    OR auth.uid() = user_id);
```

Or simpler: keep a `is_public` boolean and query a separate API route that uses the service role to fetch by token (avoiding the anon key exposure pattern).

**Warning signs:**
- New table with no data visible to authenticated users (RLS enabled, no policies)
- Users can query other users' data (RLS disabled)
- SQL Editor shows data but client SDK returns empty array
- `error: null` on a Supabase query but `data: []` — classic RLS misconfiguration

**Phase to address:** Phase 2 (chat persistence) and Phase 4 (shareable links). Add RLS as the first step when creating each table — not as an afterthought.

---

### Pitfall 7: Magic Link Email Deliverability and Email Scanner Consumption

**What goes wrong:**
Two distinct problems:
1. **Default Supabase SMTP is not production-grade.** The built-in SMTP has no SLA, rate-limits at 3 emails/hour per project on the free tier, and uses Supabase's shared IP reputation. Emails land in spam for many providers.
2. **Email scanners consume magic links.** Some corporate email security systems (Proofpoint, Mimecast) and Apple's Mail Privacy Protection pre-fetch all URLs in received emails to check for malware. Supabase magic links are single-use. The scanner visits the link before the user does, consuming it. The user clicks and gets "token invalid."

**Why it happens:**
Both issues are invisible in development (Mailpit local mock doesn't rate-limit or scan). The magic link scanner problem is specifically invisible on personal Gmail/Outlook accounts.

**How to avoid:**
1. **Use custom SMTP from day one.** Set up Resend (or SendGrid) as the SMTP provider in the Supabase Auth settings. It takes 15 minutes and the improvement in deliverability is immediate. Configure SPF/DKIM/DMARC for the sending domain. Use a subdomain for auth emails (`noreply@mail.nelo.app`) to isolate reputation.

2. **Redirect-based magic link flow** to defeat email scanners:
   - Change the magic link template to point to an intermediate URL you control: `https://nelo.app/auth/confirm?type=magic&token_hash={{ .TokenHash }}`
   - On that page, the _browser_ (not the email scanner) calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })`
   - Email scanners perform GET requests; your confirm page redirects them (or returns a 302 before consuming the token)

   Alternatively, offer OTP (6-digit code) as the primary flow. OTP is immune to email scanners because there is no link to click. The user types the code manually.

**Warning signs:**
- Magic link emails not arriving within 30 seconds (check Supabase Auth logs)
- "Token expired or invalid" errors immediately after the user clicks the link
- Users report magic link emails in spam folder
- Free tier rate limit: `Email rate limit exceeded` error in Auth logs

**Phase to address:** Phase 1 — auth setup. Configure custom SMTP before the first real user test.

---

### Pitfall 8: JSONB Message Array Grows Unbounded

**What goes wrong:**
The AI SDK `useChat` messages array contains the full conversation history, including all tool calls, tool results, and attachment references. If the entire messages array is stored as a single JSONB column on each chat row (or updated on each turn), three problems emerge:
1. The row grows with every message — `UPDATE chats SET messages = $1` rewrites the entire JSONB on every turn
2. Loading a chat requires fetching the full message history even if only displaying recent messages
3. Large JSONB objects (>1MB) cause Postgres to fall back to TOAST storage, which adds I/O overhead on every query

**Why it happens:**
The simplest persistence pattern is to mirror the `useChat` messages array directly into one JSONB column. It matches the SDK's data model and requires minimal schema design.

**How to avoid:**
Store messages in a normalized `chat_messages` table — one row per message — instead of a JSONB array on the chat row:

```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,           -- server-generated nanoid
  chat_id UUID REFERENCES chats(id) NOT NULL,
  role TEXT NOT NULL,            -- 'user' | 'assistant' | 'tool'
  content JSONB NOT NULL,        -- UIMessage content parts
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
```

This enables:
- Paginated loading (fetch last N messages, load more on scroll)
- Efficient updates (INSERT new rows instead of UPDATE entire array)
- Per-message RLS policies
- Easy message deletion for GDPR compliance

For estimate versioning, use a separate `estimates` table with a `version` column and a foreign key to `chat_id`. Never store versioned estimates inside the messages JSONB.

**Warning signs:**
- Chat rows grow over 100KB after a long conversation with floor plan uploads
- Loading the chat history takes >500ms (fetch the JSONB + parse in JS)
- `EXPLAIN ANALYZE` shows TOAST reads on chat queries

**Phase to address:** Phase 2 — database schema design. The normalized schema must be decided before any persistence code is written; migrating from JSONB-array to normalized later is painful.

---

### Pitfall 9: Tool Call Schema Invalidation After Deployment

**What goes wrong:**
AI SDK v6 persists messages including tool call records — the tool name, the arguments sent, and the tool result. If you deploy a new version of the app that renames a tool, removes a tool, or changes a tool's Zod schema, the persisted historical messages contain tool calls that no longer match the current tool definitions. When a returning user loads their old chat and the SDK tries to reconstruct context, it either errors out, shows broken tool state in the UI, or sends invalid tool results back to the model.

**Why it happens:**
Tools are versioned implicitly via the code. There is no schema registry. Old messages reference tool names/shapes that may no longer exist.

**How to avoid:**
Use AI SDK's `validateUIMessages` before loading any persisted messages into the chat context:

```ts
import { validateUIMessages } from 'ai'

const rawMessages = await db.select().from(chatMessages)
  .where(eq(chatMessages.chatId, chatId))
  .orderBy(asc(chatMessages.createdAt))

const validatedMessages = await validateUIMessages({
  messages: rawMessages,
  tools: currentTools,
  dataPartsSchema,
})
// If validation fails, start with an empty context and show a notice
```

Also: treat tool names as a contract. Use semantic versioning in tool names (`collectMeasurements_v2`) if you need to make breaking changes while preserving old conversations. Or add a `tool_schema_version` metadata column to `chat_messages` and handle migrations explicitly.

**Warning signs:**
- "Unknown tool" errors when returning users load old chats
- Tool result UI components render nothing for historical messages
- New deployments break chat history for users mid-conversation

**Phase to address:** Phase 2 (persistence) and any phase that changes the tool definitions.

---

### Pitfall 10: Route Prefetching Races Auth Cookie

**What goes wrong:**
Next.js `<Link>` components prefetch routes in the background. When a user logs in via magic link and is redirected to the dashboard, the app may have already prefetched the dashboard route before the auth cookies were set (the prefetch fires as the page loads, before the callback has had time to write the session cookies). The prefetched page renders as unauthenticated. The user sees the dashboard flash to a logged-out state, then snap back to logged-in — or worse, the unauthenticated prefetch result is served from the client cache.

**Why it happens:**
The magic link callback involves a client-side redirect to exchange the token hash for a session. This is async. Prefetching is synchronous on page load. The two race.

**How to avoid:**
After magic link confirmation, redirect to a simple intermediate page with **no `<Link>` prefetching** to protected routes. Only after the `onAuthStateChange` callback fires (confirming session is set) navigate to the dashboard:

```ts
// app/auth/callback/page.tsx
'use client'
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      router.push('/dashboard') // navigate only after session is confirmed
    }
  })
}, [])
```

Alternatively, set `prefetch={false}` on `<Link>` components that link to auth-protected routes until the session is confirmed.

**Warning signs:**
- Flash of unauthenticated content immediately after magic link redirect
- Dashboard momentarily shows "no chats" then reloads with user data
- Inconsistent behavior between Chrome (faster prefetch) and Safari

**Phase to address:** Phase 1 — auth callback flow implementation.

---

### Pitfall 11: Shareable Links Exposing Private Data via Anon Key

**What goes wrong:**
The Supabase anon key is a public key — it is embedded in the client bundle and visible to anyone who inspects the page. If you implement shareable estimate links by adding an anon-accessible RLS policy on the `estimates` table, you must scope it precisely. A common mistake is writing `FOR SELECT USING (is_public = true)` which allows anyone with the anon key to enumerate all public estimates by scanning IDs — no token needed. Another mistake is making the storage bucket public to serve floor plan images, inadvertently making all images in that bucket publicly listable.

**Why it happens:**
RLS policies on estimates feel like "just a flag flip." Developers add `is_public = true` and call it done, not realizing the anon key grants access to any row matching the condition, guessable by brute-forcing UUIDs.

**How to avoid:**
Use unguessable share tokens instead of a boolean flag:

```sql
ALTER TABLE estimates ADD COLUMN share_token TEXT UNIQUE DEFAULT NULL;
-- Index for fast token lookup
CREATE INDEX idx_estimates_share_token ON estimates(share_token) WHERE share_token IS NOT NULL;

-- Anon key can only read via token — not by scanning is_public
CREATE POLICY "Public read via share token"
  ON estimates FOR SELECT
  USING (share_token IS NOT NULL AND share_token = current_setting('app.share_token', true));
```

Or implement sharing entirely through a server-side Route Handler that validates the token and fetches data using the service role (never expose service role to the client):

```ts
// app/share/[token]/route.ts (server only)
const estimate = await supabaseAdmin
  .from('estimates')
  .select('*')
  .eq('share_token', params.token)
  .maybeSingle()
```

For storage: keep floor plan images in a **private bucket** and generate signed URLs (with expiry) when needed — never make the bucket public.

**Warning signs:**
- Estimate IDs are sequential integers or short UUIDs (guessable)
- The storage bucket is set to "public" in the Supabase dashboard
- Any anon request to `/api/estimates` returns data

**Phase to address:** Phase 4 — shareable links. Design the token model before implementation, not during.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store full messages JSONB array per chat | Matches useChat API, zero schema design | Slow loads, bloated rows, can't paginate, GDPR nightmare | Never — normalized schema takes 1 extra hour and saves days later |
| Skip custom SMTP, use Supabase default | No extra setup | 3 emails/hour rate limit, spam delivery, magic link scanner failures in production | Development only |
| Use `getSession()` instead of `getClaims()` in server code | Simpler API, one fewer network call | Silent security hole — spoofable session data | Never |
| Single JSONB column for estimate versions | No versioning schema needed | Can't query individual versions, can't compare, can't delete individual versions | Never if versioning is a core feature |
| Public storage bucket for floor plans | Simple URLs, no signed URL management | All floor plan images are publicly accessible to anyone with the URL | Never — floor plans contain private building layouts |
| Disable RLS "just for now" | Unblocks development | Data exposure in production; painful to re-enable after data exists | Never past local development |
| Module-scope Supabase server client | Avoids re-creating client per request | Session leak under concurrent traffic on Vercel | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `@supabase/ssr` + proxy.ts | Returning `new NextResponse.next()` instead of `supabaseResponse` | Always return the Supabase response object from proxy.ts; it carries the refreshed token cookies |
| AI SDK `onFinish` + Supabase insert | Not calling `result.consumeStream()` — DB write never fires on client disconnect | Call `result.consumeStream()` (no await) before returning the stream response |
| AI SDK messages + Supabase | Storing the full messages array including base64 attachments | Strip/migrate base64 to Storage URLs before persisting; store messages in normalized rows |
| Supabase Storage + Next.js Image | Using `<Image>` with Supabase Storage URLs — returns "upstream response invalid" | Use a custom loader or serve via a signed URL proxy; do not use `next/image` directly with Supabase Storage private URLs |
| RLS + SQL Editor testing | Testing RLS policies in the SQL Editor (bypasses RLS) | Always test policies using the client SDK with a real authenticated user JWT |
| OpenRouter + Supabase Auth | OpenRouter API key is separate from Supabase — no shared auth | Keep OpenRouter key server-side only (never in client code); confirm it is not in the client bundle |
| Magic link + email scanners | Using the default magic link flow (single-use URL in email body) | Redirect magic links through an intermediate page; prefer OTP (6-digit code) as primary flow |
| Supabase Storage + floor plans | Making the `floor-plans` bucket public for convenience | Use private bucket + signed URLs with short expiry (1 hour for display, 24 hours for re-analysis) |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full message history on every chat open | Chat page takes >1s to load for long conversations | Paginate: fetch last 50 messages on load, load more on scroll | After ~30 messages (especially with tool call payloads) |
| N+1 query on project list page | Each project card triggers a separate query for latest estimate | JOIN estimates in the projects query; use Supabase's `.select('*, estimates(*)').limit()` | After 10+ projects per user |
| RLS policies without indexes | Queries are slow even with few rows | Index every column referenced in a USING clause — especially `user_id`, `share_token`, `chat_id` | Immediately visible with >1000 rows; catastrophic at scale |
| Signed URL generation on page render | Dashboard stalls while generating URLs for all floor plan thumbnails | Generate signed URLs lazily (on hover/click) or cache them in Redis with a TTL shorter than their expiry | After ~10 floor plans on one page |
| Re-validating tool schemas on every chat message load | Slow chat restore for users with many tool calls in history | Run `validateUIMessages` once on load, cache the result in component state | After ~20 tool-call messages in a conversation |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting `user_metadata` in RLS policies | Users can set arbitrary metadata and bypass policies | Only use `auth.uid()` and `auth.role()` in RLS policies; never `auth.jwt() ->> 'user_metadata'` |
| Service role key exposed to client | Full database access — complete data breach | Service role key must only exist in server-side environment variables (`SUPABASE_SERVICE_ROLE_KEY`), never in `NEXT_PUBLIC_*` |
| Storing OpenRouter key in client code | API key exposed, billed for others' usage | Keep `OPENROUTER_API_KEY` server-only; route all LLM calls through the Next.js API route |
| Public storage bucket for floor plans | Building layouts (private property) visible to anyone | Private bucket + signed URLs only |
| No rate limiting on `/api/chat` | Auth bypass lets anonymous users call the LLM, incurring costs | Check Supabase auth session in the route handler before calling the LLM; return 401 for unauthenticated requests |
| Share tokens stored as predictable values | Guessable tokens allow unauthorized access to estimates | Use `crypto.randomBytes(32).toString('hex')` for share tokens — never sequential IDs or short codes |
| Not invalidating sessions on account deletion | Deleted user's JWT still valid until expiry | Use Supabase's admin API to revoke all sessions when a user deletes their account |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Magic link sent but user is on mobile (link opens in browser, not app) | Session lost — user has to start over | Prefer OTP (6-digit code) as primary flow; magic link as secondary option |
| No feedback while auth email sends | User clicks "Send link" multiple times, hitting rate limits | Disable the send button immediately, show a countdown ("Resend in 58s") |
| Shareable link shows raw estimate JSON | Unprofessional, confusing for non-technical recipients | Design a dedicated read-only estimate view page before implementing sharing |
| Session expires mid-conversation | Chat stops working with a cryptic error; conversation lost | Show a "Your session expired. Sign in to continue." banner with a one-click sign-in that preserves the conversation |
| New user sees empty project list with no CTA | Users churn on empty states | Empty state should have a prominent "Start new estimate" button, not just a blank page |
| Estimate versioning shows technical diff | Users don't understand what changed | Show "Cost changed from $X to $Y (+12%)" not raw JSON diff |
| OTP expires in 10 minutes (default) | Users who are slow to check email get "invalid code" errors | Increase OTP expiry to 30 minutes in Auth settings; show the expiry time in the UI ("Code valid for 30 minutes") |

---

## "Looks Done But Isn't" Checklist

- [ ] **Auth setup:** proxy.ts returns `supabaseResponse` (not `new NextResponse.next()`) — verify by checking that `Set-Cookie` headers appear in proxy responses
- [ ] **Session security:** all Server Components and Route Handlers call `getClaims()` not `getSession()` — grep for `getSession` and verify each usage
- [ ] **Chat persistence:** `result.consumeStream()` is called before returning stream response — verify by closing browser tab mid-generation and checking that `onFinish` fired in server logs
- [ ] **Floor plan storage:** no base64 strings are stored in the messages table — verify with `SELECT pg_column_size(content) FROM chat_messages ORDER BY pg_column_size DESC LIMIT 10`
- [ ] **RLS enabled:** every table has RLS enabled and at least one policy — verify with `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
- [ ] **RLS tested with client SDK:** all policies tested using authenticated SDK client (not SQL Editor) — verify by running a query as a second test user and confirming data isolation
- [ ] **Custom SMTP configured:** Supabase Auth uses Resend/SendGrid, not default SMTP — verify by sending a test magic link and checking delivery in the SMTP provider dashboard
- [ ] **Magic link scanner protection:** either OTP flow or redirect-based token exchange is implemented — verify by simulating an email scanner (fetch the magic link URL server-side before the user clicks)
- [ ] **Share tokens unguessable:** share tokens are 32-byte random hex strings — verify with `SELECT length(share_token) FROM estimates LIMIT 5`
- [ ] **Storage bucket is private:** floor-plans bucket is NOT public — verify in Supabase Storage dashboard, "Public" toggle must be OFF
- [ ] **Service role key server-only:** `SUPABASE_SERVICE_ROLE_KEY` does not appear in client bundle — verify with `grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/static/`
- [ ] **OpenRouter key server-only:** `OPENROUTER_API_KEY` does not appear in client bundle — same grep check

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Proxy.ts returning wrong response object (session not persisting) | LOW | Fix the return value in proxy.ts; existing sessions will refresh correctly on next request |
| Base64 stored in messages table (rows too large) | HIGH | Write a migration script: query large rows, upload base64 to Storage, replace with URLs, update rows — this is multi-hour work on production data |
| RLS disabled on a table (data exposed) | MEDIUM | Enable RLS immediately; add policies; audit access logs for unauthorized reads; notify affected users if PHI/PII was exposed |
| Magic link scanner consuming tokens | LOW | Switch to OTP flow; update email template; no data loss |
| JSONB message array instead of normalized rows | HIGH | Schema migration required: extract messages from JSONB, insert into normalized table, update all queries — plan for 1-2 days |
| Module-scope server client (session leak) | LOW | Move client creation inside request handlers; redeploy; no data loss but must audit for any actual leaks |
| Share tokens guessable (sequential IDs) | HIGH | Regenerate all share tokens immediately; revoke old URLs; notify users if any unauthorized access is detected in logs |
| onFinish never fires on disconnect | MEDIUM | Add `consumeStream()` call; for already-lost messages, users need to re-generate — no automated recovery |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SSR cookie mis-wiring in proxy.ts | Phase 1 — Supabase auth setup | Session persists after 1 hour (token refresh works); `getClaims()` returns user in Server Components |
| CDN cache poisoning auth cookies | Phase 1 — auth setup | `Cache-Control: private, no-store` present on all auth-touching responses |
| Module-scope Supabase client | Phase 1 — auth setup | Code review: search for top-level `createServerClient` calls outside request handlers |
| Streaming without consumeStream | Phase 2 — chat persistence | Close tab mid-generation; verify `onFinish` fires and message appears in DB |
| Base64 in messages table | Phase 3 — floor plan storage | Check row sizes after uploading a floor plan; `pg_column_size` must stay under 50KB |
| RLS missing or misconfigured | Phase 2 + Phase 4 | Client SDK query as second user returns no rows; SQL Editor query bypassed for testing |
| Magic link deliverability + scanner | Phase 1 — auth setup | Send test magic link via configured SMTP; simulate scanner GET before user click |
| JSONB message array | Phase 2 — schema design | Schema review before first migration; normalized rows with index on `chat_id` |
| Tool schema invalidation | Phase 2 + any tool-change phase | Deploy tool rename; load old chat; verify no "unknown tool" errors |
| Route prefetch races auth cookie | Phase 1 — auth callback | Test magic link redirect in Chrome with fast prefetch; no auth flash |
| Shareable link data exposure | Phase 4 — shareable links | Attempt to access estimate URL without auth token; must return 403 |
| Signed URL performance | Phase 3 — storage integration | Measure dashboard load time with 10+ floor plans; must stay under 500ms |

---

## Sources

- [Supabase SSR Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) — session refresh, route prefetching, cache poisoning, Fluid Compute leak
- [Supabase: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — `getClaims()` vs `getSession()`, cookie configuration
- [AI SDK: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) — `onFinish`, `consumeStream()`, `validateUIMessages`, schema evolution
- [AI SDK: Chatbot Resume Streams](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams) — abort vs resume incompatibility
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy patterns, testing guidance
- [Supabase: RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — index requirements for RLS columns
- [Fixing RLS Misconfigurations in Supabase](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/) — real-world misconfiguration patterns
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — bucket policies, signed URLs
- [Resend: Maximize Supabase Auth Email Deliverability](https://resend.com/docs/knowledge-base/how-do-i-maximize-deliverability-for-supabase-auth-emails) — SPF/DKIM/DMARC, subdomain isolation
- [Supabase: Send Emails with Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) — SMTP configuration
- [Supabase: Passwordless Email Logins](https://supabase.com/docs/guides/auth/auth-email-passwordless) — OTP vs magic link tradeoffs
- [Next.js proxy.ts Authentication with Supabase 2026 (Medium)](https://medium.com/@securestartkit/next-js-proxy-ts-auth-migration-guide-ff7489ec8735) — proxy.ts rename, three-layer security model
- [Stingrai: Supabase Security Misconfigurations](https://www.stingrai.io/blog/supabase-powerful-but-one-misconfiguration-away-from-disaster) — anon key exposure, RLS gaps
- [Supabase Storage: Private URLs Deep Dive](https://dev.theflyshop.com/impact/70es9i/theflyshop-supabase-storage-private-urls-a-deep-dive-1764801052) — signed URL security model

---

## Section 8: v1.0 Hackathon Pitfalls (Reference)

*The following pitfalls were documented for the original v1.0 hackathon build. They remain relevant for ongoing development.*

### 8.1 AI / LLM Pitfalls

**Tool Calling Reliability** — Models skip tool calls or hallucinate arguments. Prevention: narrow single-purpose tools, guard in calculation engine, log all tool invocations. Phase: Architecture/system prompt.

**Vision Model Accuracy** — Treat vision output as convenience, not ground truth. Always require user confirmation of extracted values via an editable summary card. Phase: Floor plan analysis implementation.

**System Prompt Length** — Past ~2,000 tokens dense instructions, later sections are ignored. Inject pricing/category context dynamically. Use XML tags for structural anchors. Phase: System prompt design.

**Spanish Language Tool Calling** — Write tool descriptions in English but accept Spanish inputs. Add Argentine construction vocabulary synonyms (PB, PA, conurbano). Phase: System prompt + QA.

**Streaming + Tool Results Rendering** — Never render `tool-call` message parts as raw text. Filter explicitly. Test with throttled network. Phase: Chat UI implementation.

**Rate Limiting During Demos** — Use a dedicated demo API key. Implement exponential backoff. Prepare a canned transcript fallback. Phase: Deployment preparation.

### 8.2 Construction Domain Pitfalls

**Pricing Data Accuracy** — Store with `lastUpdated` date and source. Display disclaimer on every estimate. Structure as versioned config file. Phase: Pricing data setup.

**Unit Conversion Errors** — Use TypeScript union type for units. Write unit tests for every quantity derivation before implementing. Phase: Calculation engine (TDD).

**Quantity Derivation Errors** — Wall area is most error-prone: `(perimeter × height × stories) - openings`. Footprint ≠ total area for foundations/roofing. Phase: Calculation engine (TDD).

**Missing GL Categories** — GL categories (Seguridad e Higiene, Plan de Gestión Ambiental, Varios) estimated as percentages of subtotal. Show all 21 categories in output. Phase: Calculation engine + output UI.

**Regional Pricing Assumptions** — Use zone multipliers (CABA=1.0, GBA norte=0.92, etc.) even for MVP. Ask for zone as first question. Phase: Data model + conversation flow.

### 8.3 Hackathon Process Pitfalls

**Scope Creep** — Designate a scope guardian. Timebox into hard cutoffs. Phase: Kickoff.

**Integration Hell** — Spend first 2 hours on shared types in `/lib/types.ts`. Define calculation engine as pure function signature first. Phase: Kickoff + first 2 hours.

**Demo Failures** — Prepare demo floor plan, practice script 3× minimum, pre-warm URL 15 minutes before. Phase: Final 2 hours.

**Deployment Issues** — Deploy to Vercel at H2 before any features. Pricing data as TypeScript module (not fs read). No `writeFile` calls on Vercel. Phase: Setup + ongoing.

### 8.4 UX Pitfalls

**Chatbot Feels Like a Form** — Emphasize progressive inference in system prompt. Allow any question order. Phase: System prompt + conversation flow QA.

**Information Overload in Results** — Consumer: total + 5-category collapsed. Professional: full 21-category. Lead with total cost number. Phase: Output UI design.

**Floor Plan Upload Failures** — Validate MIME type client-side (JPEG/PNG/WebP only). Validate <5MB. Always include `confidence` and `warnings` in extraction schema. Phase: Floor plan upload implementation.

**No Feedback During Long Processing** — Every AI action needs a progress narrative. Spinner during upload. 20-second timeout with "retry?" prompt. Phase: Chat UI + UX polish.

---

*Pitfalls research for: Nelo v1.1 — Adding Supabase auth + persistence to existing Next.js 16 AI chatbot*
*Researched: 2026-03-21*
