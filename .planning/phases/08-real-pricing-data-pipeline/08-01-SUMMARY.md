---
phase: 08-real-pricing-data-pipeline
plan: 01
subsystem: pricing-infrastructure
tags: [cache, pricing, blue-rate, dolar-api, override, tdd]
dependency_graph:
  requires: []
  provides:
    - src/lib/pricing/cache-manager.ts
    - src/lib/data-sources/dolar-api.ts
    - src/lib/pricing/override-manager.ts
    - src/lib/pricing/cache/*.json
  affects:
    - src/lib/pricing/ (all future pricing plans depend on cache-manager and override-manager)
tech_stack:
  added: []
  patterns:
    - CacheEnvelope<T> wrapper for typed JSON cache files
    - getCacheDir() env-aware path resolution (Vercel /tmp vs local src/)
    - Manual overrides file is independent of auto-refresh cache files
key_files:
  created:
    - src/lib/pricing/cache-manager.ts
    - src/lib/data-sources/dolar-api.ts
    - src/lib/pricing/override-manager.ts
    - src/lib/pricing/__tests__/cache-manager.test.ts
    - src/lib/data-sources/__tests__/dolar-api.test.ts
    - src/lib/pricing/__tests__/override-manager.test.ts
    - src/lib/pricing/cache/blue-rate.json
    - src/lib/pricing/cache/mercadolibre.json
    - src/lib/pricing/cache/uocra-rates.json
    - src/lib/pricing/cache/icc-history.json
    - src/lib/pricing/cache/manual-overrides.json
  modified: []
decisions:
  - "Cache writes go to /tmp on Vercel (read-only fs protection) — getCacheDir() is the single gatekeeper"
  - "readCache() falls back to committed src/lib/pricing/cache for seed reads — no runtime error when /tmp is empty"
  - "manual-overrides.json is separate from auto-refresh cache files — auto-refresh can never overwrite team prices"
  - "resolveUnitCost() priority: manual override > AMBA_UNIT_COSTS > null"
metrics:
  duration: "7 minutes"
  completed_date: "2026-03-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 11
  files_modified: 0
---

# Phase 08 Plan 01: Cache Infrastructure and Blue Rate Adapter Summary

Cache infrastructure for the real pricing data pipeline — generic JSON cache manager with Vercel-safe writes, DolarAPI blue rate adapter, and manual override system.

## What Was Built

**3 tested modules + 5 seed cache JSON files committed to git.**

### cache-manager.ts
Generic cache read/write/staleness detection for all pricing JSON files.
- `CacheEnvelope<T>` — typed wrapper with `data`, `lastFetched`, `source`
- `getCacheDir()` — returns `/tmp/pricing-cache` on Vercel (read-only fs), `src/lib/pricing/cache` locally
- `readCache(name, cacheDir?)` — tries runtime dir first, falls back to committed seed files
- `writeCache(name, data, source, cacheDir?)` — creates directory recursively, writes timestamped JSON
- `isCacheStale(envelope, maxAgeMs)` — compares `lastFetched` against `Date.now() - maxAgeMs`

### dolar-api.ts
Blue USD exchange rate adapter using DolarAPI.
- `BlueRateData` interface — `{ compra, venta, fechaActualizacion }`
- `fetchBlueRate()` — fetches `https://dolarapi.com/v1/dolares/blue`, throws on non-200 with status in message
- `getBlueVenta()` — returns the sell (venta) rate for ARS-to-USD conversion

### override-manager.ts
Manual price overrides that survive auto-refresh.
- `ManualOverride` interface — `{ materialCost, laborCost, totalCost, source, setAt, setBy }`
- `loadOverrides(path?)` — reads `manual-overrides.json`, returns `{}` on missing/invalid
- `setOverride(itemCode, override, path?)` — merges, auto-calculates `totalCost`, sets `setAt`
- `getOverride(itemCode, path?)` — returns override or null
- `removeOverride(itemCode, path?)` — removes key, no-op if missing
- `resolveUnitCost(itemCode, path?)` — priority: manual override > AMBA_UNIT_COSTS > null

### Seed Cache Files
All 5 committed with `lastFetched: "1970-01-01T00:00:00.000Z"` (always stale — triggers refresh on first use):
- `src/lib/pricing/cache/blue-rate.json`
- `src/lib/pricing/cache/mercadolibre.json`
- `src/lib/pricing/cache/uocra-rates.json`
- `src/lib/pricing/cache/icc-history.json`
- `src/lib/pricing/cache/manual-overrides.json` — empty `{}`

## Test Results

34 new tests passing across 3 test files. 45 existing estimate engine tests still passing.

```
Test Files  3 passed (3)
Tests       34 passed (34)
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All modules have live implementations. Seed cache files are intentionally stale (lastFetched at epoch) — they are design stubs that signal "needs refresh" rather than data stubs that flow to UI.

## Self-Check: PASSED
