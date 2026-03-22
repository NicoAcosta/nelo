# Architecture Research

**Domain:** Supabase persistence integration — Next.js 16 App Router + AI SDK v6 chatbot
**Researched:** 2026-03-21
**Confidence:** HIGH (official Supabase SSR docs, AI SDK v6 persistence docs verified)

---

## Standard Architecture

### System Overview — After Persistence Integration

```
┌────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Chat UI Layer                             │  │
│  │  app/chat/[id]/page.tsx  (Client Component)                 │  │
│  │                                                             │  │
│  │  useChat({ id: chatId, messages: initialMessages })         │  │
│  │    └── DefaultChatTransport → POST /api/chat               │  │
│  │                                                             │  │
│  │  NEW:                                                       │  │
│  │  • Auth gate — redirect to /login if !user                  │  │
│  │  • initialMessages loaded from Server Component parent      │  │
│  │  • Sidebar: project list from /api/projects                 │  │
│  │  • Share button → POST /api/shares → copy link             │  │
│  └───────────────────┬─────────────────────────────────────────┘  │
└───────────────────────┼────────────────────────────────────────────┘
                        │ POST /api/chat  { id, messages }
                        │ (chatId now included in body)
┌───────────────────────┼────────────────────────────────────────────┐
│  MIDDLEWARE (src/middleware.ts)                                    │
│  updateSession() — refresh Supabase auth token in cookies          │
│  Protect: /chat/** routes → redirect to /login if !user           │
│  Allow:   /share/[token] routes (public, no auth required)        │
├───────────────────────┼────────────────────────────────────────────┤
│  SERVER (Next.js App Router)                                       │
│                       ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              AI Orchestration Layer (MODIFIED)               │  │
│  │  app/api/chat/route.ts                                       │  │
│  │                                                              │  │
│  │  1. Auth check: supabase.auth.getUser() → 401 if anon       │  │
│  │  2. Load prior messages: loadChat(chatId) → UIMessage[]     │  │
│  │  3. streamText({ model, system, messages, tools })          │  │
│  │  4. toUIMessageStreamResponse({                              │  │
│  │       originalMessages: messages,                            │  │
│  │       onFinish: async ({ messages }) => {                    │  │
│  │         await saveChat(chatId, userId, messages)            │  │
│  │       }                                                      │  │
│  │     })                                                       │  │
│  └──────┬──────────┬─────────────────────────────────────────┘   │
│         │ (unchanged)                                              │
│         ▼          ▼                                               │
│  ┌──────────┐  ┌──────────────────────────────────────────────┐  │
│  │  Vision  │  │   Calculation Engine (UNCHANGED)              │  │
│  │  Tool    │  │   lib/estimate/engine.ts                      │  │
│  │ analyze  │  │   Pure functions, no Supabase imports         │  │
│  │  Floor   │  └──────────────────────────────────────────────┘  │
│  │  Plan    │                                                     │
│  └──────────┘                                                     │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              NEW: Persistence Layer                          │  │
│  │  src/lib/db/                                                 │  │
│  │                                                              │  │
│  │  chats     — id, user_id, title, created_at, updated_at     │  │
│  │  messages  — id, chat_id, messages JSONB, saved_at          │  │
│  │  estimates — id, chat_id, user_id, snapshot JSONB,          │  │
│  │              version, created_at                            │  │
│  │  shares    — id, estimate_id, token, expires_at, user_id   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              NEW: Storage Layer                              │  │
│  │  Supabase Storage bucket: floor-plans                       │  │
│  │  Path: {userId}/{chatId}/{filename}                         │  │
│  │  RLS: owner read/write, anon denied                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Pricing Data Layer (UNCHANGED)                  │  │
│  │  lib/pricing/ — static data, no auth concerns               │  │
│  └─────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────────┐
│              SUPABASE (external)                                   │
│  Auth  — magic link + OTP, cookie-based sessions via @supabase/ssr│
│  Postgres — chats, messages, estimates, shares tables + RLS        │
│  Storage — floor-plans bucket, private, owner-scoped RLS          │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Modified? |
|-----------|---------------|-----------|
| `src/middleware.ts` | Refresh auth tokens, protect /chat/** routes | NEW |
| `src/lib/supabase/server.ts` | createServerClient for Route Handlers/Server Components | NEW |
| `src/lib/supabase/client.ts` | createBrowserClient for Client Components | NEW |
| `src/lib/db/chats.ts` | loadChat(), saveChat(), listChats() — DB access layer | NEW |
| `src/lib/db/estimates.ts` | saveEstimateVersion(), listVersions(), loadEstimate() | NEW |
| `src/lib/db/shares.ts` | createShare(), validateShare(), revokeShare() | NEW |
| `app/chat/[id]/page.tsx` | Server Component that loads chat, passes initialMessages | NEW |
| `app/chat/page.tsx` | Redirect: creates new chat ID, redirects to /chat/[id] | MODIFIED |
| `app/api/chat/route.ts` | Add auth check + onFinish persistence | MODIFIED |
| `app/api/shares/route.ts` | Create/manage shareable links | NEW |
| `app/auth/login/page.tsx` | Magic link request form | NEW |
| `app/auth/confirm/route.ts` | token_hash exchange — magic link callback | NEW |
| `app/share/[token]/page.tsx` | Public read-only estimate view | NEW |
| `src/lib/estimate/engine.ts` | Pure calculation engine | UNCHANGED |
| `src/lib/pricing/` | Unit costs, categories config | UNCHANGED |
| `src/lib/ai/tools.ts` | AI tool definitions | UNCHANGED |

---

## Recommended Project Structure (New Files Only)

```
src/
├── middleware.ts                    # Supabase session refresh + route protection
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient (Client Components)
│   │   └── server.ts               # createServerClient (Route Handlers, Server Components)
│   │
│   └── db/
│       ├── chats.ts                # CRUD for chats + messages
│       ├── estimates.ts            # Estimate snapshot versioning
│       └── shares.ts               # Share token generation + validation
│
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx            # Magic link request form (Client Component)
│   │   └── confirm/
│   │       └── route.ts            # Token exchange callback (GET handler)
│   │
│   ├── chat/
│   │   ├── page.tsx                # Modified: creates chatId, redirects to /chat/[id]
│   │   └── [id]/
│   │       └── page.tsx            # Server Component: load chat, render ChatContent
│   │
│   ├── projects/
│   │   └── page.tsx                # Project list for authenticated users
│   │
│   └── share/
│       └── [token]/
│           └── page.tsx            # Public read-only estimate view
│
└── components/
    ├── auth-gate.tsx               # Wraps pages requiring auth, shows login prompt
    └── share-button.tsx            # Copy-to-clipboard share link UI
