---
phase: 13-shareable-links-floor-plan-storage
plan: "02"
subsystem: ui
tags: [share, popover, public-page, server-component, supabase, rls, i18n]

requires:
  - phase: 13-01
    provides: ShareLinkRow interface, createShareLinkAction, deleteShareLinkAction, getShareLinkForEstimateAction, getShareLink, checkShareToken, createServiceClient

provides:
  - SharePopover client component with create/copy/revoke flow
  - Public /share/[token] Server Component page
  - EstimateTopbar updated with estimateId prop and SharePopover integration
  - share.* i18n keys in EN + ES

affects:
  - Any future plan touching estimate rendering, topbar, or public pages

tech-stack:
  added:
    - "@testing-library/user-event (dev)"
  patterns:
    - Server Component fetching via service-role client to bypass RLS for public pages
    - Popover state managed locally in client component (open/fetch on open)
    - Accept-Language header for server-side locale detection on unauthenticated pages
    - Inline confirmation pattern (no dialog) for destructive action in popover

key-files:
  created:
    - src/components/estimate/share-popover.tsx
    - src/app/share/[token]/page.tsx
    - src/components/estimate/__tests__/share-popover.test.tsx
    - src/app/share/__tests__/share-page.test.tsx
  modified:
    - src/components/estimate/estimate-topbar.tsx
    - src/app/estimate/[id]/estimate-dashboard.tsx
    - src/app/estimate/[id]/page.tsx
    - src/lib/i18n/translations.ts

key-decisions:
  - "SharePopover fetches existing link on popover open (not on mount) — avoids unnecessary server action calls"
  - "Share page uses service-role client inline (not getEstimate()) — anon client blocked by RLS"
  - "Accept-Language header for locale detection on share page — useLocale hook unavailable in Server Components"
  - "Inline revoke confirmation (Are you sure? + Yes, revoke) — no dialog/modal, GitHub-style UX"
  - "estimateId prop on EstimateTopbar; falls back to clipboard copy when absent — backward-compatible"

patterns-established:
  - "Inline revoke confirmation: setConfirmRevoke(true) -> show text + confirm button inline in popover"
  - "Service client pattern: createServiceClient() called inline in Server Component for RLS bypass"

requirements-completed:
  - SHARE-01
  - SHARE-02

duration: 8min
completed: 2026-03-22
---

# Phase 13 Plan 02: Share Popover UI and Public Share Page Summary

**SharePopover client component with expiration presets and revoke flow, plus public /share/[token] Server Component page rendering read-only cost breakdowns without auth**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-22T11:04:36Z
- **Completed:** 2026-03-22T11:12:36Z
- **Tasks:** 2 of 2 (Task 3 is a human-verify checkpoint)
- **Files modified:** 8

## Accomplishments

- SharePopover renders Create/Copy/Revoke flows with 4 expiration presets (none, 7, 30, 90 days) wired to server actions from Plan 13-01
- Public /share/[token] page fetches share link via security-definer RPC, uses service-role client to bypass RLS for estimate data, shows expired/not-found states
- EstimateTopbar updated with `estimateId` prop; `persistedId` wired through from estimate page via `extractEstimateFromMessages`
- 14 unit tests across 2 test files — all passing (TDD green phase)

## Task Commits

1. **Task 1: SharePopover component and EstimateTopbar integration** - `8b2a789` (feat)
2. **Task 2: Public /share/[token] page with expired and not-found states** - `3fdc9a4` (feat)

## Files Created/Modified

- `src/components/estimate/share-popover.tsx` - Client component; Popover with create/copy/revoke; fetches existing link on open
- `src/app/share/[token]/page.tsx` - Public Server Component; valid/expired/not-found branching; service-role client for estimate fetch
- `src/components/estimate/__tests__/share-popover.test.tsx` - 8 unit tests for SharePopover rendering and server action calls
- `src/app/share/__tests__/share-page.test.tsx` - 6 unit tests for share page data-fetch conditional logic
- `src/components/estimate/estimate-topbar.tsx` - Added `estimateId?: string` prop; renders SharePopover when provided
- `src/app/estimate/[id]/estimate-dashboard.tsx` - Added `estimateId?: string` prop threading
- `src/app/estimate/[id]/page.tsx` - Extracts `_persistedId` from estimate and passes as `estimateId`
- `src/lib/i18n/translations.ts` - Added 17 `share.*` keys in both EN and ES

## Decisions Made

- SharePopover fetches existing link on popover open (not component mount) — avoids unnecessary server action calls until user actually clicks Share
- Share page uses `createServiceClient()` inline rather than `getEstimate()` — the db helper creates an anon client which is blocked by RLS on the estimates table for unauthenticated requests
- Accept-Language header detection for locale on share page — `useLocale` hook is client-only; Share page is a Server Component with no auth session
- Inline revoke confirmation rather than a dialog — GitHub-style popover feel per plan spec (D-06)
- `estimateId` is optional on EstimateTopbar — falls back to clipboard copy when estimate hasn't been persisted yet, maintaining backward compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @testing-library/user-event dependency**
- **Found during:** Task 1 (SharePopover unit tests)
- **Issue:** Tests import `userEvent` from `@testing-library/user-event` but package not installed
- **Fix:** `npm install --save-dev @testing-library/user-event`
- **Files modified:** package.json, package-lock.json
- **Verification:** Tests compile and run successfully
- **Committed in:** 8b2a789 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added LocaleProvider wrapper to test renders**
- **Found during:** Task 1 (first test run)
- **Issue:** `useLocale` throws when no `LocaleProvider` ancestor — all component renders failed
- **Fix:** Added `renderWithLocale()` helper wrapping `<LocaleProvider>` around all test renders
- **Files modified:** src/components/estimate/__tests__/share-popover.test.tsx
- **Verification:** 8/8 tests pass after fix
- **Committed in:** 8b2a789 (Task 1 commit)

**3. [Rule 1 - Bug] Added Estimate import to estimate page**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `Estimate` type used in type cast but not imported in `src/app/estimate/[id]/page.tsx`
- **Fix:** Added `import type { Estimate } from "@/lib/estimate/types"`
- **Files modified:** src/app/estimate/[id]/page.tsx
- **Verification:** `npx tsc --noEmit` shows no errors in this file
- **Committed in:** 8b2a789 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 missing critical, 1 bug)
**Impact on plan:** All auto-fixes necessary for tests to run and TypeScript to compile. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Known Stubs

None — SharePopover wires to real server actions from Plan 13-01. Share page fetches real data from Supabase. No placeholder/mock data flows to UI rendering.

## Next Phase Readiness

- Task 3 is a human-verify checkpoint — requires end-to-end verification of the full share flow
- All code is complete; awaiting human sign-off via checkpoint before marking plan fully done
- Phase 13 will be complete after checkpoint approval

---
*Phase: 13-shareable-links-floor-plan-storage*
*Completed: 2026-03-22*
