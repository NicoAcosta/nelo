# Phase 10: Chat Persistence - Research

**Researched:** 2026-03-22
**Domain:** AI SDK v6 message persistence + Supabase Postgres JSONB + Next.js App Router route parameterization
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERS-01 | Conversation auto-saves to Supabase after each assistant response completes (onFinish + consumeStream) | `toUIMessageStreamResponse({ onFinish })` + `result.consumeStream()` pattern — fully documented in AI SDK v6 official persistence guide |
| PERS-02 | User can resume a previous conversation from /chat/[id] with full message history loaded | `useChat({ messages: initialMessages })` prop + Server Component `loadConversation()` → passes to Client Component |
</phase_requirements>

---

## Summary

Phase 10 adds chat persistence on top of the auth infrastructure Phase 9 delivered. The database schema already exists (`projects` + `conversations` tables with RLS). The work is entirely plumbing: wiring `onFinish` in the route handler to write to Supabase, adding `consumeStream()` to protect against tab-close data loss, splitting `app/chat/page.tsx` (currently a Client Component) into a Server Component that loads history and a Client Component that renders the chat, and parameterizing the route to `/chat/[id]`.

The current `app/chat/page.tsx` is a single `"use client"` file. It must be split: a Server Component parent at `app/chat/[id]/page.tsx` that reads auth + loads messages, and the existing render logic extracted into `app/chat/[id]/chat-content.tsx` (Client Component). The existing `app/chat/page.tsx` becomes a redirect that generates a new conversation ID and bounces to `/chat/[id]`.

The critical schema fact from Phase 9: the tables are named `projects` and `conversations` (not `chats`/`messages` as the architecture research speculated). The `conversations` table stores the full `UIMessage[]` array as a single JSONB column named `messages`, with `project_id` as the FK. Phase 10 must work with this schema, not introduce a new one.

**Primary recommendation:** Implement the three-point integration — `onFinish` + `consumeStream()` in route handler, `loadConversation()` in Server Component, `useChat({ messages: initialMessages })` in Client Component — against the existing `projects`/`conversations` schema from Phase 9.

---

## Standard Stack

No new packages required. Phase 10 uses exclusively what Phase 9 installed.

### Already Installed (Use These)
| Library | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.99.x | Supabase JS client — DB read/write |
| `@supabase/ssr` | ^0.8.1 | Cookie-based auth for server client |
| `ai` | ^6.0 | `streamText`, `toUIMessageStreamResponse`, `consumeStream` |
| `@ai-sdk/react` | ^3.0 | `useChat` hook with `messages` init prop |
| `nanoid` | ^5.x | Generate conversation IDs |
| `next` | ^16.2 | App Router, Server Components |

### What NOT to Add
- No ORM (Prisma/Drizzle) — CLAUDE.md prohibits; raw Supabase JS query builder sufficient
- No Vercel Blob — Supabase Storage already in project (Phase 9 created the `floor-plans` bucket)
- No client-side Postgres access — all DB writes go through route handlers / Server Components

---

## Architecture Patterns

### Recommended File Structure (New + Modified Files Only)

```
src/
├── app/
│   ├── chat/
│   │   ├── page.tsx               MODIFIED: becomes redirect → /chat/[id]
│   │   └── [id]/
│   │       ├── page.tsx           NEW: Server Component — auth check + load history
│   │       └── chat-content.tsx   NEW: Client Component — extract from current page.tsx
│   └── api/
│       └── chat/
│           └── route.ts           MODIFIED: add chatId body param + onFinish + consumeStream
│
└── lib/
    └── db/
        └── conversations.ts       NEW: loadConversation(), saveConversation(), createProject()
```

### Pattern 1: Generate-Then-Redirect (New Chat Entry Point)

**What:** `app/chat/page.tsx` generates a `nanoid()` project ID, creates a row in `projects`, then redirects to `/chat/[id]`. Every chat has a stable URL from the first navigation.

**When to use:** When a user navigates to `/chat` without an ID (new conversation).

```typescript
// app/chat/page.tsx — Server Component (drop "use client", remove Suspense wrapper)
import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/server'

export default async function NewChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Middleware already guards /chat — but double-check for safety
  if (!user) redirect('/auth/sign-in?next=/chat')

  const id = nanoid()
  // Create the project row now so the conversation can FK to it
  await supabase.from('projects').insert({
    id,
    user_id: user.id,
    title: 'New Project',
  })
  redirect(`/chat/${id}`)
}
```