```

---

## Architectural Patterns

### Pattern 1: Supabase SSR Cookie Auth

**What:** Two-client architecture — one browser client (singleton, Client Components), one server client (per-request, Server Components and Route Handlers). Both backed by `@supabase/ssr` with HTTP-only cookies for sessions. Middleware refreshes tokens transparently.

**When to use:** Every interaction with Supabase. Never import Supabase directly — always go through the factory functions in `src/lib/supabase/`.

**Implementation:**

```typescript
// src/lib/supabase/server.ts — for Route Handlers, Server Components, Server Actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component context — middleware handles refresh */ }
        },
      },
    }
  )
}

// src/lib/supabase/client.ts — for Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/middleware.ts — runs on every request matching the pattern
import { type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: use getUser() not getSession() — validates with auth server
  const { data: { user } } = await supabase.auth.getUser()

  // Protect /chat/** routes
  if (!user && request.nextUrl.pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|share/.*|api/health).*)'],
}
```

**Trade-offs:** Middleware runs on every matched request — keep it fast (no DB calls, only auth token refresh). The `try/catch` in `setAll` is required because Server Components cannot write cookies; the middleware does the actual writing.

### Pattern 2: Chat Route with Stable ID (Generate-Then-Redirect)

**What:** When users start a new chat, generate a `nanoid()` immediately and redirect to `/chat/[id]`. The chat page becomes a stable URL from the first message. The chat ID is passed through to the API route and used as the Supabase row key.

**When to use:** Always. Never allow a chat to exist without an ID.

**Implementation:**

```typescript
// app/chat/page.tsx — new entry point
import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'

export default function NewChatPage() {
  const id = nanoid()
  redirect(`/chat/${id}`)
}

