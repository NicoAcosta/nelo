---
phase: 9
slug: supabase-auth-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (existing) |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | AUTH-02 | unit | `npx vitest run src/lib/supabase` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | AUTH-03 | unit | `npx vitest run src/lib/supabase` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | AUTH-01 | manual | Browser: sign in with OTP | N/A | ⬜ pending |
| 09-02-02 | 02 | 1 | AUTH-04 | manual | Browser: sign out flow | N/A | ⬜ pending |
| 09-03-01 | 03 | 2 | AUTH-03 | manual | Browser: visit /chat unauthenticated | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/supabase/__tests__/server.test.ts` — unit tests for server client factory
- [ ] `src/lib/supabase/__tests__/client.test.ts` — unit tests for browser client factory

*Note: Auth flows (magic link, OTP, session refresh) require browser + Supabase backend — verified manually or via Playwright in later phases.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Magic link + OTP email delivery | AUTH-01 | Requires real Supabase project + email delivery | 1. Enter email on sign-in page 2. Check inbox for email with link + code 3. Verify both work |
| Session persists across refresh | AUTH-02 | Requires browser cookie state | 1. Sign in 2. Refresh page 3. Confirm still signed in |
| Protected route redirect | AUTH-03 | Requires browser navigation | 1. Clear cookies 2. Visit /chat 3. Confirm redirect to /auth/sign-in?next=/chat |
| Sign out clears session | AUTH-04 | Requires browser cookie state | 1. Sign in 2. Click sign out 3. Visit /chat 4. Confirm redirect |
| /share/** accessible without auth | AUTH-03 | Requires no auth state | 1. Open incognito 2. Visit /share/test 3. Confirm no redirect |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