**Note:** `projects.id` is currently `UUID` in the schema (Phase 9 migration). The planner must decide: either keep UUID and use `crypto.randomUUID()` instead of `nanoid()`, OR add a migration to change `projects.id` to `TEXT`. The architecture research used `TEXT` + nanoid; the actual migration used `UUID`. This is a schema alignment decision.

### Pattern 2: Server Component Loads History, Client Component Renders

**What:** `app/chat/[id]/page.tsx` is a Server Component. It calls `loadConversation(id, userId)` and passes the result as `initialMessages` prop to the Client Component `<ChatContent>`. The existing `ChatContent` logic (currently in `app/chat/page.tsx`) moves to `app/chat/[id]/chat-content.tsx`.

```typescript
// app/chat/[id]/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChatContent } from './chat-content'
import { loadConversation } from '@/lib/db/conversations'
import type { UIMessage } from 'ai'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in?next=/chat/' + id)

  const messages: UIMessage[] = await loadConversation(id, user.id)
  // If the project doesn't exist or belongs to another user, 404
  // (loadConversation returns null for missing/unauthorized projects)
  if (messages === null) notFound()

  return <ChatContent id={id} initialMessages={messages} />
}
```

```typescript
// app/chat/[id]/chat-content.tsx — Client Component
"use client"
// ... move all the existing ChatContent logic from app/chat/page.tsx here
// Key changes:
//   1. Accept { id, initialMessages } as props
//   2. Pass them to useChat:
const { messages, sendMessage, status, error } = useChat({
  id,
  messages: initialMessages,   // AI SDK v6: prop name is "messages", not "initialMessages"
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: { conversationId: id },  // pass to route handler for persistence
  }),
})
```

**Critical API note (verified against official docs):** The `useChat` prop for pre-loading messages is `messages`, NOT `initialMessages`. Confirmed at `ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat`: `messages?: UIMessage[] - Initial chat messages to populate the conversation with.`

### Pattern 3: Route Handler — onFinish + consumeStream

**What:** `app/api/chat/route.ts` is modified to (1) read `conversationId` from the request body, (2) add `onFinish` to `toUIMessageStreamResponse` to save the full message history, and (3) call `result.consumeStream()` without awaiting to ensure `onFinish` fires even on tab close.

```typescript
// app/api/chat/route.ts — additions only, existing logic unchanged
import { saveConversation } from '@/lib/db/conversations'

export async function POST(req: Request) {
  // ... existing auth check (already present from Phase 9) ...

  const body = await req.json()
  const { messages, conversationId } = body  // conversationId added

  // ... existing validation, detectUserMode, convertToModelMessages ...

  const result = streamText({
    model: chatModel,
    system: buildSystemPrompt(userMode, locale),
    messages: modelMessages,
    tools: createChatTools(locale),
    stopWhen: stepCountIs(5),
  })

  // CRITICAL: consumeStream() BEFORE return — detaches persistence from client connection
  // onFinish will fire even if the user closes the tab mid-stream
  result.consumeStream()  // do NOT await

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: allMessages }) => {
      if (conversationId) {
        await saveConversation(conversationId, user.id, allMessages)
      }
    },
  })
}
```

**Source:** AI SDK v6 official persistence docs (ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) + `toUIMessageStreamResponse` reference confirming `onFinish` receives `{ messages: UIMessage[]; isContinuation: boolean; responseMessage: UIMessage; isAborted: boolean }`.

### Pattern 4: DB Access Layer — conversations.ts

**What:** `src/lib/db/conversations.ts` wraps all Supabase queries for the `projects` and `conversations` tables. Keeps route handlers and Server Components thin.