// app/chat/[id]/page.tsx — stable chat URL (Server Component)
import { createClient } from '@/lib/supabase/server'
import { loadChat } from '@/lib/db/chats'
import { redirect } from 'next/navigation'
import { ChatContent } from './chat-content'  // Client Component

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Load saved messages — empty array for new chats
  const initialMessages = await loadChat(id, user.id)

  return <ChatContent id={id} initialMessages={initialMessages} />
}
```

```typescript
// ChatContent (Client Component) — receives initialMessages from Server Component
const { messages, sendMessage } = useChat({
  id: chatId,
  messages: initialMessages,          // AISDKv6: populate from DB
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: { chatId },                  // pass chatId to route handler
  }),
})
```

**Trade-offs:** The redirect from `/chat` to `/chat/[id]` adds one navigation. This is intentional — it makes the URL shareable and enables back-button support.

### Pattern 3: API Route — onFinish Persistence

**What:** The existing `app/api/chat/route.ts` is modified to: (1) auth-check the request, (2) pass `chatId` through to `toUIMessageStreamResponse`, and (3) persist the full message history in the `onFinish` callback. The streaming response to the client is unchanged.

**When to use:** Every chat API call. Persistence happens server-side, transparent to the client.

**Implementation:**

```typescript
// app/api/chat/route.ts — minimal additions
export async function POST(req: Request) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { messages, chatId } = body  // chatId added to body

  // ... existing validation, buildSystemPrompt, etc. ...

  const result = streamText({
    model: chatModel,
    system: buildSystemPrompt(userMode, locale),
    messages: convertToModelMessages(messages),
    tools: createChatTools(locale),
    stopWhen: stepCountIs(5),
  })

  // 2. Persist on completion — does not block the stream
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: allMessages }) => {
      await saveChat(chatId, user.id, allMessages)
    },
  })
}
```

**Trade-offs:** `onFinish` runs after the stream completes. If the user closes the tab before the stream finishes, the message won't be saved. This is acceptable for v1.1 — complete messages are captured, interrupted streams are not.

### Pattern 4: Estimate Versioning Snapshot

**What:** When the `runEstimate` tool fires, the `onFinish` callback also saves a snapshot of the `Estimate` object to a separate `estimates` table with a version counter. This lets users compare estimates over time.

**When to use:** When `allMessages` in `onFinish` contain a `tool-runEstimate` part with `state: 'output-available'`.

**Implementation:**

```typescript
// Inside onFinish callback
const estimatePart = allMessages
  .flatMap(m => m.parts)
  .find(p => p.type === 'tool-runEstimate' && p.state === 'output-available')

if (estimatePart) {
  await saveEstimateVersion(chatId, user.id, estimatePart.output as Estimate)
}
```

```typescript
// src/lib/db/estimates.ts
export async function saveEstimateVersion(chatId: string, userId: string, estimate: Estimate) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId)

  await supabase.from('estimates').insert({
    id: nanoid(),
    chat_id: chatId,
    user_id: userId,
    version: (count ?? 0) + 1,
    snapshot: estimate,       // JSONB — full Estimate object
    created_at: new Date().toISOString(),
  })
}
```

### Pattern 5: Shareable Links via Share Token + RLS

**What:** A `shares` table stores `(token, estimate_id, user_id, expires_at)`. The token is a random string (nanoid). An RLS policy on `estimates` allows SELECT when the estimate's ID matches a valid, non-expired share token in `shares`. No auth required for the share page — it uses the anon key.

**When to use:** User clicks "Share estimate" → API creates share token → user gets `/share/{token}` URL.

**RLS Policies:**

```sql
-- chats: owner full access
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner access" ON chats
  USING (auth.uid() = user_id);

-- messages: owner full access
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner access" ON messages
  USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

-- estimates: owner access + public read via valid share token
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner access" ON estimates
  USING (auth.uid() = user_id);
CREATE POLICY "public read via share token" ON estimates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shares
      WHERE shares.estimate_id = estimates.id
        AND (shares.expires_at IS NULL OR shares.expires_at > now())
    )
  );

-- shares: owner can create/delete their own
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner access" ON shares
  USING (auth.uid() = user_id);

-- Storage: floor-plans bucket — owner only
CREATE POLICY "owner upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'floor-plans' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "owner read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'floor-plans' AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Share page implementation:**

```typescript
// app/share/[token]/page.tsx — NO auth required
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()  // uses anon key, RLS enforces access

  // Lookup estimate via share token
  const { data: share } = await supabase
    .from('shares')
    .select('estimate_id, expires_at')
    .eq('token', token)
    .single()

  if (!share || (share.expires_at && new Date(share.expires_at) < new Date())) {
    notFound()
  }

  const { data: estimate } = await supabase
    .from('estimates')
    .select('snapshot')
    .eq('id', share.estimate_id)
    .single()  // RLS policy allows this via the share token match

  return <CostBreakdown estimate={estimate.snapshot} readOnly />
}
```

---

## Data Flow

### New Chat Session Flow

