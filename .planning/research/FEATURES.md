# Feature Research: Persistence & Sharing (v1.1 Milestone)

**Domain:** Auth + chat persistence + estimate versioning + shareable links for an existing Next.js 16 AI chatbot
**Researched:** 2026-03-21
**Confidence:** HIGH (auth, persistence patterns) / MEDIUM (versioning UX, sharing patterns)

> This file replaces the previous hackathon-scoped FEATURES.md. It focuses exclusively on
> features being added in milestone v1.1. The original feature research (Table Stakes, AI chat,
> floor plan, calculation engine) is complete and delivered.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any product that requires a login. Missing any of these makes
the product feel unfinished or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auto-save chat messages | Users expect their work to survive a refresh or tab close — the pattern set by ChatGPT, Claude.ai | MEDIUM | Save on every AI response completion via `onFinish` callback; not on every keystroke |
| Restore previous session on page load | Returning to `/chat/[id]` should show the full conversation history | LOW | Pass `initialMessages` to `useChat`; load from DB server-side |
| Project list for returning users | A home page that shows "your past estimates" — without this, previous conversations are permanently lost | MEDIUM | Dashboard page listing projects by last-updated date |
| Magic link email auth | Passwordless auth is now the expected UX for low-friction products; no user wants to create a password for a niche tool | LOW | Supabase `signInWithOtp` with email template configured as magic link |
| Session persistence across tabs | Logging in once should work everywhere in the same browser | LOW | Supabase SSR client + cookie-based session; handled by `@supabase/ssr` |
| Sign out | Obvious omission if missing | LOW | Single call to `supabase.auth.signOut()` |

### Differentiators (Competitive Advantage)

Features that go beyond baseline expectations and create genuine product value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| OTP fallback in same email flow | When user opens magic link on a different device than they requested from, a 6-digit code in the same email lets them complete auth without switching devices — Okta, Supabase both support this as a dual-template approach | MEDIUM | Include both `{{ .ConfirmationURL }}` and `{{ .Token }}` in Supabase email template; UI shows "click the link OR enter the code below" |
| Estimate versioning (snapshots) | Every time the user re-estimates (changes inputs, re-runs the calculation), the old estimate is preserved as a named version rather than overwritten — construction projects evolve and architects need to justify cost changes to clients | HIGH | Store each estimate result as an immutable snapshot with a `version` number and `created_at`; never mutate previous snapshots |
| Side-by-side estimate comparison | View v1 and v2 estimates next to each other with delta indicators (arrows + percentages per category) — the key question is always "why did it change?" | HIGH | Comparison view as `/chat/[id]/compare?a=1&b=2`; diff computed client-side from two snapshot objects |
| Shareable read-only estimate link | Share a final estimate with a client or collaborator without requiring them to create an account — the estimate is a deliverable | MEDIUM | Public URL `/share/[shareToken]`; token stored in `estimates` table; RLS policy allows anon read on matching token |
| Floor plan storage (Supabase Storage) | Replace in-memory base64 with a persisted file URL so floor plans survive sessions and can be re-analyzed | MEDIUM | Private bucket with RLS; store path in `messages` or `chats` table; generate signed URL for display |
| Named projects | Users can rename "Conversation 1" to "Casa Palermo 3BR" — improves the project list UX significantly | LOW | Editable `title` field on `chats` table; inline rename in the project list |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable but create disproportionate complexity or undermine the UX.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time sync across tabs | "If I have two tabs open, they should stay in sync" | Requires Supabase Realtime subscriptions, conflict resolution, and message ordering logic — significant complexity for a use case almost no construction estimator actually has | Each tab is independent; new messages from other tabs appear on next page load. Document this as a known limitation. |
| Partial message save (mid-stream) | "Save the message even if the user closes the tab mid-stream" | Streaming means the message is incomplete when the tab closes. Saving a partial assistant message creates a broken state — the message looks done but is truncated with no indicator | Use `consumeStream()` on the server so the stream runs to completion and `onFinish` fires even after client disconnect. The user won't see the live stream but the message will be there when they reload. |
| Branching conversation history | "Let me fork the conversation at message 5 and try a different answer" | Full branching requires a tree data structure, branch management UI, and branch-aware estimate calculation — this is a v3 feature at minimum | Estimate versioning (snapshots) solves 80% of the use case without tree complexity. Each re-estimate is a new snapshot off the same linear conversation. |
| Email digest / notifications | "Send me my estimate by email" | Requires transactional email setup (Resend/Sendgrid), email templates, unsubscribe flows, and deliverability management | Shareable links solve the same problem. User shares the URL instead of getting an email. |
| Share-to-social (WhatsApp, etc.) | Sharing an estimate on social media | Construction estimates are private financial documents. Social sharing of cost data is a trust liability, not a feature. Users share with specific people, not publicly. | Navigator Web Share API lets users share the link themselves through their preferred channel. No app-level integration needed. |
| Password auth alongside magic link | "Some users prefer passwords" | Adds a second auth path that requires password reset flows, lockout handling, and credential storage. No user who uses a construction estimator twice a month needs a password. | Magic link + OTP covers all cases. If the user can't access email, they can't use the product (acceptable for this use case). |
| Export to PDF | Already marked as out of scope in PROJECT.md; will come up again | Requires PDF rendering logic, layout decisions, and file storage. `window.print()` with `@media print` CSS is a 1-hour solution that satisfies 80% of the need. | Add print-optimized CSS to the estimate breakdown view. Defer real PDF export to v2. |