```typescript
// src/lib/db/conversations.ts
import { createClient } from '@/lib/supabase/server'
import type { UIMessage } from 'ai'

/**
 * Load all messages for a conversation. Returns [] for new chats.
 * Returns null if the project doesn't exist or belongs to another user (RLS blocks it).
 */
export async function loadConversation(
  projectId: string,
  _userId: string,  // userId implicit via RLS — kept for readability
): Promise<UIMessage[] | null> {
  const supabase = await createClient()

  // First check the project exists (RLS will block if wrong user)
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()

  if (!project) return null

  // Load the conversation row
  const { data: conversation } = await supabase
    .from('conversations')
    .select('messages')
    .eq('project_id', projectId)
    .single()

  if (!conversation) return []  // New project, no conversation yet
  return (conversation.messages as UIMessage[]) ?? []
}

/**
 * Upsert the full UIMessage[] array for a conversation.
 * Called from onFinish — runs after stream completes.
 */
export async function saveConversation(
  projectId: string,
  _userId: string,
  messages: UIMessage[],
): Promise<void> {
  const supabase = await createClient()

  // Strip base64 data URLs before storing — prevents multi-MB rows
  const sanitizedMessages = stripBase64Attachments(messages)

  // Update project title from first user message if still default
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (firstUserMsg) {
    const titleText = getTextFromMessage(firstUserMsg).slice(0, 60)
    if (titleText) {
      await supabase
        .from('projects')
        .update({ title: titleText, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('title', 'New Project')  // Only update if still the default
    }
  }

  // Upsert conversations row (one row per project)
  await supabase
    .from('conversations')
    .upsert({
      project_id: projectId,
      messages: sanitizedMessages,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id' })
}
```

**Note on `conversations` schema:** Phase 9 migration has no `UNIQUE` constraint on `conversations.project_id`. The upsert `onConflict: 'project_id'` requires a unique index. The planner must schedule a migration to add `CREATE UNIQUE INDEX conversations_project_id_unique ON conversations(project_id)` OR change the strategy to SELECT-then-INSERT/UPDATE.

### Pattern 5: Stripping Base64 Before Persisting

The current `handleSend` in `chat/page.tsx` converts floor plan images to base64 data URLs and passes them to `sendMessage`. These base64 strings end up in the `UIMessage[]` array. If saved verbatim to JSONB, a single floor plan creates a 2–14MB database row (Pitfall 5 from PITFALLS.md).

```typescript
// src/lib/db/conversations.ts — helper
function stripBase64Attachments(messages: UIMessage[]): UIMessage[] {
  return messages.map(msg => {
    if (!('experimental_attachments' in msg) || !msg.experimental_attachments) {
      return msg
    }
    return {
      ...msg,
      experimental_attachments: msg.experimental_attachments.map(att => {
        if (att.url?.startsWith('data:')) {
          // Replace base64 with a placeholder path — full Storage upload is Phase 13
          return { ...att, url: '[floor-plan-stripped]', name: att.name }
        }
        return att
      }),
    }
  })
}
```

**Scope note for Phase 10:** Full Supabase Storage upload (replacing base64 with a permanent URL) is scoped to Phase 13 (SHARE-03). For Phase 10, stripping the base64 and storing a placeholder is sufficient — the image is lost on reload but the conversation text and tool outputs (the valuable parts) are preserved. This is an acceptable Phase 10 tradeoff.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Row-level auth on DB queries | Custom auth middleware on DB layer | Supabase RLS policies (already set in Phase 9 migration) | RLS enforces ownership at DB level — no app-layer check can forget it |
| Message ID generation | Custom UUID function | `crypto.randomUUID()` or `nanoid()` — already in dependencies | Collision-safe, no implementation needed |
| Session reading in Server Components | Manual cookie parsing | `createClient()` from `src/lib/supabase/server.ts` (Phase 9 built this) | Already handles cookie wiring correctly |
| Tab-disconnect stream completion | Custom stream reader | `result.consumeStream()` (built into AI SDK) | Handles backpressure removal — one line |
| Base64 detection | Regex on data URLs | `url.startsWith('data:')` check (string primitive) | Zero complexity needed |

---

## Critical Schema Facts from Phase 9

The actual Phase 9 migration (`supabase/migrations/0001_initial_schema.sql`) differs from the architecture research document in important ways:

| Aspect | Architecture Research Said | Phase 9 Actually Built |
|--------|---------------------------|------------------------|
| Chat/project ID type | `TEXT` (nanoid) | `UUID` (`gen_random_uuid()`) |
| Table name for conversations | `chats` or `messages` | `projects` + `conversations` |
| Messages column | `messages` on `chats` | `messages` JSONB on `conversations` |
| FK name | `chat_id` | `project_id` |
| Estimates FK | `chat_id` | `conversation_id` |
| Share links | `shares` table | `share_links` table |

