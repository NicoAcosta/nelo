---
phase: 13-shareable-links-floor-plan-storage
plan: "01"
subsystem: data-layer
tags: [share-links, storage, supabase, tdd, nanoid]
dependency_graph:
  requires: []
  provides:
    - share-links-db-layer
    - share-links-server-actions
    - supabase-service-client
    - floor-plan-storage-upload
    - signed-url-injection
  affects:
    - src/lib/db/conversations.ts
    - src/app/api/documents/process/route.ts
    - src/app/chat/[id]/chat-content.tsx
tech_stack:
  added:
    - nanoid@5.1.7 (token generation)
  patterns:
    - TDD (RED → GREEN) for all new functions
    - Optional client param pattern (consistent with existing DB layer)
    - ExtUIMessage type alias for AI SDK v6 type compatibility
    - FloorPlanRefMetadata in message.metadata (AI SDK v6 compatible alternative to annotations)
key_files:
  created:
    - src/lib/db/share-links.ts
    - src/lib/actions/share-links.ts
    - src/lib/supabase/service.ts
    - src/components/ui/popover.tsx
    - supabase/migrations/0006_check_share_token.sql
    - src/lib/db/__tests__/share-links.test.ts
    - src/lib/documents/__tests__/storage-path.test.ts
  modified:
    - src/lib/db/conversations.ts
    - src/app/api/documents/process/route.ts
    - src/app/chat/[id]/chat-content.tsx
    - package.json
    - package-lock.json
decisions:
  - "FloorPlanRefMetadata stored in message.metadata (not annotations) — AI SDK v6 sendMessage API does not support annotations param; metadata is the correct v6 pattern"
  - "Custom Popover component (no Radix/shadcn CLI) — project uses custom components without components.json; follows existing Sheet component pattern"
  - "injectSignedUrls reads from metadata.floorPlanRefs — consistent with AI SDK v6 UIMessage type; previous annotations approach was v5-era"
metrics:
  duration: "10 min"
  completed_date: "2026-03-22"
  tasks_completed: 2
  files_created: 7
  files_modified: 5
  tests_added: 27
---

# Phase 13 Plan 01: Share Links Data Layer + Floor Plan Storage Summary

Share link CRUD with D-04 duplicate prevention, check_share_token migration for expired-vs-not-found distinction, Supabase service-role client, nanoid token generation, Storage upload in document processing route, and signed URL injection in loadConversation using AI SDK v6 metadata pattern.

## What Was Built

### Task 1: Share Links Data Layer (TDD)

**Migration `0006_check_share_token.sql`:** Adds `check_share_token(token TEXT)` SECURITY DEFINER function returning `{ token_exists, token_expired }`. Enables the share page to distinguish between expired links and not-found links (D-12). Grants EXECUTE to `anon`.

**`src/lib/supabase/service.ts`:** Service-role Supabase client using `SUPABASE_SERVICE_ROLE_KEY`. No singleton caching — fresh client per call (avoids stale state in serverless). For use on the anonymous share page.

**`src/lib/db/share-links.ts`:** Full DB layer:
- `getShareLink(token)` — calls `get_share_link` RPC (security-definer, filters expired)
- `getShareLinkByEstimateId(estimateId)` — maybeSingle lookup for D-04
- `createShareLink(estimateId, expiresInDays)` — nanoid(12) token, optional expires_at
- `deleteShareLink(shareLinkId)` — throws on error
- `checkShareToken(token)` — calls `check_share_token` RPC

**`src/lib/actions/share-links.ts`:** Server actions:
- `createShareLinkAction` — D-04: returns existing link if found, else creates new
- `getShareLinkForEstimateAction` — read-only lookup
- `deleteShareLinkAction` — UUID validation, revalidatePath

**`src/components/ui/popover.tsx`:** Custom Popover component (Sheet-style, no Radix) for use by Plan 13-02 share UI.

**18 tests, all pass.**

### Task 2: Floor Plan Storage Upload + Signed URL Injection (TDD)

**`buildStoragePath(userId, projectId, fileName)`:** Pure function producing `floor-plans/{userId}/{projectId}/{nanoid}.{ext}` with lowercase extension. Added to `conversations.ts`.

**`/api/documents/process` route update:** Now accepts `projectId` from FormData. After `processDocument()`, uploads each file with a `renderedImage` to Supabase Storage `floor-plans` bucket. Upload failure is non-fatal — base64 data URL still returned for AI vision. Returns `{ ...result, storagePath }` when upload succeeds.

**`injectSignedUrls(messages, client?)`:** Maps over messages, reads `metadata.floorPlanRefs`, creates signed URLs (1-hour TTL) from Storage, replaces `[image-stripped]` attachment URLs. Messages without refs pass through unchanged. Wired into `loadConversation` before return.

**`chat-content.tsx` update:** Sends `projectId` in FormData. Stores `floorPlanRefs` in `sendMessage({ metadata })` — AI SDK v6 compatible (not `annotations` which is not in v6 type).

**9 tests, all pass.**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AI SDK v6 sendMessage does not accept `annotations` param**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** Plan specified storing storage paths in `message.annotations`. AI SDK v6 `sendMessage` API only accepts `{ text, files, metadata }` — `annotations` is a v5-era field not in the v6 type system
- **Fix:** Changed to `FloorPlanRefMetadata` stored in `message.metadata`. Updated `injectSignedUrls` to read from `metadata.floorPlanRefs`. TypeScript-clean with zero runtime behavior change
- **Files modified:** `src/lib/db/conversations.ts`, `src/app/chat/[id]/chat-content.tsx`, `src/lib/documents/__tests__/storage-path.test.ts`
- **Commit:** `0314fdd`

**2. [Rule 3 - Blocking] No components.json for shadcn CLI**
- **Found during:** Task 1 — `npx shadcn@latest add popover` prompted interactively
- **Issue:** Project has no `components.json`; shadcn CLI requires interactive init
- **Fix:** Created custom Popover component following existing Sheet component pattern (no Radix dependency)
- **Files modified:** `src/components/ui/popover.tsx`
- **Commit:** `baefde2`

**3. [Rule 1 - Bug] popover.tsx TypeScript unreachable comparison**
- **Found during:** `npx tsc --noEmit` after Task 2
- **Issue:** `side === "top"` branch inside `side === "left" | "right"` check — TypeScript correctly flagged this as unreachable
- **Fix:** Simplified positioning transform logic to remove the unreachable branch
- **Files modified:** `src/components/ui/popover.tsx`
- **Commit:** `0314fdd`

## Known Stubs

None — no placeholder data or stub values introduced by this plan.

## Deferred Items (Out of Scope)

Pre-existing test failures logged to `deferred-items.md`:
1. `chat-options.test.tsx` — wrong import path for `get-selected-value`
2. `dwg-converter.test.ts` — converter error handling changed, assertions outdated

## Self-Check: PASSED

All created files exist on disk. Both task commits verified in git log:
- `baefde2` — Task 1: share-links data layer, service client, migration, Popover
- `0314fdd` — Task 2: Storage upload + signed URL injection
