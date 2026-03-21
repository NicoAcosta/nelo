---
phase: 07-bilingual-i18n
plan: 03
subsystem: ui
tags: [i18n, react-context, useLocale, translations, bilingual, language-toggle]

requires:
  - phase: 07-bilingual-i18n
    provides: "i18n infrastructure: LocaleProvider, useLocale hook, en/es translations"
  - phase: 03-chat-ui-shell
    provides: "UI components with hardcoded English strings"
  - phase: 05-cost-breakdown
    provides: "Cost breakdown component with hardcoded labels"
provides:
  - "All 11 UI files wired to i18n system via useLocale/t() calls"
  - "EN/ES language toggle button in header"
  - "LocaleProvider wrapper in root layout via Providers component"
  - "Dynamic html lang attribute synced to locale"
  - "Chat page sends locale to API via x-locale header"
affects: [07-04]

tech-stack:
  added: []
  patterns: ["Client Providers wrapper for context in Server Component layout", "x-locale header for server-side locale awareness"]

key-files:
  created:
    - src/components/providers.tsx
  modified:
    - src/app/layout.tsx
    - src/components/header.tsx
    - src/components/sidebar.tsx
    - src/components/mobile-nav.tsx
    - src/components/chat-input.tsx
    - src/components/cost-breakdown.tsx
    - src/components/floor-plan-panel.tsx
    - src/app/page.tsx
    - src/app/chat/page.tsx
    - src/app/error.tsx
    - src/app/not-found.tsx
    - src/lib/i18n/context.tsx

key-decisions:
  - "Created Providers client wrapper to keep layout.tsx as Server Component (preserves metadata export)"
  - "Added useEffect in LocaleProvider to sync document.documentElement.lang with locale state"
  - "Chat page sends locale via x-locale HTTP header rather than request body to avoid transport API complexity"
  - "Converted not-found.tsx to client component to access useLocale hook"

patterns-established:
  - "Providers wrapper pattern: Server Component layout imports client Providers for context wrapping"
  - "All UI components use const { t } = useLocale() for user-visible strings"

requirements-completed: [I18N-07, I18N-08]

duration: 8min
completed: 2026-03-21
---

# Phase 07 Plan 03: Wire UI Components to i18n Summary

**All 11 UI components wired to useLocale/t() with EN/ES toggle in header, LocaleProvider in root layout, and locale-aware API transport**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-21T20:08:11Z
- **Completed:** 2026-03-21T20:16:10Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Root layout wrapped in LocaleProvider via Providers client component pattern
- Header displays functional EN/ES language toggle button that switches all UI strings
- All 11 UI files (header, sidebar, mobile-nav, chat-input, cost-breakdown, floor-plan-panel, landing, chat, error, not-found) use t() for user-visible strings
- Chat page sends current locale to API via x-locale header in transport
- html lang attribute dynamically updates when locale changes
- All 117 tests passing with LocaleProvider wrappers

## Task Commits

Each task was committed atomically:

1. **Task 1: Wrap app in LocaleProvider and add language toggle to header** - `829e7de` (feat)
2. **Task 2: Convert all remaining UI components to use t() translations** - `6deefb2` (feat)

## Files Created/Modified
- `src/components/providers.tsx` - Client wrapper with LocaleProvider for Server Component layout
- `src/app/layout.tsx` - Wraps children in Providers
- `src/lib/i18n/context.tsx` - Added useEffect to sync document.documentElement.lang
- `src/components/header.tsx` - Added useLocale, t() calls, EN/ES toggle button
- `src/components/sidebar.tsx` - Nav labels use t() via labelKey pattern
- `src/components/mobile-nav.tsx` - Tab labels use t() via labelKey pattern
- `src/components/chat-input.tsx` - Placeholder and disclaimer use t()
- `src/components/cost-breakdown.tsx` - Added "use client", labels use t()
- `src/components/floor-plan-panel.tsx` - Field labels and buttons use t()
- `src/app/page.tsx` - Landing prompts and headings use t()
- `src/app/chat/page.tsx` - Empty state, suggestions, transport with x-locale header
- `src/app/error.tsx` - Title, description, button use t()
- `src/app/not-found.tsx` - Converted to client component, uses t()
- 6 test files updated with LocaleProvider wrapper

## Decisions Made
- Created a Providers client wrapper instead of making layout.tsx a client component -- preserves Next.js metadata export
- Used useEffect in LocaleProvider (not layout) to set document.documentElement.lang -- keeps reactivity with locale state
- Sent locale via x-locale HTTP header in DefaultChatTransport -- cleanest approach without modifying request body shape
- Converted not-found.tsx from Server Component to Client Component to access useLocale hook

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All UI components fully wired to i18n system
- Language toggle functional in header
- Plan 04 (system prompt locale) can proceed independently
- All 117 tests passing, no regressions

## Self-Check: PASSED

All files verified on disk. Both commit hashes (829e7de, 6deefb2) found in git log.

---
*Phase: 07-bilingual-i18n*
*Completed: 2026-03-21*