**Action required in Phase 10 plan:**
- Use `UUID` for project IDs (call `crypto.randomUUID()` not `nanoid()`) OR add a migration to change the column type. Recommend using `crypto.randomUUID()` for consistency with the existing schema.
- The `/chat/[id]` URL param is a UUID string (e.g., `/chat/550e8400-e29b-41d4-a716-446655440000`). This is valid for routing.
- `conversations` table has no UNIQUE constraint on `project_id`. Upsert requires either adding that constraint via migration or doing SELECT → INSERT/UPDATE logic.

---

## Common Pitfalls

### Pitfall 1: `consumeStream()` Placement — Must Be Before `return`

**What goes wrong:** `consumeStream()` called after `return result.toUIMessageStreamResponse()` — the line is unreachable. The stream is not consumed server-side. Tab-close disconnects lose the message.

**How to avoid:**
```typescript
// CORRECT order:
result.consumeStream()  // no await — line 1
return result.toUIMessageStreamResponse({ onFinish: ... })  // line 2
```

**Warning sign:** Users report conversation disappearing after closing tab. `onFinish` log entries missing for ~15-20% of sessions.

### Pitfall 2: `messages` Prop vs. `initialMessages` (AI SDK v6 API)

**What goes wrong:** Passing `initialMessages={savedMessages}` to `useChat` — this prop doesn't exist in AI SDK v6. The hook silently ignores it and starts with an empty conversation.

**How to avoid:** Use `messages={savedMessages}` — confirmed against `ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat`:
```typescript
useChat({ id, messages: savedMessages, ... })
//               ^^^^^^^^ NOT initialMessages
```

**Warning sign:** Returning to `/chat/[id]` shows empty conversation even though database has messages.

### Pitfall 3: `conversations.project_id` Upsert Without Unique Index

**What goes wrong:** `supabase.from('conversations').upsert({ project_id: id, ... }, { onConflict: 'project_id' })` fails silently or throws if `project_id` has no unique constraint. Every `onFinish` call inserts a new row instead of updating, creating duplicate conversation rows per project.

**How to avoid:** Add migration before Phase 10 implementation:
```sql
CREATE UNIQUE INDEX conversations_project_id_unique ON conversations(project_id);
```
OR use explicit SELECT + conditional INSERT/UPDATE logic instead of upsert.

**Warning sign:** `SELECT COUNT(*) FROM conversations WHERE project_id = $1` returns > 1 after a few chat turns.

### Pitfall 4: `"use client"` on the `[id]/page.tsx` Page Component

**What goes wrong:** Adding `"use client"` to `app/chat/[id]/page.tsx` to make it easier to call hooks. This makes it a Client Component — it loses the ability to `await cookies()`, `await createClient()`, and run server-side DB queries. The page gets the auth check wrong.

**How to avoid:** Keep `app/chat/[id]/page.tsx` a Server Component (no `"use client"` directive). Extract all hook usage into `chat-content.tsx` (Client Component). Pass data down via props.

### Pitfall 5: Storing Base64 Images in JSONB (Performance Bomb)

**What goes wrong:** `onFinish` receives the full `UIMessage[]` from `useChat`. If the user uploaded a floor plan, those messages contain base64 data URLs (~2MB each). Saving them verbatim creates rows that are 2–14MB in Postgres JSONB. Every subsequent query for that chat is slow. Supabase free tier degrades visibly.

**How to avoid:** Call `stripBase64Attachments(messages)` before the `supabase.from('conversations').upsert(...)` call. The base64 is stripped at the DB layer. The in-memory `useChat` state still has the image for the current session.

### Pitfall 6: `conversationId` Missing from Route Handler Body (Persistence Never Fires)

**What goes wrong:** The `DefaultChatTransport` in `ChatContent` doesn't include `conversationId` in the body. The route handler receives `undefined` for `conversationId`. The `if (conversationId)` guard in `onFinish` skips the save silently.

**How to avoid:**
```typescript
// chat-content.tsx — transport must include conversationId
const [transport] = useState(() => new DefaultChatTransport({
  api: '/api/chat',
  body: { conversationId: id },
  headers: () => ({ 'x-locale': localeRef.current }),
}))
```

### Pitfall 7: Initializing `useChat` with Messages from a Stale Server Render

