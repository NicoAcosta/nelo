---
phase: 09-supabase-auth-infrastructure
plan: "03"
subsystem: auth-ui
tags: [auth, header, api-guard, projects-page, user-menu]
dependency_graph:
  requires: [09-01, 09-02]
  provides: [header-user-menu, chat-api-auth-guard, projects-page-placeholder]
  affects: [src/components/header.tsx, src/app/api/chat/route.ts, src/app/projects/page.tsx]
tech_stack:
  added: []
  patterns: [useAuth-in-client-component, server-side-auth-guard, getUser-not-getSession]
key_files:
  created:
    - src/app/projects/page.tsx
  modified:
    - src/components/header.tsx
    - src/app/api/chat/route.ts
    - src/components/__tests__/header.test.tsx
decisions:
  - "Header shows loading skeleton during auth check, avatar+dropdown when authenticated, sign-in link when not"
  - "New Estimate link gated behind auth — only shown when user is signed in"
  - "Chat API auth guard uses getUser() not getSession() per anti-spoofing rule"
  - "Projects page uses server-side redirect to /auth/sign-in?next=/projects for unauthenticated users"
metrics:
  duration: "5 minutes"
  completed: "2026-03-22T06:05:32Z"
  tasks_completed: 2
  files_changed: 4
---

# Phase 09 Plan 03: Auth UI Integration Summary

Header user menu with sign-out, chat API auth guard (401), and server-side projects page placeholder with auth redirect.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add user menu / sign-in button to header | 466f21a | src/components/header.tsx |
| 2 | Protect chat API route and create projects page | 41bca2f | src/app/api/chat/route.ts, src/app/projects/page.tsx |
| - | Fix header tests for useAuth dependency | 6ed90ef | src/components/__tests__/header.test.tsx |

## What Was Built

### Header User Menu (src/components/header.tsx)

The header now has three states based on auth:

1. **Loading** — animated pulse skeleton (8x8 rounded-full) while `useAuth` resolves
2. **Authenticated** — shows "New Estimate" link + avatar circle with first letter of email; clicking avatar toggles a dropdown with user email and "Sign out" button; dropdown closes on click outside
3. **Unauthenticated** — shows "Sign in" link styled as a subtle border button pointing to `/auth/sign-in`

The "New Estimate" link is hidden when not authenticated (chat requires auth per plan requirements).

### Chat API Auth Guard (src/app/api/chat/route.ts)

Auth check added as the first operation in the POST handler — before payload size validation and JSON parsing. Uses `createClient()` from `@/lib/supabase/server` and `supabase.auth.getUser()` (not `getSession()` per anti-spoofing rule). Returns `{ error: "Unauthorized" }` with status 401 when no valid session.

### Projects Page Placeholder (src/app/projects/page.tsx)

Server Component at `/projects` that:
1. Calls `createClient()` + `getUser()` server-side
2. Redirects to `/auth/sign-in?next=/projects` when not authenticated
3. Renders a placeholder with Header + "Your projects will appear here." text

Phase 11 will implement the real project list.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Header tests failing due to new useAuth dependency**
- **Found during:** Post-task 2 vitest run
- **Issue:** `Header` now imports `useAuth` which throws if used outside `AuthProvider`. Tests were rendering `Header` with only `LocaleProvider`, causing all 6 tests to fail.
- **Fix:** Added `vi.mock("@/lib/auth/context")` returning `{ user: null, loading: false, signOut: vi.fn() }`. Also fixed "Nelo" → "NELO" assertion (NeloLogo renders uppercase), updated "new estimate" test to check sign-in link (correct for unauthenticated state), and updated language toggle test for new sign-in link translation.
- **Files modified:** src/components/__tests__/header.test.tsx
- **Commit:** 6ed90ef

### Pre-existing Out-of-Scope Failures

- `src/components/__tests__/sidebar.test.tsx` — "Nelo AI" branding test was already failing before this plan. Logged to deferred items, not touched.

## Known Stubs

- **src/app/projects/page.tsx** — "Your projects will appear here." placeholder text. Intentional stub; Phase 11 (project list) will replace this with real project data from Supabase.

## Self-Check: PASSED

All created/modified files confirmed present. All task commits verified in git log.