---

## Feature Dependencies

```
Supabase Auth (magic link + OTP)
    └──required by──> ALL persistence features
                          (unauthenticated users can only use the anonymous chat flow)

Chat Persistence (auto-save messages)
    └──required by──> Project List (need chats to list)
    └──required by──> Estimate Versioning (need persisted estimates to version)
    └──required by──> Floor Plan Storage (need chat context to link file to)

Estimate Versioning
    └──required by──> Side-by-Side Comparison (need >=2 versions to compare)

Chat Persistence ──enables──> Shareable Links
    (shareable link references a persisted estimate snapshot)

Floor Plan Storage (Supabase Storage bucket)
    └──replaces──> In-memory base64 in existing useChat attachment flow
    └──requires──> Chat Persistence (to store the file path alongside the message)

useChat streaming flow (EXISTING)
    └──constrains──> Chat Persistence implementation
    (must use onFinish callback pattern; cannot intercept mid-stream)
```

### Dependency Notes

- **Auth required by everything:** Without a `user_id`, there is nothing to scope chats or estimates to. Auth must be phase 1.
- **Chat persistence required by versioning:** Estimate versions are snapshots of data that first needs to exist in the database. Persistence must come before versioning.
- **Existing `useChat` constrains persistence:** The current chat uses AI SDK `useChat` hook. Persistence must integrate via the `onFinish` callback on the server-side `streamText` call and `initialMessages` on the client — not by replacing `useChat`.
- **Floor plan storage is independent:** Can be added alongside or after basic chat persistence. The base64 approach already works; storage is an upgrade, not a blocker.

---

## MVP Definition

### Launch With (v1.1 core)

Minimum needed to call the milestone "done" and deliver real user value.

- [x] **Supabase Auth (magic link)** — without this, nothing is persisted per-user; also unblocks all downstream features
- [x] **Chat auto-save on `onFinish`** — saves the full `UIMessage[]` array after each AI response; handles disconnect via `consumeStream()`
- [x] **Load chat history on page load** — `useChat` initialized with `initialMessages` from DB; `/chat/[id]` restores full conversation
- [x] **Project list page** — returning users can see and navigate their past estimates; simplest useful UI is a list sorted by `updated_at`
- [x] **Estimate snapshot on calculate** — when the calculation engine produces a final cost breakdown, save it as an immutable snapshot linked to the chat; this is the foundation for versioning

### Add After Validation (v1.1 stretch)

Features to add once core persistence is working and verified correct.

- [ ] **OTP fallback in email template** — add `{{ .Token }}` to the Supabase magic link email template and show "or enter code" UI; low effort, high value for mobile users
- [ ] **Named projects (rename)** — inline rename of chat title; adds 1-2 hours, meaningfully improves returning-user UX
- [ ] **Shareable estimate links** — generate a `shareToken` (nanoid) stored on the estimate snapshot; create a public `/share/[token]` route with anon RLS read access
- [ ] **Floor plan storage** — upload to Supabase Storage private bucket; replace base64 in `messages` with a signed URL; prevents large base64 strings from bloating the `messages` table

