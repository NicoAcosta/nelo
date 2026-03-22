# Project Research Summary

**Project:** Nelo — v1.1 Persistence & Sharing
**Domain:** Supabase auth + chat persistence + estimate versioning + shareable links for a Next.js 16 AI chatbot
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

Nelo v1.1 adds a persistence and sharing layer to an already-shipped AI construction cost estimator. The core approach is straightforward: Supabase Auth (magic link + OTP) gates all data access, chat history is persisted via the AI SDK `onFinish` callback, estimates are stored as immutable versioned snapshots, and shareable links work through a `share_token` column protected by RLS policies. All four research files converge on the same dependency order: auth first, then database schema, then persistence integration, then sharing — nothing in this milestone can be built out of order.

The recommended stack adds exactly three packages to the existing codebase: `@supabase/supabase-js` (^2.99.x), `@supabase/ssr` (^0.8.1), and the `supabase` CLI for migrations and type generation. No ORM, no separate file storage service, no auth library beyond Supabase — the CLAUDE.md constraints that guided v1.0 apply equally here. The primary integration challenge is wiring the Supabase SSR cookie refresh correctly in `middleware.ts` and ensuring `consumeStream()` is called before returning the streaming response so that `onFinish` fires even when users close their tab mid-stream.

The two highest-risk areas are security correctness (RLS policies that are missing, misconfigured, or enabled with no policies — all of which are silent failures) and the base64 floor plan problem (the existing v1.0 app stores images as data URLs in message state; if those are naively persisted to JSONB, a single chat with a floor plan can produce a multi-megabyte database row). Both risks have clear mitigations documented in the research and must be addressed in Phase 1 and Phase 2 respectively, not retrofitted later.

---

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, AI SDK v6, Zod v4, shadcn/ui, Tailwind v4, nanoid) is unchanged. Three new packages are added:

**Core new technologies:**
- `@supabase/supabase-js@^2.99.x`: Official Supabase client — auth, database queries, storage SDK. The only supported JS client for Supabase.
- `@supabase/ssr@^0.8.1`: Cookie-based auth for Next.js App Router. Replaces the deprecated `@supabase/auth-helpers-nextjs`. Pre-1.0 but stable — pin to `^0.8.1` and monitor releases.
- `supabase` CLI (dev dependency): Local Supabase stack, migration management, TypeScript type generation via `supabase gen types`.

**What to avoid:** `@supabase/auth-helpers-nextjs` (deprecated), any ORM (CLAUDE.md constraint), `next-auth` (adds a second auth system), Vercel Blob or UploadThing (Supabase Storage already in the project).

**Environment variables required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client).

**Open question:** `@supabase/ssr` has not been officially tested against Next.js 16. Next.js 16 middleware API is unchanged from 15, so breakage is unlikely but should be validated in the first integration test.

### Expected Features

**Must have (v1.1 core — table stakes):**
- Magic link email auth via `supabase.auth.signInWithOtp()` — without this, nothing is user-scoped
- Chat auto-save on `onFinish` — users expect their work to survive a refresh
- Load chat history on page load via `initialMessages` — returning to `/chat/[id]` must restore full conversation
- Project list page (`/projects`) — returning users need a way to find previous estimates
- Estimate snapshot on calculate — foundation for versioning; save as immutable JSONB record

**Should have (v1.1 stretch — differentiators):**
- OTP fallback in same magic link email — critical for mobile users who switch devices
- Named projects (inline rename of chat title) — improves project list UX significantly
- Shareable read-only estimate links — estimate is a deliverable users hand to clients
- Floor plan storage migration — replace base64 data URLs with Supabase Storage URLs

**Defer to v2+:**
- Side-by-side estimate comparison — valuable but needs real users with multiple versions first
- Estimate version history UI — timeline view per chat
- Anon-to-auth session migration — complex state migration, low priority
- Shared link expiry/revoke — adds a cron job; defer until sharing patterns are validated
- Real-time sync across tabs — Supabase Realtime adds significant complexity for minimal gain in a single-user estimator

