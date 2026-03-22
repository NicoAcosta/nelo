---
phase: 08
slug: real-pricing-data-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | D-03 | unit | `npx vitest run src/lib/pricing/composition` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | D-09 | unit | `npx vitest run src/lib/pricing/__tests__/cache` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | D-18 | unit (mock) | `npx vitest run src/lib/data-sources/__tests__` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | D-21 | unit | `npx vitest run src/lib/pricing/__tests__/overrides` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | D-11 | unit | `npx vitest run src/lib/estimate/__tests__/engine` | ✅ | ⬜ pending |
| 08-01-06 | 01 | 1 | DATA-02 | unit | `npx vitest run src/lib/pricing/__tests__/coverage` | ❌ W0 | ⬜ pending |
| 08-01-07 | 01 | 1 | UOCRA | unit | `npx vitest run src/lib/data-sources/__tests__/uocra` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/pricing/__tests__/composition.test.ts` — composition formula tests
- [ ] `src/lib/pricing/__tests__/cache.test.ts` — cache read/write tests
- [ ] `src/lib/data-sources/__tests__/dolar-api.test.ts` — blue rate fetch tests
- [ ] `src/lib/pricing/__tests__/overrides.test.ts` — manual override persistence tests
- [ ] `src/lib/pricing/__tests__/coverage.test.ts` — all items have non-placeholder cost
- [ ] `src/lib/data-sources/__tests__/uocra.test.ts` — UOCRA rates with zone supplement

*Existing engine tests cover ICC adjustment (D-11).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Architect validates final pricing numbers | D-22 | Human judgment required | Present full estimate breakdown to architect for sign-off |
| MercadoLibre API returns expected data shape | D-01 | External API dependency | Run `fetchAllTrackedPrices()` and verify JSON shape |
| DolarAPI blue rate endpoint accessible | D-18 | External service | `curl https://dolarapi.com/v1/dolares/blue` returns valid JSON |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
