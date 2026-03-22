# Phase 8: Real Pricing Data Pipeline - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all placeholder pricing with live/cached data from INDEC ICC, UOCRA, MercadoLibre, GCBA, Cifras Online, and composition formulas. Target: all ~130 line items priced with real data. Daily automated refresh + manual override capability. Price per m² displayed in USD (blue rate).

</domain>

<decisions>
## Implementation Decisions

### Data source priority and composition
- **D-01:** Wire up ALL free sources: INDEC ICC, UOCRA escalas, MercadoLibre API, GCBA ICCBA, Cifras Online
- **D-02:** Paid sources (AyC Revista) are acceptable if research proves the data quality justifies the cost — don't rule out
- **D-03:** Composition formulas per line item: (labor hours × UOCRA rate) + (material quantities × market price). Each formula needs independent research — do NOT copy FERES or cotizador.xlsx without verification
- **D-04:** Target all ~130 line items, not a subset. Every item in `categories-config.ts` should have a real or researched price
- **D-05:** MercadoLibre wholesale discount (currently hardcoded 25%) needs research to validate or adjust per material type
- **D-06:** `cotizador.xlsx` is preliminary team research — use as a starting point for reference but verify everything independently

### Data freshness and caching
- **D-07:** Daily automated refresh (cron job or scheduled script) for API-sourced data (MercadoLibre, exchange rates)
- **D-08:** Semi-automated manual refresh script for sources that update less frequently (INDEC monthly, UOCRA bimonthly)
- **D-09:** Cache all fetched data in static JSON files (no database per project constraints)
- **D-10:** Show "last updated" date in estimate output so users know price freshness
- **D-11:** ICC adjustment strategy (store raw prices and adjust at calc time vs. pre-adjust stored prices) — needs research to determine best approach

### Coverage gap handling
- **D-12:** When a line item has no automated price source, include a rough estimate WITH a visible warning — never show "sin precio disponible" or skip the item
- **D-13:** FERES incidence percentages are NOT trusted as-is — research independently to validate or replace the relative proportions per category
- **D-14:** Lump-sum items (Seguridad e Higiene, Plan de Gestion Ambiental) — research best calculation method (fixed % of direct cost vs. flat amounts vs. other approach)
- **D-15:** Remove the current $900K ARS/m² hardcoded fallback — replace with a researched, current reference value
- **D-16:** Always produce an estimate even with partial data — flag confidence impact when items use fallback prices

### Currency and exchange rate
- **D-17:** Price per m² displayed in USD — standard Argentine construction practice
- **D-18:** Use blue (informal) exchange rate for USD/ARS conversion — needs a reliable automated source
- **D-19:** ARS values kept internally for the full breakdown; USD conversion applied to the summary price/m² and total

### Manual overrides
- **D-20:** Team can override any auto-fetched price with a manual value (e.g., "real price of portland cement is X")
- **D-21:** Manual overrides persist until explicitly removed or the next manual refresh — daily auto-refresh does NOT overwrite manual overrides
- **D-22:** Architect on team will validate final pricing numbers before shipping

### Development approach
- **D-23:** Test-driven development — write tests first for each data source integration, composition formula, caching logic, and override system
- **D-24:** Spec-driven — each data source adapter should have a clear interface contract tested against known reference values

### Claude's Discretion
- Exact caching file structure and naming conventions
- Error handling and retry logic for API failures
- Logging and monitoring approach for data freshness
- Order of implementation across the ~130 items

</decisions>

<specifics>
## Specific Ideas