```
User visits /chat
    ↓
app/chat/page.tsx (Server Component)
    nanoid() → id = "abc123"
    redirect('/chat/abc123')
    ↓
app/chat/[id]/page.tsx (Server Component)
    supabase.auth.getUser() → user
    loadChat('abc123', user.id) → [] (empty, new chat)
    render <ChatContent id="abc123" initialMessages={[]} />
    ↓
ChatContent (Client Component)
    useChat({ id: 'abc123', messages: [], transport: POST /api/chat })
    URL is now shareable: /chat/abc123
```

### Message Send + Persist Flow

```
User sends message
    ↓
useChat.sendMessage({ text, chatId: 'abc123' })
    ↓  POST /api/chat  { messages: UIMessage[], chatId: 'abc123' }
    ↓
app/api/chat/route.ts
    supabase.auth.getUser() → user (from cookie)
    convertToModelMessages(messages)
    streamText({ model, system, tools }) → stream starts
    ↓  streaming response to client (immediate)
    ↓  client renders tokens as they arrive
    ↓  (after stream complete) onFinish fires:
    saveChat('abc123', user.id, allMessages)
      → upsert into messages table: { chat_id, messages: allMessages as JSONB }
    if runEstimate tool fired:
      saveEstimateVersion('abc123', user.id, estimate)
```

### Return Visit / Load Saved Chat Flow

```
User returns, visits /chat/abc123
    ↓
middleware.ts
    supabase.auth.getUser() → user (cookie still valid) → allow
    ↓
app/chat/[id]/page.tsx (Server Component)
    loadChat('abc123', user.id)
      → SELECT messages FROM messages WHERE chat_id = 'abc123'
      → returns UIMessage[] (full history)
    render <ChatContent id="abc123" initialMessages={savedMessages} />
    ↓
ChatContent
    useChat({ messages: savedMessages }) → renders full history immediately
    User continues conversation — new messages appended, full history sent on each POST
```

### Floor Plan Upload + Storage Flow

```
User uploads image
    ↓
ChatInput → sendMessage({ text, files })
    ↓
BEFORE sending to AI: upload file to Supabase Storage
    app/api/floor-plan-upload/route.ts (NEW)
      supabase.auth.getUser() → user
      supabase.storage
        .from('floor-plans')
        .upload(`${user.id}/${chatId}/${filename}`, file)
      → returns permanent URL
    ↓
sendMessage({ text, files: [{ url: permanentUrl, mediaType: 'image/png' }] })
    ↓
/api/chat receives message with permanent Storage URL (not base64)
    Claude vision reads the image via the URL
```

**Note on floor plan upload timing:** The upload route is called before `sendMessage` in the client. This replaces the current base64 data URL approach with a permanent Supabase Storage URL. The AI SDK still receives the URL as a `FileUIPart`; the difference is the URL is now a stable `https://...supabase.co/storage/v1/object/public/...` URL rather than a 2MB base64 string in the message history.

### Share Link Flow

```
User clicks "Share Estimate"
    ↓
share-button.tsx → POST /api/shares { estimateId, expiresIn: '7d' }
    ↓
app/api/shares/route.ts
    supabase.auth.getUser() → user
    INSERT INTO shares (id=nanoid(), estimate_id, user_id, token=nanoid(12), expires_at)
    → returns { token }
    ↓
Client: copy /share/{token} to clipboard
    ↓
Recipient visits /share/{token}
    ↓
app/share/[token]/page.tsx (Server Component, no auth needed)
    supabase (anon key) selects estimate
    RLS "public read via share token" policy allows the SELECT
    → renders read-only CostBreakdown
```

---

## Database Schema

```sql
-- chats: one row per conversation
CREATE TABLE chats (
  id         TEXT PRIMARY KEY,          -- nanoid
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT,                      -- auto-set from first user message
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_chats_user_id ON chats(user_id);

-- messages: full UIMessage[] history stored as JSONB, one row per chat
-- Rationale: AI SDK messages are append-only, whole-history upsert is simplest
--            and matches how the API reads/writes (full array per turn)
CREATE TABLE messages (
  chat_id    TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
  messages   JSONB NOT NULL DEFAULT '[]'::jsonb,
  saved_at   TIMESTAMPTZ DEFAULT now()
);

-- estimates: versioned snapshots of Estimate objects
CREATE TABLE estimates (
  id         TEXT PRIMARY KEY,          -- nanoid
  chat_id    TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version    INTEGER NOT NULL DEFAULT 1,
  snapshot   JSONB NOT NULL,            -- full Estimate object
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_estimates_chat_id ON estimates(chat_id);
CREATE INDEX idx_estimates_user_id ON estimates(user_id);

-- shares: share tokens for public estimate access
CREATE TABLE shares (
  id          TEXT PRIMARY KEY,          -- nanoid
  estimate_id TEXT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,      -- nanoid(12), in the URL
  expires_at  TIMESTAMPTZ,              -- NULL = no expiry
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_shares_token ON shares(token);
CREATE INDEX idx_shares_estimate_id ON shares(estimate_id);
```

