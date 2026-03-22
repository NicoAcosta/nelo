---
phase: 12-estimate-versioning
plan: "02"
subsystem: ui
tags: [react, shadcn, sheet, i18n, versioning, supabase, cost-breakdown]

# Dependency graph
requires:
  - phase: 12-01
    provides: saveEstimate, listEstimates, getEstimate, updateEstimateLabel, compareEstimates server actions and DB layer
provides:
  - Version badge pill on CostBreakdown ("vN of M") for every persisted estimate
  - "Version N saved — View history" auto-dismissing banner (8s) on CostBreakdown
  - VersionHistorySheet — right-side Sheet drawer with version list and comparison views
  - Inline label editing with optimistic updates (same pattern as ProjectRow)
  - Comparison table with per-category signed deltas, green/red color coding
  - Full EN/ES bilingual i18n keys for all version history UI strings
  - Sheet primitive (shadcn/ui adapted to project tokens)
affects: [any phase touching CostBreakdown, chat-content, or estimate-related UI]

# Tech tracking
tech-stack:
  added: [shadcn Sheet primitive (src/components/ui/sheet.tsx)]
  patterns:
    - useOptimistic + useTransition for inline label editing (same as ProjectRow pattern)
    - Auto-dismiss banner via useEffect setTimeout with cleanup
    - Lazy conversation resolution via getConversationIdAction (projectId -> conversationId)
    - Sheet opens from CostBreakdown trigger; VersionHistorySheet is a separate component

key-files:
  created:
    - src/components/ui/sheet.tsx
    - src/components/version-history-sheet.tsx
  modified:
    - src/components/cost-breakdown.tsx
    - src/app/chat/[id]/chat-content.tsx
    - src/lib/i18n/translations.ts
    - src/lib/actions/estimates.ts

key-decisions:
  - "Sheet primitive installed via shadcn CLI and adapted to project CSS tokens (--color-surface, --color-outline, --color-on-surface)"
  - "VersionHistorySheet accepts projectId (not conversationId) — resolves to UUID lazily via getConversationIdAction on sheet open"
  - "Comparison view fetches both full EstimateRow objects in parallel (Promise.all) then calls compareEstimates client-side"
  - "Banner auto-dismisses after 8s using useEffect + setTimeout; clicking 'View history' in banner also dismisses it and opens Sheet"

patterns-established:
  - "Version badge: bg-[#ccff00] text-black pill inserted before hero section in CostBreakdown"
  - "Sheet drawer: slides from right, Escape + backdrop click close, focus trap via shadcn Sheet"
  - "Delta color coding: positive (cost increase) = text-red-500, negative (savings) = text-green-500, zero = text-on-surface/40"

requirements-completed: [VERS-02, VERS-03, VERS-04]

# Metrics
duration: 45min
completed: 2026-03-22
---

# Phase 12 Plan 02: Estimate Versioning UI Summary

**Version history Sheet drawer with badge, saved banner, inline label editing, and per-category delta comparison table — all bilingual EN/ES**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-22T09:30:00Z
- **Completed:** 2026-03-22T09:59:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint — approved)
- **Files modified:** 6

## Accomplishments

- Sheet primitive installed and adapted to project CSS tokens; VersionHistorySheet built with list and comparison views
- CostBreakdown extended with version badge pill, auto-dismissing "Version N saved" banner, and Sheet trigger
- Chat-content updated to thread `_persistedId`, `_version`, and `projectId` props through to CostBreakdown
- Inline label editing with optimistic updates mirrors the established ProjectRow pattern
- Comparison view fetches two full estimate records in parallel, calls `compareEstimates`, and renders a delta table with red/green coloring and sr-only accessibility labels
- All 15 new UI strings added in both EN and ES to `translations.ts`

## Task Commits

Each task was committed atomically:

1. **Task 1: Sheet primitive + i18n keys + VersionHistorySheet** - `211acf1` (feat)
2. **Task 2: CostBreakdown version badge + chat-content prop threading** - `ca73332` (feat)
3. **Task 3: End-to-end version history verification** - checkpoint approved by user (no code commit)

## Files Created/Modified

- `src/components/ui/sheet.tsx` — shadcn Sheet primitive adapted to project CSS tokens
- `src/components/version-history-sheet.tsx` — Version history drawer with list view, comparison view, inline label editing
- `src/components/cost-breakdown.tsx` — Added version badge pill, saved banner, Sheet trigger; extended props interface
- `src/app/chat/[id]/chat-content.tsx` — Threads `_persistedId`, `_version`, `projectId` to CostBreakdown
- `src/lib/i18n/translations.ts` — 15 new versionHistory.* keys in EN and ES
- `src/lib/actions/estimates.ts` — Added `getConversationIdAction` to resolve projectId → conversationId

## Decisions Made

- Sheet accepts `projectId` instead of `conversationId` — lazily resolves the UUID via `getConversationIdAction` on sheet open. This keeps chat-content simple (it only knows projectId from the URL param).
- Comparison view fetches both EstimateRow objects in parallel with `Promise.all` then calls `compareEstimates` client-side — avoids a server round-trip for the diff calculation.
- Banner auto-dismisses at 8 seconds per the UI spec. Clicking "View history" in the banner also dismisses it immediately and opens the Sheet.
- Delta color convention: positive delta (cost increase) = `text-red-500`, negative (savings) = `text-green-500`, zero = `text-on-surface/40`. `sr-only` spans provide accessible context ("increase"/"decrease").

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. All Supabase actions were established in Plan 01.

## Next Phase Readiness

- Estimate versioning UI is fully functional end-to-end
- VersionHistorySheet, version badge, and saved banner are ready for any future plan that touches CostBreakdown
- No blockers for subsequent phases

---
*Phase: 12-estimate-versioning*
*Completed: 2026-03-22*
