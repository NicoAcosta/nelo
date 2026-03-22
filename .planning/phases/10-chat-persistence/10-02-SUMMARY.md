---
phase: 10-chat-persistence
plan: "02"
subsystem: ui
tags: [next.js, supabase, ai-sdk, useChat, server-components, routing]

# Dependency graph
requires:
  - phase: 10-chat-persistence-01
    provides: loadConversation, saveConversation, DB access layer, Supabase migrations

provides:
  - /chat Server Component redirect that creates a project row and redirects to /chat/[uuid]
  - /chat/[id] Server Component that loads conversation history via loadConversation
  - ChatContent Client Component with useChat initialised from saved messages and conversationId in transport body
  - getSelectedValue helper co-located with ChatContent in /chat/[id]/

affects:
  - phase-11-sharing (chat URL structure is /chat/[id])
  - any future plan adding routes that need stable chat URLs

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component loads data + Client Component renders it (RSC split for chat)"
    - "crypto.randomUUID() for project IDs (matches Supabase UUID primary key)"
    - "DefaultChatTransport body includes conversationId for server-side persistence"
    - "useChat messages prop (not initialMessages) for AI SDK v6 hydration"

key-files:
  created:
    - src/app/chat/[id]/page.tsx
    - src/app/chat/[id]/chat-content.tsx
    - src/app/chat/[id]/get-selected-value.ts
  modified:
    - src/app/chat/page.tsx

key-decisions:
  - "Server Component at /chat creates project row before redirect — avoids race condition where /chat/[id] arrives before project exists"
  - "useChat messages prop (not initialMessages) is the correct AI SDK v6 API for hydrating saved history"
  - "conversationId forwarded in DefaultChatTransport body so route handler can persist without URL param coupling"

patterns-established:
  - "RSC split: page.tsx loads data, chat-content.tsx renders — keeps Server Components free of client hooks"
  - "?q= param forwarded through /chat redirect to /chat/[id] — landing page auto-send flow preserved"

requirements-completed: [PERS-02]

# Metrics
duration: ~30min
completed: 2026-03-22
---

# Phase 10 Plan 02: Chat Persistence Routing Summary

**RSC split routing: /chat creates Supabase project + redirects to /chat/[uuid], /chat/[id] hydrates full message history from DB before first render**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-22T07:00:00Z
- **Completed:** 2026-03-22T07:30:00Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments

- Replaced monolithic `"use client"` /chat page with a Server Component redirect that creates a Supabase project row and redirects to `/chat/[uuid]`
- Created `/chat/[id]` Server Component that loads full conversation history via `loadConversation` and passes it to the Client Component
- Extracted `ChatContent` into its own `chat-content.tsx` with `conversationId` wired into `DefaultChatTransport` body so every AI SDK request carries the project ID for server-side persistence
- Human verified: messages survive page refresh, tool results render after reload, Supabase dashboard shows saved project and conversation rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /chat redirect page and /chat/[id] Server Component + Client Component** - `bd4fa2b` (feat)
2. **Task 2: Verify end-to-end chat persistence** - checkpoint approved by user (no code commit)

## Files Created/Modified

- `src/app/chat/page.tsx` - Server Component redirect: inserts projects row, reads ?q= param, redirects to /chat/[uuid]
- `src/app/chat/[id]/page.tsx` - Server Component loader: loads conversation history, renders ChatContent
- `src/app/chat/[id]/chat-content.tsx` - Client Component: full chat UI with useChat hydrated from DB messages and conversationId in transport
- `src/app/chat/[id]/get-selected-value.ts` - Moved helper (getSelectedValue) co-located with chat-content

## Decisions Made

- Server Component at /chat creates the project row before redirect so /chat/[id] always finds a valid project
- `useChat({ messages: initialMessages })` not `initialMessages` prop — AI SDK v6 naming convention
- `conversationId` in `DefaultChatTransport` body decouples persistence from URL structure

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Chat persistence is fully wired end-to-end: create → redirect → load → save on each response
- /share/[id] routes can now be built on top of the stable /chat/[id] URL structure
- Conversation history survives page refresh and new tab opens

---
*Phase: 10-chat-persistence*
*Completed: 2026-03-22*
