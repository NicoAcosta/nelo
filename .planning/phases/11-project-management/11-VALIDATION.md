---
phase: 11
slug: project-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 11 — Validation Strategy

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
| 11-01-01 | 01 | 1 | PERS-03 | unit | `npx vitest run src/lib/db/__tests__/projects.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | PERS-04 | unit | `npx vitest run src/lib/db/__tests__/projects.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 2 | PERS-03 | manual | Browser: visit /projects, check list renders | N/A | ⬜ pending |
| 11-02-02 | 02 | 2 | PERS-04 | manual | Browser: rename title inline, refresh | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/db/__tests__/projects.test.ts` — unit tests for project list/rename functions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Projects list shows all chats sorted by recent | PERS-03 | Requires Supabase data | 1. Create 2+ chats 2. Visit /projects 3. Verify sorted by updated_at |
| Auto-title appears after first message | PERS-04 | Requires full chat flow | 1. Start new chat 2. Send message 3. Check /projects for generated title |
| Inline rename persists | PERS-04 | Requires browser interaction | 1. Click title 2. Type new name 3. Press Enter 4. Refresh 5. Verify persisted |
| Click project navigates to /chat/[id] | PERS-03 | Requires browser navigation | 1. Click project 2. Verify redirect to /chat/[id] with history |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
