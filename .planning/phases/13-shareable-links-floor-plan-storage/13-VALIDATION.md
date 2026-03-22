---
phase: 13
slug: shareable-links-floor-plan-storage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | SHARE-01, SHARE-02 | unit | `npx vitest run src/lib/db/__tests__/share-links.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | SHARE-03 | unit | `npx vitest run src/lib/documents/__tests__/storage-path.test.ts` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 2 | SHARE-01 | unit + manual | `npx vitest run src/components/estimate/__tests__/share-popover.test.tsx` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 2 | SHARE-01, SHARE-02 | manual | Browser navigate to /share/{token} | N/A | ⬜ pending |
| 13-02-03 | 02 | 2 | - | checkpoint | Human e2e verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/db/__tests__/share-links.test.ts` — stubs for SHARE-01, SHARE-02
- [ ] `src/lib/documents/__tests__/storage-path.test.ts` — stubs for SHARE-03
- [ ] `src/components/estimate/__tests__/share-popover.test.tsx` — stubs for SHARE-01 UI
- [ ] `npx shadcn@latest add popover` — UI primitive for share flow
- [ ] `npm install nanoid` — token generation

*Existing vitest infrastructure covers test runner needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public share page renders CostBreakdown | SHARE-01 | Requires browser + Supabase RLS | Navigate to /share/{token} without auth, verify estimate displays |
| Expired link shows expiry message | SHARE-02 | Requires time-based DB state | Create link with past expiry, navigate, verify "expired" message |
| Floor plan signed URL loads in chat | SHARE-03 | Requires Supabase Storage + signed URL | Upload floor plan, refresh page, verify image loads from storage URL |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