**Why JSONB for messages (not normalized rows):**
- AI SDK's `UIMessage[]` with `parts` arrays is arbitrarily nested. Normalizing into individual columns adds schema coupling to SDK internals that change.
- The entire array is always read/written as a unit (sent whole to the model on every turn).
- The messages JSON never needs to be queried by individual field — only fetched by `chat_id`.
- JSONB gives query capability if needed later with `->` operators.

**Why normalized for estimates (not inline in messages):**
- Estimates need to be independently addressable (share tokens reference estimate IDs).
- Version history requires separate rows.
- The Estimate type is stable and well-defined — safe to rely on its structure.

---

## Integration Points

### Existing Modules: What Changes vs. What Stays

| Module | Change Required | Nature of Change |
|--------|----------------|-----------------|
| `src/app/api/chat/route.ts` | YES | Add auth check, accept `chatId` in body, add `onFinish` persistence |
| `src/app/chat/page.tsx` | YES | Becomes redirect to `/chat/[id]` |
| `src/app/chat/[id]/page.tsx` | NEW | Server Component: load chat, render ChatContent |
| `src/components/chat-input.tsx` | MAYBE | Floor plan upload: replace base64 with Storage URL (separate upload step) |
| `src/components/header.tsx` | MAYBE | Add share button, project name from DB title |
| `src/components/sidebar.tsx` | YES | Fetch project list from Supabase instead of static data |
| `src/lib/ai/tools.ts` | NO | Pure tool logic, no auth or persistence |
| `src/lib/estimate/engine.ts` | NO | Pure calculation, unchanged |
| `src/lib/pricing/` | NO | Static data, unchanged |
| `src/lib/i18n/` | NO | Locale management, unchanged |

### New External Service Boundaries

| Boundary | Direction | Protocol |
|----------|-----------|----------|
| App → Supabase Auth | Server-side (middleware, route handlers) | Supabase JS client via @supabase/ssr |
| App → Supabase Postgres | Server-side only (route handlers, Server Components) | Supabase JS client, never from client |
| App → Supabase Storage | Server-side upload route + client direct upload | REST API via Supabase JS |
| Client → Supabase Auth | Browser (login form, session check) | createBrowserClient |

**Critical constraint:** Never call Supabase Postgres directly from Client Components. All data access goes through Server Components or API Route Handlers. The browser client is used only for Auth state and Storage uploads.

---

## Build Order (Dependency-Ordered)

Dependencies flow top-to-bottom. Each layer unblocks the next.

```
Step 1 — Supabase Project Setup (no code)
  Create Supabase project, run migrations, enable Storage bucket
  Unblocks: everything

Step 2 — Auth Infrastructure (no UI yet)
  src/lib/supabase/server.ts
  src/lib/supabase/client.ts
  src/middleware.ts
  app/auth/login/page.tsx          (magic link request form)
  app/auth/confirm/route.ts        (token_hash callback)
  Unblocks: all authenticated routes

Step 3 — DB Access Layer
  src/lib/db/chats.ts
  src/lib/db/estimates.ts
  src/lib/db/shares.ts
  Unblocks: chat persistence, estimate versioning, share links

Step 4 — Chat Route + Persistence (modifies existing code)
  Modify app/api/chat/route.ts     (auth check + onFinish save)
  Modify app/chat/page.tsx         (redirect to /chat/[id])
  New app/chat/[id]/page.tsx       (load + render saved chat)
  Unblocks: full persistence loop (send → save → reload)

Step 5 — Estimate Versioning
  Extend onFinish in route.ts to call saveEstimateVersion()
  Add estimate history UI (optional for v1.1 MVP)
  Unblocks: share links (need estimate IDs)

Step 6 — Share Links
  app/api/shares/route.ts          (create share token)
  app/share/[token]/page.tsx       (public read-only view)
  src/components/share-button.tsx
  Unblocks: nothing (last feature)

Step 7 — Floor Plan Storage (optional for v1.1)
  app/api/floor-plan-upload/route.ts
  Modify ChatInput to upload before sendMessage
  Replaces base64 data URLs with Storage URLs
```