### Future Consideration (v2+)

Features to defer until the persistence foundation is solid and validated.

- [ ] **Side-by-side estimate comparison** — requires the UX design to be right; don't rush this; wait until there are real users with multiple versions to compare
- [ ] **Estimate versioning UI** — a timeline/history view per chat showing previous estimate snapshots; useful but not urgent for launch
- [ ] **Anon-to-auth session migration** — allow users who built an estimate before signing in to "claim" it post-auth; complex state migration, low priority
- [ ] **Shared link expiry** — time-limited share tokens (7-day, 30-day); adds a cron job and token expiry check; not needed until sharing is validated as a real use pattern

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Magic link auth | HIGH | LOW | P1 |
| Chat auto-save (onFinish) | HIGH | MEDIUM | P1 |
| Load chat history on page load | HIGH | LOW | P1 |
| Project list page | HIGH | MEDIUM | P1 |
| Estimate snapshot on calculate | HIGH | LOW | P1 |
| OTP fallback (same email) | MEDIUM | LOW | P2 |
| Named projects (rename) | MEDIUM | LOW | P2 |
| Shareable estimate links | HIGH | MEDIUM | P2 |
| Floor plan Supabase Storage | MEDIUM | MEDIUM | P2 |
| Side-by-side comparison | MEDIUM | HIGH | P3 |
| Estimate version history UI | MEDIUM | HIGH | P3 |
| Anon-to-auth session migration | LOW | HIGH | P3 |
| Shared link expiry / revoke | LOW | MEDIUM | P3 |

---

## Edge Cases and UX Patterns

### Auth

| Edge Case | Expected Behavior |
|-----------|------------------|
| Magic link clicked on different device than it was requested from | OTP code in the same email lets the user complete auth on the original device; do NOT open a new session silently on the new device |
| Magic link expired (default 1 hour) | Show "this link has expired — request a new one" with a re-send button; do not just show a generic error |
| User clicks magic link twice | Supabase invalidates the token after first use; second click should redirect to app home (already authenticated) |
| User is already logged in and visits `/login` | Redirect to `/` or the project list |
| Session expires mid-session | Supabase sessions are long-lived (7 days by default); on expiry, show auth prompt inline rather than losing draft |

### Chat Persistence

| Edge Case | Expected Behavior |
|-----------|------------------|
| Tab closed mid-stream (client disconnect) | `consumeStream()` on the server keeps stream running; `onFinish` fires; message saved; user sees complete message on reload |
| Two tabs open, both sending messages to the same chat | Each tab saves independently via `onFinish`; last-write-wins on the messages array; this is a known limitation (no real-time sync) — acceptable for a single-user estimator |
| Stream errors (LLM timeout, API error) | The error message itself should be saved (with `status: "error"`) so the user sees "something went wrong" after reload rather than a blank chat |
| Very long chat (50+ messages) | Load full history on page load (no pagination needed for a construction estimator — conversations are bounded by the number of questions in the flow) |
| User deletes a chat | Soft-delete (`deleted_at` timestamp) so data is recoverable; do not hard-delete |
| First message in a chat — auto-title | On first user message, generate a title from the first ~50 characters of their message. Do not require the user to name a project before they can start. |

### Estimate Versioning

| Edge Case | Expected Behavior |
|-----------|------------------|
| User re-runs estimate without changing inputs | Save a new snapshot anyway — timestamps tell the story; do not deduplicate |
| User wants to go back to an older estimate | All snapshots are read-only immutable records; "restore" means starting a new conversation initialized from the old snapshot's inputs |
| First estimate in a chat | `version: 1`; always the baseline |
| Comparison of more than 2 versions | Comparison view should support selecting any two snapshots from a dropdown; default to latest vs. previous |

### Shareable Links

| Edge Case | Expected Behavior |
|-----------|------------------|
| Recipient tries to edit a shared estimate | Read-only view; no chat input shown; show "Sign in to create your own estimate" CTA |
| Share token is revoked by owner | 404 page with message "this estimate is no longer available" |
| Shared estimate references a floor plan in private storage | Floor plan images in shared views must use signed URLs generated server-side at render time; never expose the internal storage path |
| Anonymous user visits a shareable link | No auth required; the anon Supabase key can read the estimate via RLS policy that allows `SELECT WHERE share_token = $1` |

