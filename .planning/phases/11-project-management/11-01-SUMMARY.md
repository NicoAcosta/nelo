---
phase: 11-project-management
plan: 01
subsystem: database
tags: [supabase, server-actions, i18n, tdd, vitest]

# Dependency graph
requires:
  - phase: 10-chat-persistence
    provides: conversations.ts createClient pattern, Supabase projects table

provides:
  - listProjects() function returning ProjectSummary[] sorted by updated_at DESC
  - ProjectSummary type exported from conversations.ts
  - updateProjectTitle() server action with validation and revalidatePath
  - projects.* i18n keys in EN and ES (8 keys each)

affects: [11-02-project-management-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS-scoped Supabase queries — no userId param, auth enforced by row-level security"
    - "Server action validation pattern — trim, empty check, length check before DB call"
    - "revalidatePath('/projects') after mutation to bust Next.js cache"

key-files:
  created:
    - src/lib/actions/projects.ts
    - src/lib/actions/__tests__/projects.test.ts
  modified:
    - src/lib/db/conversations.ts
    - src/lib/db/__tests__/conversations.test.ts
    - src/lib/i18n/translations.ts

key-decisions:
  - "listProjects() takes no userId — RLS on projects table scopes results to authenticated user automatically"
  - "updateProjectTitle() trims before validating — consistent with how titles are displayed"

patterns-established:
  - "Server actions live in src/lib/actions/ — separate from db query functions in src/lib/db/"
  - "Supabase mock pattern: mockFrom dispatches by table name to distinct mock chains"

requirements-completed: [PERS-03, PERS-04]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 11 Plan 01: Project Management Data Layer Summary

**Supabase data layer for project list: listProjects() query, updateProjectTitle() server action with trim/validation, and 16 i18n keys (EN+ES) — all TDD with 22 passing tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T07:49:12Z
- **Completed:** 2026-03-22T07:51:34Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `listProjects()` queries `projects` table via RLS-scoped client, returns `ProjectSummary[]` sorted by `updated_at DESC`, returns `[]` for no data, throws on error
- `updateProjectTitle()` server action trims input, validates empty/over-100-chars, calls Supabase update, calls `revalidatePath("/projects")` on success
- 10 new unit tests (3 for `listProjects`, 7 for `updateProjectTitle`) all pass; 12 pre-existing tests unbroken (22 total in target files)
- 16 i18n entries (8 keys × EN + ES) for the projects page UI

## Task Commits

Each task was committed atomically:

1. **Task 1: listProjects() and updateProjectTitle() with TDD tests** - `a1d63a4` (feat)
2. **Task 2: Add projects page i18n keys in EN and ES** - `06d2386` (feat)

## Files Created/Modified
- `src/lib/db/conversations.ts` - Added `ProjectSummary` type and `listProjects()` export
- `src/lib/db/__tests__/conversations.test.ts` - Added `describe("listProjects")` block (3 tests)
- `src/lib/actions/projects.ts` - New server action file with `updateProjectTitle()`
- `src/lib/actions/__tests__/projects.test.ts` - New test file (7 tests for updateProjectTitle)
- `src/lib/i18n/translations.ts` - Added 8 `projects.*` keys to both EN and ES objects

## Decisions Made
- `listProjects()` takes no userId parameter — RLS enforces user scoping at the DB level, consistent with the existing `loadConversation` / `saveConversation` pattern
- `updateProjectTitle()` lives in `src/lib/actions/` (not `src/lib/db/`) to separate server actions (mutations with revalidation) from pure DB query functions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Two pre-existing unrelated test failures in the full suite (`chat-options.test.tsx` missing module import, `sidebar.test.tsx` text mismatch) — out of scope, existed before this plan. All 22 tests in the target files pass.

## Known Stubs

None — `listProjects()` and `updateProjectTitle()` are fully wired to Supabase. The UI layer (Plan 02) will consume these functions.

## Next Phase Readiness
- Data layer is complete and tested — Plan 02 can import `listProjects` from `@/lib/db/conversations` and `updateProjectTitle` from `@/lib/actions/projects`
- All i18n keys are available for the projects page components
- No blockers

---
*Phase: 11-project-management*
*Completed: 2026-03-22*
