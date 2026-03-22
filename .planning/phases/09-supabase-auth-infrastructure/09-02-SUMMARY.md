---
phase: 09-supabase-auth-infrastructure
plan: 02
subsystem: auth
tags: [supabase, react-context, otp, magic-link, pkce, next-app-router, i18n]

# Dependency graph
requires:
  - phase: 09-supabase-auth-infrastructure-01
    provides: createClient (browser + server), Supabase env vars, proxy.ts middleware

provides:
  - AuthProvider React context with user/loading/signOut state
  - useAuth() hook throwing outside provider
  - Sign-in page at /auth/sign-in (Server Component wrapper + Client Form)
  - Email+OTP flow with signInWithOtp and verifyOtp
  - PKCE magic link callback at /auth/callback using exchangeCodeForSession
  - 13 auth i18n keys in both EN and ES translations
  - providers.tsx updated to wrap AuthProvider outside LocaleProvider

affects:
  - 09-03 (route guards will use useAuth)
  - 10-chat-persistence (useAuth provides user for session ownership)
  - header component (signOut, user display)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AuthProvider mirrors LocaleProvider pattern (createContext + useMemo value + throw-outside guard)
    - 6-digit OTP inputs with auto-advance, backspace nav, paste support, auto-submit
    - searchParams.get('next') redirect after successful auth
    - getUser() not getSession() on client side (consistent with server-side security rule)
    - exchangeCodeForSession in callback (not getSession) — PKCE-safe

key-files:
  created:
    - src/lib/auth/context.tsx
    - src/lib/auth/__tests__/context.test.tsx
    - src/app/auth/sign-in/page.tsx
    - src/app/auth/sign-in/sign-in-form.tsx
    - src/app/auth/callback/route.ts
  modified:
    - src/components/providers.tsx
    - src/lib/i18n/translations.ts

key-decisions:
  - "AuthProvider uses useEffect with getUser + onAuthStateChange (not getSession) for initial state"
  - "AuthProvider placed outside LocaleProvider in providers.tsx — auth is app-level"
  - "OTP inputs: 6 individual text inputs with auto-advance/paste/auto-submit for UX"
  - "Callback route creates its own createServerClient inline (not via server.ts helper) to match Supabase docs pattern exactly"

patterns-established:
  - "Auth context pattern: createContext null, useMemo value, throw if not in provider"
  - "Error classification: rate-limited / expired / network based on error message keywords"
  - "Bilingual auth: all user-facing strings via t() from useLocale"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 09 Plan 02: Auth Context, Sign-In Page, and PKCE Callback Summary

**Supabase magic link + OTP sign-in with AuthProvider React context, 6-digit auto-advance OTP UI, PKCE callback route, and bilingual auth strings**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T05:56:25Z
- **Completed:** 2026-03-22T06:00:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- AuthProvider context wraps the app (outside LocaleProvider) with user/loading/signOut state via getUser + onAuthStateChange
- useAuth() hook guards with informative throw if used outside provider — 8 Vitest tests pass (TDD)
- Sign-in page at /auth/sign-in: email step calls signInWithOtp, OTP step has 6 individual digit inputs with auto-advance, backspace navigation, paste support, and auto-submit on complete
- PKCE callback at /auth/callback: exchanges code via exchangeCodeForSession, redirects to /projects or ?next param
- 13 auth i18n keys added to both EN and ES translation objects

## Task Commits

1. **Task 1: AuthProvider context and useAuth hook** - `060045c` (feat + test TDD)
2. **Task 2: Sign-in page, OTP form, callback route, i18n strings** - `c2beff4` (feat)

## Files Created/Modified

- `src/lib/auth/context.tsx` - AuthProvider + useAuth hook (mirrors LocaleProvider pattern)
- `src/lib/auth/__tests__/context.test.tsx` - 8 Vitest tests covering all AuthProvider behaviors
- `src/app/auth/sign-in/page.tsx` - Server Component wrapper centering the form
- `src/app/auth/sign-in/sign-in-form.tsx` - Client Component: email step + 6-digit OTP step, bilingual, error handling
- `src/app/auth/callback/route.ts` - GET handler: PKCE exchangeCodeForSession, redirects on success
- `src/components/providers.tsx` - Added AuthProvider wrapping LocaleProvider
- `src/lib/i18n/translations.ts` - 13 auth keys added to both en and es objects

## Decisions Made

- AuthProvider uses `getUser()` not `getSession()` on the client — consistent with the D-27 rule that getSession can be spoofed on the server (same discipline applied for consistency)
- AuthProvider placed outside LocaleProvider — auth is app-global, locale is a user preference within the authenticated app
- OTP uses 6 individual `<input>` elements (not one `<input maxLength={6}>`) for better mobile UX with auto-advance and backspace navigation
- Callback route creates its own inline `createServerClient` rather than importing `server.ts` helper — matches Supabase documentation pattern exactly and avoids any abstraction over cookie handling

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in `src/components/__tests__/cost-breakdown.test.tsx` and `src/components/__tests__/prompt-card.test.tsx` (unrelated to this plan). Logged as out-of-scope. My new files have zero TypeScript errors.

## User Setup Required

None — no new external service configuration required. Supabase credentials configured in Plan 01.

## Next Phase Readiness

- AuthProvider ready for route guards in Plan 03
- useAuth() available app-wide for header sign-out button and protected route checks
- Sign-in redirect chain wired: /auth/sign-in → email → OTP → /projects (or ?next param)
- PKCE magic link flow fully wired: email link → /auth/callback → session → /projects

---
*Phase: 09-supabase-auth-infrastructure*
*Completed: 2026-03-22*