---

## Interaction With Existing `useChat` Flow

The existing implementation uses:
- Client: `useChat` hook from `@ai-sdk/react`
- Server: `streamText` in a Next.js route handler returning `toUIMessageStreamResponse()`
- No persistence today

The persistence layer must slot in WITHOUT replacing `useChat`. The required integration points are:

1. **Server — `onFinish` callback** on `toUIMessageStreamResponse`: receives `UIMessage[]` after stream completes; this is where `await saveMessages(chatId, messages)` goes.
2. **Server — `consumeStream()`**: wrap the result to ensure `onFinish` fires even on client disconnect: `result.consumeStream()` before returning the response.
3. **Client — `id` prop on `useChat`**: pass the chat ID so the hook tracks which conversation it's in.
4. **Client — `initialMessages` prop on `useChat`**: pass messages loaded server-side (in the RSC page) to restore history.
5. **Route — `/chat/[id]`**: each chat needs its own URL; the existing single-route approach (`/`) must become parameterized.

These are additive changes. None require replacing `useChat` or changing the streaming behavior.

---

## Schema Outline (for ARCHITECTURE.md reference)

```
chats
  id          text  PK (nanoid)
  user_id     uuid  FK auth.users
  title       text  (auto-generated or user-renamed)
  created_at  timestamp
  updated_at  timestamp
  deleted_at  timestamp  (soft delete)

messages
  id          text  PK (server-generated via generateMessageId)
  chat_id     text  FK chats.id
  content     jsonb (UIMessage[] serialized — preserves parts, tool calls, attachments)
  created_at  timestamp

estimates
  id          text  PK (nanoid)
  chat_id     text  FK chats.id
  version     int   (monotonically incrementing per chat)
  snapshot    jsonb (full cost breakdown object — immutable after insert)
  inputs      jsonb (the 14 base measurements used to produce this estimate)
  share_token text  UNIQUE (nanoid, nullable — only present when shared)
  share_expires_at timestamp (nullable — v2 feature)
  created_at  timestamp

storage bucket: floor-plans (private, RLS: owner read/write)
  path pattern: {user_id}/{chat_id}/{filename}
```

RLS summary:
- `chats`: user can SELECT/INSERT/UPDATE/DELETE their own rows; anon cannot access.
- `messages`: same as chats, scoped by `chat_id` → `chats.user_id`.
- `estimates`: owner full access; anon can SELECT WHERE `share_token = $1` (no auth required for that path).
- `floor-plans` bucket: owner can upload/download; no anon access (signed URLs used for shared views).

---

## Sources

- [AI SDK UI: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) — official `onFinish` + `consumeStream` patterns
- [AI SDK Core: streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) — callback API
- [Supabase Auth: Passwordless email logins](https://supabase.com/docs/guides/auth/auth-email-passwordless) — magic link + OTP same flow
- [Supabase Auth: Login with Magic Link](https://supabase.com/docs/guides/auth/passwordless-login/auth-magic-link) — token expiry, `shouldCreateUser`
- [Supabase Auth: Use with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) — App Router SSR pattern
- [Supabase Storage: Access Control](https://supabase.com/docs/guides/storage/security/access-control) — private buckets + RLS
- [Supabase Storage: Signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl) — time-limited access for private files
- [supabase-community/vercel-ai-chatbot](https://github.com/supabase-community/vercel-ai-chatbot) — reference implementation for Supabase + AI SDK chat persistence
- [AI SDK v5 announcement (Vercel)](https://vercel.com/blog/ai-sdk-5) — `parts`-based message format, persistence patterns
- [Okta: Email Magic Links + OTP fallback](https://developer.okta.com/docs/guides/email-magic-links-overview/main/) — dual-option auth UX pattern
- [Stream resumption issue (vercel/ai #11865)](https://github.com/vercel/ai/issues/11865) — tab switch / background app stream recovery known issue
- [Durable Sessions for AI apps (ElectricSQL)](https://electric-sql.com/blog/2026/01/12/durable-sessions-for-collaborative-ai) — concurrent tab / collaborative session patterns

---

*Feature research for: Nelo v1.1 — Persistence & Sharing*
*Researched: 2026-03-21*
