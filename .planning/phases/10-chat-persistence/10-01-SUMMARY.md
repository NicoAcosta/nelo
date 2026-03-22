---
phase: 10-chat-persistence
plan: "01"
subsystem: database
tags: [supabase, postgres, jsonb, upsert, ai-sdk, persistence, conversations]

# Dependency graph
requires:
  - phase: 09-supabase-auth-infrastructure
    provides: Supabase createClient, projects/conversations schema, RLS policies, auth guard in chat route

provides:
  - Unique index on conversations.project_id enabling upsert
  - saveConversation and loadConversation DB access layer with base64 stripping
  - consumeStream + onFinish wiring in chat route handler for tab-close-safe persistence
  - Auto-title from first user message when title is still "New Project"

affects:
  - 10-02-chat-route-parameterization
  - any phase using conversations DB layer

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DB access layer in src/lib/db/ — thin wrappers around Supabase queries, no ORM"
    - "consumeStream() before return — ensures onFinish fires on tab close"
    - "stripBase64Attachments before upsert — prevents multi-MB JSONB rows"

key-files:
  created:
    - supabase/migrations/0002_conversations_unique_project_id.sql
    - src/lib/db/conversations.ts
    - src/lib/db/__tests__/conversations.test.ts
  modified:
    - src/app/api/chat/route.ts

key-decisions:
  - "JSONB messages stored as UIMessage[] array per project — normalize only at 1k+ users"
  - "base64 images stripped before upsert, stored as [image-stripped] placeholder — full Storage upload deferred to Phase 13"
  - "consumeStream() called without await before return — detaches persistence from client HTTP connection"
  - "onFinish on toUIMessageStreamResponse (not streamText) — receives UIMessage[] format for correct client-side hydration"

patterns-established:
  - "saveConversation: strips base64, auto-titles, upserts messages JSONB"
  - "loadConversation: RLS-guarded project check, returns null/[]/messages"

requirements-completed: [PERS-01]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 10 Plan 01: Persistence Backend Summary

**Supabase upsert migration, save/load DB layer with base64 stripping, and consumeStream+onFinish wired into chat route for tab-close-safe auto-save**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T06:54:16Z
- **Completed:** 2026-03-22T06:56:53Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Migration adds unique index on `conversations.project_id` enabling upsert without duplicates
- `saveConversation` and `loadConversation` implemented with full test coverage (12 tests, mocked Supabase)
- `stripBase64Attachments` prevents multi-MB JSONB rows from floor plan uploads
- `getTextFromMessage` extracts text for auto-titling projects from first user message
- Chat route handler updated: reads `conversationId` from body, calls `result.consumeStream()` before return, persists via `onFinish` callback

## Task Commits

1. **Task 1: Migration + DB access layer (TDD)** - `273d924` (feat)
2. **Task 2: Wire onFinish + consumeStream into chat route** - `dbc8998` (feat)

**Plan metadata:** (to be created by final commit)

## Files Created/Modified

- `supabase/migrations/0002_conversations_unique_project_id.sql` - Unique index on conversations.project_id for upsert support
- `src/lib/db/conversations.ts` - saveConversation, loadConversation, stripBase64Attachments, getTextFromMessage
- `src/lib/db/__tests__/conversations.test.ts` - 12 unit tests with mocked Supabase client
- `src/app/api/chat/route.ts` - Added saveConversation import, conversationId extraction, consumeStream, onFinish

## Decisions Made

- `onFinish` placed on `toUIMessageStreamResponse` (not `streamText`) — receives `UIMessage[]` format with parts/tool-calls, correct for re-hydrating with `useChat({ messages })`
- `consumeStream()` without await before `return` — standard AI SDK v6 pattern for tab-close resilience
- Placeholder `[image-stripped]` replaces base64 data URLs — full Supabase Storage upload deferred to Phase 13 (SHARE-03)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing sidebar test failure (`sidebar.test.tsx` — "Nelo AI" / "Project Architect" text mismatch) confirmed to exist before this plan's changes. Out of scope per deviation rules, logged as deferred.

## Known Stubs

None — all DB functions are fully wired. `[image-stripped]` is an intentional placeholder (documented above), not a stub blocking the plan's goal.

## User Setup Required

None — no external service configuration required beyond what Phase 9 provisioned.

## Next Phase Readiness

- Plan 10-02 can now wire `conversationId` into the chat UI transport and load history in the Server Component
- `loadConversation(projectId, userId)` returns `null | [] | UIMessage[]` — ready for Server Component consumption
- Migration `0002` must be applied to Supabase before live persistence works (dev: `supabase db reset` or `supabase migration up`)

---
*Phase: 10-chat-persistence*
*Completed: 2026-03-22*