### Architecture Approach

The architecture adds three new layers to the existing stateless app without replacing any existing code. A middleware handles Supabase auth token refresh on every request. A `lib/supabase/` module exposes per-request server clients and a singleton browser client. A `lib/db/` module contains typed database access functions (`chats.ts`, `estimates.ts`, `shares.ts`). The existing `/api/chat` route handler gets two additions: an auth check at the top and an `onFinish` persistence call at the bottom. The existing calculation engine, pricing data, AI tools, and i18n modules are untouched.

**Major components:**
1. `src/middleware.ts` — Supabase cookie token refresh, `/chat/**` route protection, `/share/**` passthrough
2. `src/lib/supabase/{server,client}.ts` — Supabase client factories (per-request server, singleton browser)
3. `src/lib/db/{chats,estimates,shares}.ts` — Typed DB access layer; only called from Server Components and Route Handlers, never Client Components
4. `app/chat/[id]/page.tsx` — Server Component that loads saved messages and renders `ChatContent` client component
5. `app/share/[token]/page.tsx` — Public Server Component; reads estimate via anon key + RLS share token policy
6. `app/auth/{login,confirm}/` — Magic link request form + PKCE callback route
7. Supabase Postgres schema: `chats`, `messages`, `estimates`, `shares` tables with RLS enabled on all four
8. Supabase Storage: `floor-plans` private bucket with owner-scoped RLS (`{userId}/{chatId}/{filename}` path convention)

**Key data flow decisions:**
- Messages stored as JSONB in a `messages` table (one row per chat, full `UIMessage[]` array) — simplest for v1.1; migrate to normalized rows at 1k+ users
- Estimates stored as normalized rows with a `version` counter — independently addressable for share tokens
- Chat IDs generated via `nanoid()` on `/chat` entry, then redirected to `/chat/[id]` — stable URL from first message
- Never call Supabase Postgres from Client Components — all data access through Server Components or Route Handlers

### Critical Pitfalls

1. **SSR cookie mis-wiring in middleware** — Returning `NextResponse.next()` instead of the Supabase response object drops `Set-Cookie` headers. Auth appears to work until token expiry, then silently fails. Fix: always return `supabaseResponse` directly from the middleware function.

2. **`getSession()` instead of `getUser()` in server code** — `getSession()` reads cookies without re-validating the JWT with Supabase's auth server; it can be spoofed. Fix: always use `supabase.auth.getUser()` in Route Handlers and Server Components.

3. **`consumeStream()` not called before returning response** — When users close a tab mid-stream, `onFinish` never fires and the message is lost. Fix: call `result.consumeStream()` (without `await`) before `return result.toUIMessageStreamResponse()`.

4. **Base64 floor plan images persisted to JSONB** — A single floor plan causes a multi-megabyte database row. Fix: upload to Supabase Storage before persisting messages; replace data URLs with Storage paths in the message record.

5. **RLS policies missing or misconfigured** — RLS disabled = all data is public via anon key. RLS enabled with no policies = all queries silently return empty arrays (no error). Fix: enable RLS and write policies as the first step when creating each table. Test using the JS client, not the SQL Editor (which bypasses RLS).

6. **Magic link email scanner consumption** — Corporate email security tools pre-fetch links in emails, consuming single-use magic link tokens. Fix: use an intermediate redirect confirm page + offer OTP (6-digit code) as the primary flow since OTP is scanner-immune.

7. **Supabase server client initialized at module scope** — Vercel Fluid Compute reuses warm instances; a module-scope server client carries one user's session into another user's request. Fix: always initialize the server client inside the request handler function.

---

## Implications for Roadmap

Research identifies a strict dependency order. Auth infrastructure must exist before any data can be user-scoped. The database schema must be finalized before persistence code is written (migrating from JSONB-array to normalized messages later is expensive). Sharing requires persisted estimates to reference. Floor plan storage is independent and can be deferred.

### Phase 1: Supabase Auth Infrastructure

