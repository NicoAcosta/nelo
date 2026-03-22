---
phase: 11-project-management
plan: "02"
subsystem: projects-ui
tags: [projects, ui, server-component, client-component, inline-edit, optimistic-update, navigation]
dependency_graph:
  requires: ["11-01"]
  provides: ["/projects page UI", "ProjectList component", "inline title rename", "sidebar/mobile-nav /projects link"]
  affects: ["src/components/sidebar.tsx", "src/components/mobile-nav.tsx"]
tech_stack:
  added: []
  patterns: ["useOptimistic + useTransition for optimistic inline edit", "Server Component fetches data → passes to Client Component", "Intl.RelativeTimeFormat for locale-aware timestamps"]
key_files:
  created:
    - src/app/projects/project-list.tsx
  modified:
    - src/app/projects/page.tsx
    - src/components/sidebar.tsx
    - src/components/mobile-nav.tsx
decisions:
  - "KeyboardEvent typed as KeyboardEvent<HTMLInputElement> — required for TypeScript to resolve .blur() on currentTarget"
  - "formatRelativeTime uses Intl.RelativeTimeFormat (built-in) — no date library added"
  - "Pre-existing build failure in conversations.ts (experimental_attachments type) deferred — out of scope"
metrics:
  duration_seconds: 142
  completed_date: "2026-03-22"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 4
status: complete
---

# Phase 11 Plan 02: Projects Page UI Summary

**One-liner:** Projects page with Server Component data fetch, ProjectList Client Component with useOptimistic inline rename, empty state, and navigation links updated to /projects.

## Tasks Completed

### Task 1: Projects page Server Component + ProjectList Client Component
- **Commit:** `65e6afc`
- **Files:** `src/app/projects/page.tsx`, `src/app/projects/project-list.tsx`
- Replaced placeholder `page.tsx` with full Server Component: auth check via `getUser()`, `listProjects()` call, layout shell matching chat page (Sidebar + Header + main + MobileNav)
- Created `project-list.tsx` as Client Component with:
  - `useOptimistic` for instant title update + revert on error
  - `ProjectRow` internal component with click-to-edit, `handleBlur` save, `handleKeyDown` (Enter/Escape)
  - `formatRelativeTime` helper using `Intl.RelativeTimeFormat` (no library)
  - Empty state: `IconEstimates` icon + "No projects yet" + CTA link to `/chat`
  - Staggered `animate-message-in` on rows (capped at index 5)
  - Responsive "Open" button: text on md+, arrow on mobile
  - `role="alert"` on error messages, `aria-label="Project title"` on edit input

### Task 2: Update sidebar and mobile-nav estimates link to /projects
- **Commit:** `7a70a2c`
- **Files:** `src/components/sidebar.tsx`, `src/components/mobile-nav.tsx`
- Changed `estimates` nav item href from `/chat` to `/projects` in both components

### Task 3: Verify projects page end-to-end
- **Status:** approved by user
- User confirmed /projects page renders, inline rename works, navigation to /chat/[id] works, and sidebar/mobile-nav link to /projects

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error on keyboard event handler**
- **Found during:** Task 1 build verification
- **Issue:** `React.KeyboardEvent` lacks `.blur()` on `currentTarget` — needs `React.KeyboardEvent<HTMLInputElement>`
- **Fix:** Narrowed the generic type parameter to `HTMLInputElement`
- **Files modified:** `src/app/projects/project-list.tsx`
- **Commit:** `65e6afc`

### Out-of-Scope Pre-existing Issues (logged to deferred)

1. `conversations.ts:104` — `UIMessage` type lacks `experimental_attachments` property — pre-existing TypeScript build error, not caused by this plan
2. Sidebar test expecting "Nelo AI" text — pre-existing vitest failure, not caused by this plan

## Known Stubs

None — all data is wired from `listProjects()` server-side fetch. Empty state renders when `projects.length === 0`.

## Self-Check

- [x] `src/app/projects/page.tsx` exists
- [x] `src/app/projects/project-list.tsx` exists
- [x] Commit `65e6afc` exists
- [x] Commit `7a70a2c` exists
- [x] All acceptance criteria pass (verified with grep)
