---
phase: 08-real-pricing-data-pipeline
plan: 05
subsystem: data-pipeline
tags: [cron, refresh, uocra, icc, manual-script, vercel-cron]
dependency_graph:
  requires:
    - "08-01: cache-manager (writeCache/readCache)"
    - "08-02: uocra.ts (UOCRA_RATES), indec-icc.ts (ICC_HISTORY_FALLBACK)"
    - "08-03: override-manager.ts (manual-overrides never touched)"
    - "08-04: dolar-api.ts (fetchBlueRate), mercadolibre.ts (fetchAllTrackedPrices)"
  provides:
    - "refreshDynamicSources() — cron-triggered daily blue rate + MercadoLibre refresh"
    - "refreshManualSources() — on-demand UOCRA + ICC cache update"
    - "GET /api/cron/refresh-prices — Vercel cron endpoint"
    - "vercel.json cron schedule — 08:00 UTC daily"
    - "npm run refresh:manual — CLI command for manual data source updates"
  affects:
    - "src/lib/pricing/cache: blue-rate.json, mercadolibre.json, uocra-rates.json, icc-history.json"
tech_stack:
  added: []
  patterns:
    - "TDD: RED test first, GREEN implementation, all tests pass before commit"
    - "Cron auth: Authorization: Bearer CRON_SECRET header verification"
    - "Partial failure: per-source error reporting without throwing"
    - "Manual override protection: auto-refresh never touches manual-overrides.json"
key_files:
  created:
    - src/lib/data-sources/refresh-all.ts
    - src/lib/data-sources/__tests__/refresh-all.test.ts
    - src/app/api/cron/refresh-prices/route.ts
    - vercel.json
    - src/lib/data-sources/refresh-manual.ts
    - src/lib/data-sources/__tests__/refresh-manual.test.ts
  modified:
    - src/lib/data-sources/indec-icc.ts (exported getICCHistory)
    - package.json (added refresh:manual script)
decisions:
  - "Export getICCHistory() from indec-icc.ts — needed by refresh-manual.ts to write current ICC state to cache"
  - "readCache mock added to refresh-manual tests — indec-icc.ts calls readCache internally when loading ICC history"
metrics:
  duration: "~15 minutes (Tasks 1-2)"
  completed_date: "2026-03-21"
  tasks_completed: 2
  tasks_total: 3
  files_created: 6
  files_modified: 2
---

# Phase 08 Plan 05: Cron Refresh, Manual Script, and Architect Validation Summary

**One-liner:** Daily cron refreshes blue rate and MercadoLibre via CRON_SECRET-protected endpoint; manual script updates UOCRA/ICC cache on demand; checkpoint awaiting architect pricing approval.

## What Was Built

### Task 1: Refresh Orchestrator + Cron API Route (committed 408883d)

**`src/lib/data-sources/refresh-all.ts`** — Orchestrates all automated refreshes:
- `refreshDynamicSources()` fetches blue rate (DolarAPI) and MercadoLibre prices sequentially
- Per-source try/catch: one failure doesn't block the other
- Returns `RefreshResult` with `{ blueRate: SourceResult, mercadolibre: SourceResult, refreshedAt: string }`
- NEVER touches `manual-overrides.json` (per D-21)

**`src/app/api/cron/refresh-prices/route.ts`** — Vercel cron endpoint:
- `GET /api/cron/refresh-prices`
- Validates `Authorization: Bearer CRON_SECRET` header (401 on mismatch)
- Calls `refreshDynamicSources()` and returns JSON result

**`vercel.json`** — Cron schedule:
- Path: `/api/cron/refresh-prices`
- Schedule: `0 8 * * *` (08:00 UTC = 05:00 Argentina time, daily)

**Tests:** 7 tests — success, partial blue rate failure, partial MercadoLibre failure, no-write-on-failure, manual-overrides not written.

### Task 2: Manual Refresh Script for UOCRA and ICC (committed a6e88c9)

**`src/lib/data-sources/refresh-manual.ts`** — Manual refresh script:
- `refreshUOCRA()` — writes `UOCRA_RATES` to `uocra-rates` cache as `"manual-refresh"` source
- `refreshICC()` — writes current ICC history to `icc-history` cache
- `refreshManualSources()` — runs both in parallel, returns combined result
- CLI entry point for `npm run refresh:manual`

**`package.json`** — Added `"refresh:manual": "npx tsx src/lib/data-sources/refresh-manual.ts"`

**Minor auto-fix (Rule 2):** Exported `getICCHistory()` from `indec-icc.ts` — required for `refresh-manual.ts` to read the current ICC state (cache or fallback) before writing it.

**Tests:** 8 tests — UOCRA write, ICC write, error handling, combined result, both cache keys written.

### Task 3: Architect Pricing Validation (CHECKPOINT — awaiting)

Pre-checkpoint steps completed:
- Full test suite: **161 tests passing** across 17 test files
- Sample estimate generated (see below)