**Rationale:** Auth is required by every other feature. Nothing in v1.1 works without a `user_id` to scope data. This phase also wires the middleware and Supabase client factories — the most security-critical pieces. Pitfalls 1, 2, 6, and 7 all live here and must be addressed before any protected routes are built on top.

**Delivers:** Users can sign in via magic link email and maintain a session across page loads and tabs. Protected routes redirect unauthenticated users to `/auth/login`. Session refresh works transparently via middleware. `/share/**` routes explicitly excluded from auth protection.

**Addresses:** Magic link auth (table stakes P1), OTP fallback in email template (stretch P2)

**Avoids:** SSR cookie mis-wiring, CDN cache poisoning, module-scope session leak, magic link scanner consumption

**Research flag:** Skip additional research — well-documented with official guides and working code examples. Validate `@supabase/ssr` on Next.js 16 middleware in the first test (open question from STACK.md).

### Phase 2: Database Schema + Chat Persistence

**Rationale:** Schema design must be finalized before any persistence code is written. The core integration — `onFinish` + `consumeStream()` + `initialMessages` — is the mechanism everything else depends on. Chat persistence is the foundational feature; without it, there is no project list, no estimate versioning, and no shareable links.

**Delivers:** Chat conversations survive page refreshes, tab closes, and return visits. `/chat/[id]` restores full history via `initialMessages`. `consumeStream()` ensures messages are saved even on client disconnect.

**Addresses:** Chat auto-save (P1), load chat history (P1), estimate snapshot on calculate (P1)

**Avoids:** JSONB unbounded growth (normalize schema or sanitize base64 before insert), base64 images in JSONB (strip attachments or upload to Storage first), `consumeStream()` missing (client disconnect loss), RLS misconfiguration (enable on all four tables at creation time)

**Research flag:** Skip additional research — AI SDK `onFinish` + `consumeStream` pattern is in official docs. Schema decisions are fully specified in ARCHITECTURE.md.

### Phase 3: Project List + Named Projects

**Rationale:** Once persistence exists, users need a way to find previous conversations. The project list page is the minimum viable returning-user experience. Named projects add ~2 hours of work but meaningfully improve the UX.

**Delivers:** Authenticated users land on a project list showing their past estimates sorted by last activity. Users can rename chats from auto-generated titles to meaningful names.

**Addresses:** Project list page (P1), named projects/rename (stretch P2)

**Research flag:** Skip additional research — standard Supabase query pattern with RLS already in place from Phase 2.

### Phase 4: Shareable Estimate Links

**Rationale:** Shareable links require persisted estimate snapshots (Phase 2) to reference. The share token pattern + RLS anon read policy is the key design decision. Public `/share/[token]` routes must be excluded from auth middleware — this was pre-wired in Phase 1.

**Delivers:** Users can generate a `/share/{token}` URL from any saved estimate. Recipients (no account required) see a read-only cost breakdown. Token is generated server-side in the Route Handler.

**Addresses:** Shareable estimate links (stretch P2)

**Avoids:** Share tokens generated client-side (security risk), `/share/**` blocked by auth middleware, floor plan images exposed via raw storage paths (use signed URLs at render time)

**Research flag:** Skip additional research — RLS share token pattern and anon read policy are fully specified in ARCHITECTURE.md.

### Phase 5: Floor Plan Storage Migration (Optional for v1.1)

**Rationale:** Independent of other phases. Can be deferred without blocking v1.1 launch if the base64 sanitization mitigation is in place from Phase 2. Becomes urgent if floor plan uploads are active and messages are growing large.

**Delivers:** Floor plan images stored in private Supabase Storage bucket. Messages reference Storage URLs instead of multi-megabyte base64 strings. Prevents database bloat at scale.

**Addresses:** Floor plan Supabase Storage (stretch P2)

**Avoids:** Base64 images in database rows, large JSONB row performance degradation

**Research flag:** Skip additional research — Storage upload pattern and bucket RLS policies are fully specified in STACK.md and ARCHITECTURE.md.

