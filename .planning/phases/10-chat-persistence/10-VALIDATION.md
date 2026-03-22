---
phase: 10
slug: chat-persistence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 10 — Validation Strategy

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
| 10-01-01 | 01 | 1 | PERS-01 | unit | `npx vitest run src/lib/db` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | PERS-01 | unit | `npx vitest run src/lib/db` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 2 | PERS-02 | manual | Browser: refresh /chat/[id], check messages persist | N/A | ⬜ pending |
| 10-02-02 | 02 | 2 | PERS-01 | manual | Browser: close tab mid-stream, reopen, check saved | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/db/__tests__/conversations.test.ts` — unit tests for save/load conversation functions
- [ ] `supabase/migrations/0002_conversations_unique_project_id.sql` — unique constraint for upsert

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Messages survive page refresh | PERS-02 | Requires browser + Supabase | 1. Send message 2. Refresh 3. Verify messages restored |
| Tab close mid-stream saves | PERS-01 | Requires browser tab lifecycle | 1. Send long prompt 2. Close tab during stream 3. Reopen /chat/[id] 4. Verify partial response saved |
| Tool calls/results round-trip | PERS-02 | Complex UIMessage parts in JSONB | 1. Run estimate 2. Refresh 3. Verify cost breakdown still renders |
| Floor plan images not in JSONB | PERS-01 | Check DB row size | 1. Upload floor plan 2. Check conversations row size < 100KB |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
