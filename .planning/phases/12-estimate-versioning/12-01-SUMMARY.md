---
phase: 12-estimate-versioning
plan: 01
subsystem: database
tags: [supabase, postgres, estimates, versioning, server-actions, vitest, tdd]

# Dependency graph
requires:
  - phase: 10-chat-persistence
    provides: "conversations table, saveConversation pattern, Supabase client pattern"
  - phase: 11-project-management
    provides: "server actions pattern in src/lib/actions/, projects DB functions"
provides:
  - "saveEstimate: inserts versioned estimate snapshot with auto-increment"
  - "listEstimates: returns EstimateSummary[] ordered by version DESC"
  - "getEstimate: fetches full EstimateRow by ID, null on PGRST116"
  - "updateEstimateLabel: updates estimate label field"
  - "getConversationId: resolves conversation UUID from project_id"
  - "compareEstimates: pure function returning per-category and summary deltas"
  - "listEstimatesAction, getEstimateAction, updateEstimateLabelAction: server actions with UUID validation"
  - "createChatTools extended with ChatToolOptions (conversationId + saveEstimate callback)"
  - "route.ts wired to resolve conversationId and pass saveEstimate callback"
affects: [12-estimate-versioning, 12-02-estimate-versioning-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DB functions in src/lib/db/ accept optional SupabaseServerClient param (same as conversations.ts)"
    - "Server actions in src/lib/actions/ do UUID validation before calling DB functions"
    - "Tool persistence via callback option — supabase client bound at route handler level, never created inside execute"
    - "Version auto-increment via MAX(version) query + null-safe fallback (maxRow?.version ?? 0) + 1"

key-files:
  created:
    - src/lib/db/estimates.ts
    - src/lib/db/__tests__/estimates.test.ts
    - src/lib/estimate/compare.ts
    - src/lib/estimate/__tests__/compare.test.ts
    - src/lib/actions/estimates.ts
    - src/lib/actions/__tests__/estimates.test.ts
    - supabase/migrations/0004_estimates_conversation_index.sql
  modified:
    - src/lib/ai/tools.ts
    - src/app/api/chat/route.ts

key-decisions:
  - "Migration named 0004 (not 0003) because idx_estimates_conversation_id was already created in 0003_postgres_audit_fixes.sql — used IF NOT EXISTS for idempotency"
  - "Persistence runs inside tool execute (not onFinish) so estimates are saved even if user closes tab mid-stream (D-01)"
  - "saveEstimate callback bound to pre-created supabase client at route level — never createClient() inside tool execute (RESEARCH pitfall 1)"
  - "chatTools export unchanged (backward-compatible) — options param is optional"

patterns-established:
  - "ChatToolOptions pattern: optional second arg to createChatTools for persistence side-effects"
  - "Tool execute returns Estimate & { _persistedId, _version } when persistence succeeds — structural typing, transparent to callers"

requirements-completed: [VERS-01, VERS-03, VERS-04]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 12 Plan 01: Estimate Versioning Data Layer Summary

**Supabase estimate versioning data layer: save/list/get/updateLabel DB functions, compareEstimates pure function, server actions with UUID validation, and runEstimate tool wired to persist snapshots via callback**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T09:23:13Z
- **Completed:** 2026-03-22T09:27:54Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Full estimates DB layer (saveEstimate with auto-version, listEstimates, getEstimate, updateEstimateLabel, getConversationId) with 21 unit tests
- compareEstimates pure function computes per-category and summary deltas, handles missing categories from either side, avoids division-by-zero
- Server actions (listEstimatesAction, getEstimateAction, updateEstimateLabelAction) with UUID validation, label trimming, and revalidatePath — 16 unit tests
- runEstimate tool extended with ChatToolOptions; persists estimate to DB via callback and returns _persistedId/_version; route.ts resolves conversationId before streamText

## Task Commits

1. **TDD RED — estimates + compare tests** - `b424907` (test)
2. **Task 1: DB functions + compare logic** - `564720e` (feat)
3. **TDD RED — actions tests** - `f9ff23a` (test)
4. **Task 2: Server actions + tool/route wiring** - `f829e2f` (feat)

## Files Created/Modified

- `src/lib/db/estimates.ts` - saveEstimate, listEstimates, getEstimate, updateEstimateLabel, getConversationId
- `src/lib/db/__tests__/estimates.test.ts` - 21 tests covering all DB functions
- `src/lib/estimate/compare.ts` - compareEstimates, EstimateComparison, CategoryDelta
- `src/lib/estimate/__tests__/compare.test.ts` - 7 tests covering deltas, missing categories, zero-division
- `src/lib/actions/estimates.ts` - listEstimatesAction, getEstimateAction, updateEstimateLabelAction
- `src/lib/actions/__tests__/estimates.test.ts` - 16 tests for UUID validation, label rules, error paths
- `supabase/migrations/0004_estimates_conversation_index.sql` - CREATE INDEX IF NOT EXISTS (idempotent)
- `src/lib/ai/tools.ts` - ChatToolOptions interface, createChatTools(locale, options?) signature, persistence in runEstimate execute
- `src/app/api/chat/route.ts` - getConversationId call, saveEstimate callback passed to createChatTools

## Decisions Made

- Migration named `0004` because `idx_estimates_conversation_id` was already created in `0003_postgres_audit_fixes.sql`. Used `IF NOT EXISTS` to be idempotent on all environments.
- Persistence runs in tool `execute` (not `onFinish`) per D-01 — ensures estimates are saved even on tab close mid-stream.
- The supabase client is bound at route handler level and passed via callback — never `createClient()` inside the tool execute function (per RESEARCH pitfall 1).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Naming Conflict] Migration renamed from 0003 to 0004**
- **Found during:** Task 1 (migration file creation)
- **Issue:** Plan specified `0003_estimates_conversation_index.sql` but `0003_postgres_audit_fixes.sql` already existed and contained the same `CREATE INDEX idx_estimates_conversation_id`
- **Fix:** Created `0004_estimates_conversation_index.sql` with `CREATE INDEX IF NOT EXISTS` for idempotency
- **Files modified:** supabase/migrations/0004_estimates_conversation_index.sql
- **Verification:** Migration file created with correct content; existing 0003 unchanged
- **Committed in:** 564720e

---

**Total deviations:** 1 auto-fixed (naming conflict)
**Impact on plan:** Necessary to avoid file name collision. Idempotent index creation is strictly safer than the plan's original version.

## Issues Encountered

Two pre-existing test failures in `chat-options.test.tsx` and `sidebar.test.tsx` were found during full suite run. Both confirmed pre-existing via git stash. Logged to `deferred-items.md`. Not caused by this plan's changes.

## Known Stubs

None — all DB functions are fully wired to real Supabase queries.

## Next Phase Readiness

- All exports (saveEstimate, listEstimates, getEstimate, updateEstimateLabel, getConversationId, compareEstimates, server actions) ready for 12-02 UI plan to consume
- runEstimate tool persists automatically — UI plan can read _persistedId/_version from tool result
- Full test coverage (37 new tests) protects against regressions

---
*Phase: 12-estimate-versioning*
*Completed: 2026-03-22*

## Self-Check: PASSED

All files present. All commits exist. 37 tests pass (0 new failures).