**What goes wrong:** The Server Component fetches messages at render time. If the user sends messages on another tab/device between the SSR render and their current session, those messages are missing from `initialMessages`. On the next `sendMessage`, the route handler receives the stale history.

**Acceptable for Phase 10:** This is a known limitation. The FEATURES.md explicitly documents "last-write-wins on the messages array" as acceptable for v1.1. The route handler should receive all messages from the `useChat` state (not load from DB on every POST) — the client is the source of truth for the current session.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `onFinish` on `streamText` result only | `onFinish` on `toUIMessageStreamResponse` options (AI SDK v6) | `toUIMessageStreamResponse` receives the full `UIMessage[]` format (with parts, tool calls) — correct for persisting what the client sees |
| `initialMessages` prop on `useChat` | `messages` prop on `useChat` (AI SDK v6) | Breaking rename between versions — docs confirm `messages` is the current name |
| Streaming response blocks on client connection | `result.consumeStream()` detaches persistence | Messages survive tab close; standard pattern for all AI SDK v6 persistence apps |

---

## Code Examples

### Example 1: Route Handler with consumeStream + onFinish

```typescript
// app/api/chat/route.ts — verified against AI SDK v6 official docs
const result = streamText({
  model: chatModel,
  system: buildSystemPrompt(userMode, locale),
  messages: modelMessages,
  tools: createChatTools(locale),
  stopWhen: stepCountIs(5),
})

// Must be BEFORE return — no await
result.consumeStream()

return result.toUIMessageStreamResponse({
  originalMessages: messages,
  onFinish: async ({ messages: allMessages }) => {
    if (conversationId) {
      await saveConversation(conversationId, user.id, allMessages)
    }
  },
})
```

Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence

### Example 2: useChat with Loaded History

```typescript
// app/chat/[id]/chat-content.tsx — "use client"
const { messages, sendMessage, status, error } = useChat({
  id,                          // ties this instance to the conversation
  messages: initialMessages,   // prop name is "messages" not "initialMessages"
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: { conversationId: id },
    headers: () => ({ 'x-locale': localeRef.current }),
  }),
})
```

Source: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat

### Example 3: onFinish Callback Type (toUIMessageStreamResponse)

`onFinish` receives:
```typescript
{
  messages: UIMessage[]       // full conversation including new assistant message
  isContinuation: boolean     // true if this was a continued multi-step stream
  responseMessage: UIMessage  // the assistant message just completed
  isAborted: boolean          // true if stream was aborted
}
```

Source: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text (toUIMessageStreamResponse docs)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^3.x |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/lib/db/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERS-01 | `saveConversation()` writes messages JSONB to `conversations` table | unit (mock Supabase) | `npx vitest run src/lib/db/__tests__/conversations.test.ts` | ❌ Wave 0 |
| PERS-01 | Base64 strips before DB insert (no data: URLs in stored messages) | unit | same file | ❌ Wave 0 |
| PERS-01 | `consumeStream()` is called before `return` in route handler | unit (integration) | `npx vitest run src/app/api/chat/__tests__/route.test.ts` | ❌ Wave 0 |
| PERS-02 | `loadConversation()` returns `UIMessage[]` for existing project | unit (mock Supabase) | `npx vitest run src/lib/db/__tests__/conversations.test.ts` | ❌ Wave 0 |
| PERS-02 | `loadConversation()` returns `[]` for new project (no conversation row) | unit | same file | ❌ Wave 0 |
| PERS-02 | `loadConversation()` returns `null` for unknown/unauthorized project ID | unit | same file | ❌ Wave 0 |
| PERS-02 | `useChat({ messages: initialMessages })` renders history on mount | component | `npx vitest run src/app/chat/__tests__/chat-content.test.tsx` | ❌ Wave 0 |