## Sample Estimate: 120m2 CABA, hormigon armado, medio finish

| Metric | Value |
|--------|-------|
| Price per m2 (ARS) | 1,955,941 |
| Price per m2 (USD) | 1,382 |
| Total Price (ARS) | 234,712,950 |
| Total Price (USD) | 165,875 |
| Blue rate used | ARS 1,415 / USD |
| Confidence level | quick |
| Categories with cost | 26 / 26 |

### Full Category Breakdown (ARS + USD)

| Category | ARS | USD | Incidence |
|----------|-----|-----|-----------|
| trabajos_preliminares | 868,588 | 614 | 0.5% |
| procedimientos_cumplimientos | 1,556,535 | 1,100 | 1.0% |
| movimiento_suelos | 2,605,481 | 1,841 | 1.6% |
| estructura_resistente | 9,411,467 | 6,651 | 5.9% |
| mamposteria | 3,421,719 | 2,418 | 2.2% |
| capas_aisladoras | 1,800,240 | 1,272 | 1.1% |
| cubierta_techo | 4,118,280 | 2,910 | 2.6% |
| revoques | 2,148,240 | 1,518 | 1.4% |
| yeseria | 1,163,280 | 822 | 0.7% |
| contrapisos | 3,009,240 | 2,127 | 1.9% |
| carpetas | 1,841,040 | 1,301 | 1.2% |
| solados | 3,909,120 | 2,763 | 2.5% |
| zocalos | 673,920 | 476 | 0.4% |
| revestimientos | 3,364,560 | 2,378 | 2.1% |
| carpinteria_metalica | 11,859,000 | 8,381 | 7.5% |
| carpinteria_aluminio | 11,871,480 | 8,390 | 7.5% |
| carpinteria_madera | 12,944,640 | 9,148 | 8.1% |
| **escalera** | **24,819,480** | **17,540** | **15.6%** |
| **amoblamientos** | **23,291,400** | **16,460** | **14.6%** |
| instalacion_electrica | 6,118,440 | 4,324 | 3.8% |
| instalacion_sanitaria | 12,631,800 | 8,927 | 7.9% |
| instalacion_gas | 7,280,040 | 5,145 | 4.6% |
| espejos | 3,863,400 | 2,730 | 2.4% |
| pinturas | 826,680 | 584 | 0.5% |
| marmoleria | 2,520,000 | 1,781 | 1.6% |
| varios | 1,080,000 | 763 | 0.7% |

### Notes for Architect Review

- **USD/m2 of 1,382** is within the expected range of $800–2000 for AMBA mid-finish
- **escalera at 15.6%** and **amoblamientos at 14.6%** are unusually high — typical incidence for escalera in a single-story house is near-zero (it shouldn't apply), and amoblamientos at 14.6% exceeds typical 3-5% for mid-finish
- **estructura_resistente at 5.9%** is below the expected 15-25% — may need a pricing correction
- **instalacion_sanitaria at 7.9%** is in range
- **instalacion_electrica at 3.8%** is slightly below the expected 5-8%

If corrections are needed, use `setOverride()` from `src/lib/pricing/override-manager.ts`:
```typescript
import { setOverride } from "@/lib/pricing/override-manager";
setOverride("6.01", { materialCost: 45000, laborCost: 22000, source: "architect review 2026-03-21", setBy: "team" });
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Export] Exported getICCHistory() from indec-icc.ts**
- **Found during:** Task 2 GREEN phase
- **Issue:** `refresh-manual.ts` needed `getICCHistory()` to write the canonical ICC state (cache-or-fallback) to the cache file. The function existed but was not exported.
- **Fix:** Added `export` keyword to `getICCHistory()` in `indec-icc.ts`
- **Files modified:** `src/lib/data-sources/indec-icc.ts`
- **Commit:** a6e88c9

**2. [Rule 1 - Bug] Added readCache to refresh-manual test mock**
- **Found during:** Task 2 GREEN phase (first test run)
- **Issue:** `@/lib/pricing/cache-manager` mock only included `writeCache`. Since `indec-icc.ts` calls `readCache` internally during module load, the mock was incomplete and caused test failures.
- **Fix:** Added `readCache: vi.fn().mockReturnValue(null)` to the mock factory
- **Files modified:** `src/lib/data-sources/__tests__/refresh-manual.test.ts`
- **Commit:** a6e88c9

## Known Stubs

None — all new modules use real data sources and cache operations.

## Self-Check: PASSED

- [x] src/lib/data-sources/refresh-all.ts — created
- [x] src/lib/data-sources/__tests__/refresh-all.test.ts — created
- [x] src/app/api/cron/refresh-prices/route.ts — created
- [x] vercel.json — created
- [x] src/lib/data-sources/refresh-manual.ts — created
- [x] src/lib/data-sources/__tests__/refresh-manual.test.ts — created
- [x] Commits 408883d and a6e88c9 exist
- [x] 161 tests passing (up from 52 at phase start)
- [x] Task 3 checkpoint awaiting architect review