### Phase Ordering Rationale

- Auth before everything: `user_id` is a required foreign key on all tables.
- Schema before code: the JSONB-array vs. normalized decision cannot be reversed cheaply after persistence is built.
- Project list before sharing: users need to navigate their own chats before sharing them with others.
- Floor plan storage last: base64 approach works if sanitized before JSONB insert; Storage migration is cleaner but not a launch blocker.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages are official Supabase libs with current documentation. Only uncertainty: `@supabase/ssr` pre-1.0 status on Next.js 16 (low risk — middleware API unchanged). |
| Features | HIGH | Auth and persistence patterns are well-established. MEDIUM on versioning UX and sharing — these need real user validation after launch. |
| Architecture | HIGH | Official Supabase SSR + AI SDK persistence docs confirm all patterns. System diagram and build order are internally consistent. |
| Pitfalls | HIGH | All critical pitfalls documented from official sources or widely reported community issues with known fixes. |

**Overall confidence:** HIGH

### Gaps to Address

- **`@supabase/ssr` on Next.js 16 validation:** Not officially confirmed by Supabase. Validate the middleware token refresh cycle in the first integration test before building protected routes on top of it.

- **`useChat` `initialMessages` serialization round-trip:** AI SDK v6 message format (with `parts` arrays, tool calls, tool results) must survive a JSONB serialize/deserialize cycle and produce objects the SDK treats as identical. Write a unit test for this before shipping persistence.

- **OTP email deliverability in Argentina:** Supabase's default SMTP is rate-limited (3 emails/hour free tier) with poor deliverability. Configure custom SMTP (Resend or Postmark) before real user testing — operational, not a code change.

- **JSONB vs. normalized messages schema tension:** ARCHITECTURE.md recommends JSONB-array for v1.1 (simplicity). PITFALLS.md warns against unbounded growth. Pragmatic resolution: use JSONB-array with base64 sanitization for v1.1, plan normalized migration for v2.

---

## Sources

### Primary (HIGH confidence)
- [Supabase Auth Quickstart for Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) — SSR setup, middleware, createServerClient/createBrowserClient
- [Supabase Creating a Client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — getAll/setAll cookie patterns
- [Supabase Passwordless Email Logins](https://supabase.com/docs/guides/auth/auth-email-passwordless) — signInWithOtp, verifyOtp, OTP vs magic link
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy syntax and testing guidance
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — private bucket + storage.objects RLS
- [AI SDK v6 Chat Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) — onFinish, consumeStream, initialMessages patterns
- [AI SDK v6 streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) — callback API
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.99.3 current as of 2026-03-20
- [@supabase/ssr CHANGELOG](https://github.com/supabase/ssr/blob/main/CHANGELOG.md) — v0.8.1 latest stable (2026-03-02)

### Secondary (MEDIUM confidence)
- [supabase-community/vercel-ai-chatbot](https://github.com/supabase-community/vercel-ai-chatbot) — reference implementation for Supabase + AI SDK chat persistence
- [Supabase MVP Architecture 2026](https://www.valtorian.com/blog/supabase-mvp-architecture) — Postgres-first, RLS-first patterns
- [Ryan Katayi — Server-Side Auth in Next.js with Supabase](https://www.ryankatayi.com/blog/server-side-auth-in-next-js-with-supabase-my-setup) — complete middleware + confirm route patterns (community, matches official docs)
- [Durable Sessions for AI apps (ElectricSQL)](https://electric-sql.com/blog/2026/01/12/durable-sessions-for-collaborative-ai) — concurrent tab / collaborative session patterns

### Tertiary (LOW confidence)
- [Supabase SSR issue #2015](https://github.com/supabase/auth/issues/2015) — documented gap in OTP + Next.js 15 App Router SSR; workarounds needed for some edge cases
- [Stream resumption issue (vercel/ai #11865)](https://github.com/vercel/ai/issues/11865) — tab switch / background app stream recovery known issue

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