**Manual-only scenarios:**
- Tab close mid-stream: browser interaction required; verify by manual test (close tab, reopen `/chat/[id]`, confirm message saved)
- RLS enforcement: requires live Supabase; verify in staging environment

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/db/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/db/__tests__/conversations.test.ts` — covers PERS-01 save, PERS-02 load, base64 strip, null for 404
- [ ] `src/app/api/chat/__tests__/route.test.ts` — covers consumeStream placement, onFinish callback
- [ ] `src/app/chat/__tests__/chat-content.test.tsx` — covers initialMessages rendering, conversationId in transport

*(Existing test infrastructure: `vitest.config.ts`, `src/test/setup.ts`, `@testing-library/react` all present — no framework install needed)*

---

## Open Questions

1. **UUID vs nanoid for project IDs**
   - What we know: Phase 9 schema uses `UUID PRIMARY KEY DEFAULT gen_random_uuid()`. Architecture research proposed `TEXT` + nanoid.
   - What's unclear: Whether the planner wants to add a migration to change `projects.id` to `TEXT`, or accept UUID in the URL (ugly but functional).
   - Recommendation: Keep UUID. Use `crypto.randomUUID()` in `app/chat/page.tsx`. The URL `/chat/550e8400-...` is less pretty but avoids a migration risk. URLs are not exposed as a UX feature in Phase 10.

2. **`conversations.project_id` unique constraint**
   - What we know: The upsert pattern requires a unique index on `project_id`. The Phase 9 migration didn't add one.
   - What's unclear: Whether Phase 9 was deployed to a live Supabase instance already (a migration to add the index would need to run against the existing DB).
   - Recommendation: Add a new migration file `0002_conversations_unique_project_id.sql` as the first task in Wave 0. Adding a unique index to an empty table is safe.

3. **`searchParams` from the current `app/chat/page.tsx`**
   - What we know: The current page reads `searchParams.get("q")` to auto-send an initial query from the landing page.
   - What's unclear: How this `?q=` flow interacts with the generate-then-redirect pattern. `/chat?q=some+text` must become `/chat/[new-id]?q=some+text`.
   - Recommendation: In `app/chat/page.tsx`, forward the `q` search param in the redirect: `redirect('/chat/' + id + '?' + searchParams.toString())`. Then `chat-content.tsx` reads it from `useSearchParams()` as before.

4. **`onFinish` in `toUIMessageStreamResponse` vs. in `streamText`**
   - What we know: Both `streamText({ onFinish })` and `toUIMessageStreamResponse({ onFinish })` exist. The `toUIMessageStreamResponse` onFinish receives `UIMessage[]` (what the client sees). The `streamText` onFinish receives raw model output.
   - Recommendation: Use `toUIMessageStreamResponse({ onFinish })` — it receives the fully assembled `UIMessage[]` array including all tool results in the correct format for storing and re-hydrating with `useChat({ messages })`.

---

## Sources

### Primary (HIGH confidence)
- `ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence` — `onFinish` + `consumeStream()` pattern, tab-disconnect behavior. Fetched 2026-03-22.
- `ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat` — `messages` prop name (not `initialMessages`), `id` param. Fetched 2026-03-22.
- `ai-sdk.dev/docs/reference/ai-sdk-core/stream-text` — `toUIMessageStreamResponse` onFinish signature `{ messages, isContinuation, responseMessage, isAborted }`. Fetched 2026-03-22.
- `/Users/nico/dev/arqui/supabase/migrations/0001_initial_schema.sql` — actual table names, column names, FK names, ID types from Phase 9.
- `/Users/nico/dev/arqui/src/proxy.ts` — Phase 9 middleware: protected routes, `updateSession()` pattern.
- `/Users/nico/dev/arqui/src/lib/supabase/server.ts` — createClient factory pattern for server-side use.
- `/Users/nico/dev/arqui/src/app/api/chat/route.ts` — current route handler structure (auth guard already present).
- `/Users/nico/dev/arqui/src/app/chat/page.tsx` — current monolithic client component that must be split.

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — system diagram, data flow patterns (note: schema names differ from actual Phase 9 migration).
- `.planning/research/FEATURES.md` — `onFinish` integration points, `consumeStream()` rationale, edge case table.
- `.planning/research/PITFALLS.md` §3-5 — base64 storage pitfall, client-disconnect pitfall, RLS misconfiguration.
- `.planning/STATE.md` key decisions — `consumeStream()` (no await), always `getUser()` not `getSession()`, JSONB for messages.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all confirmed installed in Phase 9
- Architecture: HIGH — AI SDK v6 APIs verified against official docs; schema facts from actual migration file
- Pitfalls: HIGH — consumeStream/onFinish verified; schema pitfalls discovered by reading actual migration

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (AI SDK v6 is relatively stable; @supabase/ssr is pre-1.0 — check for minor updates)
