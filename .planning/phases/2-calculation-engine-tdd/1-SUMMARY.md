# Phase 2: Calculation Engine (TDD)

## Status: Complete (retroactive)

## One Liner
Built and fully tested pure TypeScript calculation engine with 38 passing tests covering quantity derivation, unit cost application, category summation, confidence scoring, exclusion logic, and edge cases.

## What Was Built
- `src/lib/estimate/derive-quantities.ts` — Derives ~14 base measurements from ProjectInputs (wall area, footprint, etc.)
- `src/lib/estimate/engine.ts` — Full pipeline: applyUnitCosts, sumByCategory, computeEstimate, computeConfidence
- `src/lib/estimate/__tests__/types.test.ts` — Type validation tests
- `src/lib/estimate/__tests__/derive-quantities.test.ts` — Quantity derivation tests
- `src/lib/estimate/__tests__/engine.test.ts` — Core engine tests (28 tests)
- `src/lib/estimate/__tests__/engine-edge-cases.test.ts` — Exclusion logic, zone multipliers, multi-story, minimal inputs, integrity checks

## Success Criteria Met
1. ✅ deriveQuantities correctly derives wall area, footprint, and ~14 base measurements
2. ✅ applyUnitCosts returns typed LineItem array with non-zero totals
3. ✅ sumByCategory returns CategoryTotal entries summing to direct cost
4. ✅ computeEstimate returns price_per_m2, total_price, and full cost structure
5. ✅ computeConfidence returns correct tier for minimal/mid/full inputs
6. ✅ All 38 tests pass with zero side effects

## Test Coverage
- 4 test files, 38 tests, all passing
- Covers: exclusion logic (steel frame, ladrillo portante), zone multipliers, multi-story, minimal inputs, estimate integrity (incidence sums, IVA calculation)

## Commits
- `3c18b13` feat: calculation engine with TDD (28 tests passing)
- `ab12cdf` feat: floor plan vision analysis + engine edge case tests (38 total)
