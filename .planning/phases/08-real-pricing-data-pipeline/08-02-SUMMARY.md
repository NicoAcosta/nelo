---
phase: 08-real-pricing-data-pipeline
plan: 02
subsystem: pricing-engine
tags: [tdd, uocra, composition-formulas, labor-rates, wholesale-discount]
dependency_graph:
  requires: []
  provides:
    - src/lib/pricing/composition/formulas.ts
    - src/lib/data-sources/uocra.ts (corrected rates)
  affects:
    - any module consuming getEffectiveRate() or calculateLaborCost()
    - future plans using computeUnitCost()
tech_stack:
  added: []
  patterns:
    - TDD (RED → GREEN) for pure calculation functions
    - Composition formula pattern: labor + materials = unit cost
    - Wholesale discount by material category (bulk/standard/specialty)
key_files:
  created:
    - src/lib/data-sources/__tests__/uocra.test.ts
    - src/lib/pricing/composition/formulas.ts
    - src/lib/pricing/composition/__tests__/formulas.test.ts
  modified:
    - src/lib/data-sources/uocra.ts
decisions:
  - "Zone supplement included in effective rate: (base + zoneSupplement) * 2.2, not just base * 2.2"
  - "Wholesale discount is variable by material type (0.70/0.75/0.80), not flat 0.75"
  - "Composition formula accepts named crew key OR inline {oficialHours, ayudanteHours} for flexibility"
metrics:
  duration: "2m 36s"
  completed_date: "2026-03-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 08 Plan 02: Composition Formula Engine Summary

**One-liner:** UOCRA rates corrected with zone supplement (rates ~10-15% higher) and composition formula engine computes unit costs as (labor hours × UOCRA rate) + (material qty × wholesale price).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix UOCRA rates with zone supplement (TDD) | 8ff606b | uocra.ts, uocra.test.ts |
| 2 | Composition formula engine (TDD) | ec09e6e | formulas.ts, formulas.test.ts |

## What Was Built

### Task 1: UOCRA Rates with Zone Supplement

Updated `src/lib/data-sources/uocra.ts` with verified Feb-Mar 2026 UOCRA paritaria rates from construar.com.ar.

**Key change:** effective rate now includes zone supplement:
- Before: `Math.round(baseHourlyRate * 2.2)`
- After: `Math.round((baseHourlyRate + zoneSupplementHourly) * 2.2)`

Updated rates (ARS/hour effective):

| Category | Old | New | Change |
|----------|-----|-----|--------|
| oficial_especializado | 11440 | 13358 | +16.8% |
| oficial | 10294 | 11433 | +11.1% |
| medio_oficial | 9460 | 10545 | +11.5% |
| ayudante | 8756 | 9764 | +11.5% |

Interface addition: `zoneSupplementHourly: number` field on `LaborRate`.

### Task 2: Composition Formula Engine

Created `src/lib/pricing/composition/formulas.ts` — the core pricing logic for computing line-item unit costs.

**Exports:**
- `WholesaleCategory` type: `"bulk" | "standard" | "specialty"`
- `CompositionFormula` interface: itemCode, crewType, materials[], description
- `getWholesaleDiscount(category)`: returns 0.70/0.75/0.80
- `computeUnitCost(formula)`: returns `UnitCost` with all required fields

**Formula:**
```
laborCost = calculateLaborCost(oficialHours, ayudanteHours)
materialCost = sum(qty * retailPrice * wholesaleDiscount) per material
totalCost = laborCost + materialCost
```

**Example — masonry wall (m²):**
- Labor: 1.2h oficial × 11433 + 0.8h ayudante × 9764 = 21531 ARS
- Materials: 28 bricks × 350 ARS × 0.75 = 7350 ARS
- Total: 28881 ARS/m²

## Test Coverage

- 11 UOCRA tests (zone supplement values, source strings, calculateLaborCost edge cases)
- 17 composition formula tests (wholesale discounts, masonry, concrete, labor-only, inline crew, multi-material, specialty)
- 45 existing estimate tests — all still passing (no regressions)

**Total: 73 tests passing**

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — formulas compute real values from verified data.

## Self-Check: PASSED