**Critical path:** Step 1 → Step 2 → Step 3 → Step 4. Cannot test persistence without auth. Cannot test auth without Supabase project.

**Parallelizable:** Steps 5 and 6 can proceed in parallel once Step 4 is working. Step 7 is independent and can be deferred.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users (current) | Single JSONB column per chat for messages is fine; no indexing needed |
| 1k–100k users | Add `updated_at` index on chats for "recent projects" queries; consider archiving old message arrays |
| 100k+ users | Split messages into rows per message for fine-grained access; use Postgres LISTEN/NOTIFY for real-time updates |

**First bottleneck:** The `messages` table stores entire `UIMessage[]` arrays that can be 100KB+ for long conversations. At scale, compress with `pg_compress` or move to a separate object store. For v1.1 this is not a concern.

**Second bottleneck:** `onFinish` writes are synchronous server-side but async to the DB. If Supabase is slow, this doesn't block the stream. No action needed for v1.1.

---

## Anti-Patterns

### Anti-Pattern 1: Calling Supabase Directly from Client Components

**What people do:** Import `createBrowserClient` in client components and query Postgres tables directly.

**Why it's wrong:** Exposes data access to the browser. Anon key is public, so the only protection is RLS. Any RLS mistake leaks data. Server Components + API routes give an extra defense layer.

**Do this instead:** Query Postgres only in Server Components and API Route Handlers. Client Components get data via props (from Server Components) or via typed API routes.

### Anti-Pattern 2: Using getSession() Instead of getUser() in Server Code

**What people do:** Call `supabase.auth.getSession()` to check authentication in middleware or route handlers.

**Why it's wrong:** `getSession()` reads the session from the cookie without re-validating with the Supabase Auth server. A forged or replayed cookie passes the check. `getUser()` makes a network call to verify the token.

**Do this instead:** Always use `supabase.auth.getUser()` in server code. The Supabase docs state this explicitly: "Never trust `supabase.auth.getSession()` inside server code."

### Anti-Pattern 3: Storing Base64 Images in the Messages JSONB

**What people do (current v1.0):** Floor plan images are stored as data URLs in the AI SDK messages array, which gets persisted to the `messages` JSONB column.

**Why it's wrong:** A single 1MB floor plan image becomes ~1.3MB of base64. Stored in JSONB, this makes every chat row 1–5MB. The AI SDK sends the full messages array on every turn — a 5MB body on every POST request.

**Do this instead:** Upload floor plans to Supabase Storage before calling `sendMessage`. Store only the permanent Storage URL in the message. The AI SDK FileUIPart supports URLs natively.

### Anti-Pattern 4: Generating Share Tokens Client-Side

**What people do:** Generate a share token in the browser and POST it to the API.

**Why it's wrong:** The client controls the token value. A malicious user could force a predictable token or enumerate tokens.

**Do this instead:** Generate the token server-side in the API route handler (`nanoid(12)` in `app/api/shares/route.ts`). The client receives the generated token, never provides it.

### Anti-Pattern 5: Protecting /share Routes with Auth Middleware

**What people do:** Apply the auth redirect middleware to all routes including `/share/[token]`.

**Why it's wrong:** Share pages are intentionally public. Redirecting unauthenticated users to login defeats the purpose of sharing.

**Do this instead:** Exclude `/share/**` from the middleware's protected route matcher. RLS on the `estimates` table — scoped to valid share tokens — is the security boundary for share pages.

---

## Sources

- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — SSR client patterns, middleware, cookie auth
- [Supabase Creating a Client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — createServerClient/createBrowserClient with getAll/setAll
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy syntax
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — bucket RLS policies
- [AI SDK v6 Chat Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) — onFinish callback, initialMessages pattern
- [AI SDK v6 Chatbot Docs](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) — useChat hook initialMessages, transport config
- [Vercel AI SDK Discussion #4845](https://github.com/vercel/ai/discussions/4845) — Community guidance on persisting messages
- [Ryan Katayi — Server-Side Auth in Next.js with Supabase](https://www.ryankatayi.com/blog/server-side-auth-in-next-js-with-supabase-my-setup) — Complete middleware.ts + confirm route patterns (MEDIUM confidence — community source, patterns match official docs)

---

*Architecture research for: Nelo v1.1 — Supabase persistence integration*
*Researched: 2026-03-21*