- USD/m² is the standard way construction costs are discussed in Argentina — even though everything is denominated in ARS, professionals quote in USD
- Blue rate (not official, not MEP/CCL) is the reference the construction market uses informally
- INDEC publishes ICC around the 15th of each month — the cron should account for this schedule
- UOCRA paritarias update bimonthly — labor rates change in bulk on specific dates
- MercadoLibre has rate limits (~30 req/min unauthenticated) — sequential fetching with delays already stubbed in code
- The existing `uocra.ts` has crew compositions (masonry, concrete, plaster, flooring, painting, electrical, plumbing) — these define how many hours of each worker category go into a task

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing data source stubs
- `src/lib/data-sources/indec-icc.ts` — ICC history + adjustment calculations (4 hardcoded points, needs live data)
- `src/lib/data-sources/uocra.ts` — Labor rates + crew compositions (placeholder rates, needs real paritaria data)
- `src/lib/data-sources/mercadolibre.ts` — API integration stubs for 12 tracked materials (needs activation + expansion)

### Pricing configuration
- `src/lib/pricing/amba-unit-costs.ts` — Current 15 placeholder items, all `isPlaceholder: true` (must be replaced)
- `src/lib/pricing/categories-config.ts` — Full 26-category hierarchy with ~130 line items, quantity coefficients, conditions

### Calculation engine
- `src/lib/estimate/engine.ts` — Main pipeline: applyUnitCosts → sumByCategory → computeConfidence → cost structure
- `src/lib/estimate/types.ts` — All data structures + ICC `updatePrice` formula
- `src/lib/estimate/derive-quantities.ts` — Base quantity derivation from 11 measurements

### Research
- `.planning/research/PRICING-SOURCES.md` — Comprehensive analysis of 26 Argentine pricing sources with reliability ratings
- `.planning/research/cotizador.xlsx` — Team's preliminary pricing spreadsheet (use as starting reference only, verify independently)

### Tests
- `src/lib/estimate/__tests__/engine.test.ts` — Engine tests (applyUnitCosts, sumByCategory, computeConfidence)
- `src/lib/estimate/__tests__/types.test.ts` — ICC formula tests
- `src/lib/estimate/__tests__/derive-quantities.test.ts` — Quantity derivation tests

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `indec-icc.ts`: Has `getLatestICC()`, `calculateICCAdjustment()`, `getAdjustmentFromDate()` — needs real data feed but logic is solid
- `uocra.ts`: Has crew composition definitions (6 types) and `CARGAS_SOCIALES_MULTIPLIER = 2.2` — structure ready, needs real rates
- `mercadolibre.ts`: Has `searchMaterial()`, `fetchMaterialPrice()`, `fetchAllTrackedPrices()`, `toWholesalePrice()` — API logic stubbed, needs activation
- `amba-unit-costs.ts`: Has `ZONE_MULTIPLIERS` (CABA 1.0, GBA Norte 0.92, etc.) and cost structure constants (overhead 10%, profit 12%, IVA 21%)
- `updatePrice()` in types.ts: ICC adjustment formula already implemented and tested

### Established Patterns
- All pricing items use `isPlaceholder` flag — pipeline should flip this to `false` and set `source` field
- `lastUpdated` field exists on unit cost items — pipeline should populate this
- Zone multipliers already applied in engine — no changes needed there
- Cost structure (direct → overhead → profit → IVA) is stable

### Integration Points
- `amba-unit-costs.ts` is the single consumption point for the engine — pipeline outputs must match this interface
- `categories-config.ts` defines which items exist — pipeline must price every item listed there
- `engine.ts` `applyUnitCosts()` reads from the unit costs map — no engine changes needed if the interface is preserved
- System prompt builder reads categories but not prices — no changes needed there

</code_context>

<deferred>
## Deferred Ideas

- Real-time pricing API (live MercadoLibre prices per estimate request) — too aggressive for this phase, daily cache is sufficient
- Multiple region support beyond AMBA — out of scope per PROJECT.md
- Historical price tracking / trend visualization — interesting but separate feature
- PDF export with pricing sources cited — out of scope per constraints
- Nuqlea integration (supplier-direct prices) — could be valuable but adds another API dependency

</deferred>

---

*Phase: 08-real-pricing-data-pipeline*
*Context gathered: 2026-03-21*
