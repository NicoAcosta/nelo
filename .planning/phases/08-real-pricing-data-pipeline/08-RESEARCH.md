# Phase 8: Real Pricing Data Pipeline - Research

**Researched:** 2026-03-21
**Domain:** Argentine construction pricing — data sourcing, composition formulas, caching, currency conversion
**Confidence:** MEDIUM-HIGH (core data sources verified; composition ratios require AyC Revista subscription for full validation)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Wire up ALL free sources: INDEC ICC, UOCRA escalas, MercadoLibre API, GCBA ICCBA, Cifras Online
- **D-02:** Paid sources (AyC Revista) are acceptable if research proves data quality justifies cost
- **D-03:** Composition formulas per line item: (labor hours x UOCRA rate) + (material quantities x market price). Each formula needs independent research — do NOT copy FERES or cotizador.xlsx without verification
- **D-04:** Target all ~130 line items, not a subset. Every item in `categories-config.ts` should have a real or researched price
- **D-05:** MercadoLibre wholesale discount (currently hardcoded 25%) needs research to validate or adjust per material type
- **D-06:** `cotizador.xlsx` is preliminary team research — use as a starting point for reference but verify everything independently
- **D-07:** Daily automated refresh (cron job or scheduled script) for API-sourced data (MercadoLibre, exchange rates)
- **D-08:** Semi-automated manual refresh script for sources that update less frequently (INDEC monthly, UOCRA bimonthly)
- **D-09:** Cache all fetched data in static JSON files (no database per project constraints)
- **D-10:** Show "last updated" date in estimate output so users know price freshness
- **D-11:** ICC adjustment strategy (store raw prices and adjust at calc time vs. pre-adjust stored prices) — needs research to determine best approach
- **D-12:** When a line item has no automated price source, include a rough estimate WITH a visible warning — never show "sin precio disponible" or skip the item
- **D-13:** FERES incidence percentages are NOT trusted as-is — research independently to validate or replace
- **D-14:** Lump-sum items (Seguridad e Higiene, Plan de Gestion Ambiental) — research best calculation method
- **D-15:** Remove the current $900K ARS/m² hardcoded fallback — replace with a researched, current reference value
- **D-16:** Always produce an estimate even with partial data — flag confidence impact when items use fallback prices
- **D-17:** Price per m² displayed in USD — standard Argentine construction practice
- **D-18:** Use blue (informal) exchange rate for USD/ARS conversion — needs a reliable automated source
- **D-19:** ARS values kept internally; USD conversion applied to summary price/m² and total
- **D-20:** Team can override any auto-fetched price with a manual value
- **D-21:** Manual overrides persist until explicitly removed — daily auto-refresh does NOT overwrite manual overrides
- **D-22:** Architect on team will validate final pricing numbers before shipping
- **D-23:** Test-driven development — write tests first for each data source integration, composition formula, caching logic, and override system
- **D-24:** Spec-driven — each data source adapter should have a clear interface contract tested against known reference values

### Claude's Discretion

- Exact caching file structure and naming conventions
- Error handling and retry logic for API failures
- Logging and monitoring approach for data freshness
- Order of implementation across the ~130 items

### Deferred Ideas (OUT OF SCOPE)

- Real-time pricing API (live MercadoLibre prices per estimate request)
- Multiple region support beyond AMBA
- Historical price tracking / trend visualization
- PDF export with pricing sources cited
- Nuqlea integration
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-02 | AMBA region pricing reference table with real market data | AyC Revista subscription provides ~130 items; UOCRA rates and MercadoLibre API provide material and labor inputs for composition formulas |
| DATA-03 | Price update mechanism: `price_updated = price_base × (ICC_current / ICC_base)` | ICC formula already in `types.ts`; needs real INDEC data feed; research confirms store-raw-adjust-at-calc is the correct pattern |
| D-09 | Cache all fetched data in static JSON files | Vercel filesystem is read-only in serverless; `/tmp` is ephemeral; correct pattern is git-committed JSON files updated by cron via API route |
| D-11 | ICC adjustment strategy | Store raw prices at a known base date; adjust at calculation time using `updatePrice()` — already implemented |
| D-17/D-18 | USD display using blue rate | DolarAPI endpoint verified: `GET https://dolarapi.com/v1/dolares/blue` returns `{compra, venta, fechaActualizacion}` — no auth required |
| D-14 | Lump-sum items calculation | Research supports fixed % of direct cost: 1.5–2% for Seguridad e Higiene, 0.5–1% for Plan de Gestion Ambiental |
</phase_requirements>

---

## Summary

The goal of Phase 8 is to replace every `isPlaceholder: true` entry in `amba-unit-costs.ts` with real, researched unit costs for all ~130 line items in `categories-config.ts`. Prices are composed from (labor hours x UOCRA effective rate) + (material quantities x market price), stored in static JSON cache files, and adjusted at calculation time using the INDEC ICC formula already implemented in `types.ts`.

The most significant decision for cost efficiency is subscribing to AyC Revista (~$7,000 ARS/year ≈ USD 5). This single subscription provides monthly Excel files with ~130 verified unit prices (materials + labor split) for all major construction categories. Without it, each item must be manually composed from scratch. The subscription is the highest-ROI single action in this phase.

**The Vercel filesystem is read-only in serverless functions.** The correct caching pattern is: a Vercel cron job calls an internal API route, which fetches external data and writes to `src/lib/pricing/cache/*.json` files committed to git — or alternatively fetches on each serverless invocation and uses `next: { revalidate }` to control freshness without writing to disk.

**Primary recommendation:** Subscribe to AyC Revista for baseline pricing. Wire DolarAPI for blue rate. Use ICC-at-calc-time pattern. Store all sourced prices as versioned JSON files in `src/lib/pricing/cache/` committed to git, with a cron-triggered Next.js API route to refresh dynamic data (MercadoLibre, blue rate).

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `vitest` | ^3.x | Test runner — TDD for all adapter contracts | Configured |
| `zod` | ^4.0 | Schema validation for all cache JSON shapes | Configured |
| `next` | ^16.2 | App Router + cron route handlers | Configured |

### No new runtime dependencies needed

All data fetching uses the native `fetch` API already available in Next.js. No new npm packages are required for the data pipeline itself.

### Supporting tools (external, no npm install)
| Tool | Access | Purpose |
|------|--------|---------|
| DolarAPI | `https://dolarapi.com/v1/dolares/blue` | Blue rate, no auth |
| INDEC ICC CSV | `https://datos.gob.ar/ro/dataset/sspm-indice-costo-construccion-icc` | Index history (note: may be stale — see pitfalls) |
| MercadoLibre Search API | `https://api.mercadolibre.com/sites/MLA/search` | Material retail prices |
| UOCRA rates | Manual entry — no API exists | Labor rates |
| AyC Revista Excel | Subscription download | ~130 unit prices, monthly |

### Installation
No new packages. The pipeline is pure TypeScript using existing dependencies.

---

## Architecture Patterns

### Recommended Cache Structure

```
src/lib/pricing/cache/
├── blue-rate.json          # Daily refresh via cron
├── mercadolibre.json       # Daily refresh via cron
├── uocra-rates.json        # Manual — bimonthly, committed to git
├── icc-history.json        # Manual — monthly, committed to git
└── manual-overrides.json   # Team overrides — persists across refreshes
```

These files are committed to git. The cron job updates `blue-rate.json` and `mercadolibre.json` daily via a Next.js API route. UOCRA and ICC files are updated manually when the team publishes new paritaria data.

### Pattern 1: Store Raw Prices, Adjust at Calc Time (D-11 resolution)

**What:** Unit costs in cache files are stored at a known base date. The `updatePrice()` function in `types.ts` adjusts them to current value at calculation time using ICC ratios.

**Why this over pre-adjusting:** Pre-adjusting stored prices requires re-writing all cache files every time ICC updates. Storing raw prices means only the ICC history file needs updating — the calculation engine handles the rest. The formula is already implemented and tested.

**When to use:** All ARS unit costs derived from AyC Revista or historical references should be stored with `priceBaseDate` and `iccBaseValue`. The engine calls `updatePrice(basePrice, iccBase, iccCurrent)` automatically.

```typescript
// Source: src/lib/estimate/types.ts (already implemented)
export function updatePrice(priceBase: number, iccBase: number, iccCurrent: number): number {
  if (iccBase <= 0) return priceBase;
  return priceBase * (iccCurrent / iccBase);
}
```

**Implementation:** Set `priceBaseDate` to the AyC publication month. Set `iccBaseValue` to the ICC general index for that month. The engine compares against `getLatestICC().generalValue`.

### Pattern 2: Cache-First Adapter Contract

Each data source adapter has a single interface:

```typescript
interface DataSourceAdapter<T> {
  fetch(): Promise<T>;         // hits external API/URL
  loadCache(): T | null;       // reads from JSON file in cache/
  saveCache(data: T): void;    // writes to JSON file in cache/
  isStale(cache: T): boolean;  // checks lastFetched timestamp
}
```

**TDD contract:** Write tests against known reference values before implementing. For example, UOCRA adapter test asserts `getEffectiveRate("oficial")` returns approximately 4679 * 2.2 = 10294 ARS/hour for Zona A, February 2026.

### Pattern 3: Manual Override Merge

```typescript
// Merge order: base prices -> ICC adjustment -> manual overrides
function resolveUnitCost(code: string): UnitCost {
  const base = AMBA_UNIT_COSTS[code];
  const overrides = loadManualOverrides();
  const override = overrides[code];

  if (override) {
    return { ...base, ...override, source: "manual_override" };
  }

  // Apply ICC adjustment to base price
  const adjusted = applyICCAdjustment(base);
  return adjusted;
}
```

Manual overrides in `manual-overrides.json` are merged at read time. Daily cron refresh does NOT touch this file (D-21).

### Pattern 4: Vercel Cron + API Route for Daily Refresh

```typescript
// vercel.json
{
  "crons": [
    { "path": "/api/cron/refresh-prices", "schedule": "0 8 * * *" }
  ]
}

// app/api/cron/refresh-prices/route.ts
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fetch blue rate from DolarAPI
  // Fetch MercadoLibre material prices
  // Write to public/ directory via fs.writeFileSync
  // (or commit via GitHub API if on Vercel serverless)

  return Response.json({ refreshed: true, at: new Date().toISOString() });
}
```

**Critical Vercel constraint:** Serverless functions cannot write to `src/` — the filesystem is read-only in production. Two valid approaches:

1. **Serve from /tmp + ISR**: Write fetched data to `/tmp/prices-cache.json` during the request. Use `export const revalidate = 86400` on the API route so Next.js ISR caches the response for 24 hours. On cache miss, re-fetch.

2. **Static JSON in repo + GitHub API write**: The cron route fetches new data and writes back to git via the GitHub Contents API. Vercel auto-deploys on push. This gives you version history but adds deploy time.

**Recommended for this project:** Approach 1 (ISR + /tmp) for dynamic data (blue rate, MercadoLibre). Keep UOCRA and ICC as hand-edited files in `src/lib/pricing/cache/` committed to git.

### Recommended Project Structure for Phase 8

```
src/lib/
├── data-sources/
│   ├── indec-icc.ts         # Already exists — wire to real CSV
│   ├── uocra.ts             # Already exists — update with real rates
│   ├── mercadolibre.ts      # Already exists — activate API calls
│   ├── dolar-api.ts         # NEW — blue rate fetcher
│   └── ayc-revista.ts       # NEW — manual import tool for subscription data
├── pricing/
│   ├── amba-unit-costs.ts   # Target file — replace all placeholders
│   ├── categories-config.ts # Unchanged
│   ├── cache/
│   │   ├── uocra-rates.json      # Committed — manual refresh
│   │   ├── icc-history.json      # Committed — manual refresh
│   │   ├── mercadolibre.json     # Generated — daily cron
│   │   └── manual-overrides.json # Committed — team edits
│   └── composition/
│       └── formulas.ts      # NEW — (labor_hours × rate) + (mat_qty × price)
app/api/cron/
└── refresh-prices/route.ts  # NEW — Vercel cron endpoint
```

### Anti-Patterns to Avoid

- **Pre-adjusting stored prices:** Never write ICC-adjusted prices to the cache. Store raw prices at a base date + ICC base value. Adjust at calc time.
- **Blocking cron on UOCRA fetch:** UOCRA has no API. Don't attempt automated scraping. Maintain a manual update script.
- **Using MercadoLibre prices as direct unit costs:** ML prices are retail. Apply `toWholesalePrice()` (currently 0.75x multiplier). Research suggests this is directionally correct but per-material calibration is needed.
- **Writing to public/ or src/ at runtime on Vercel:** Read-only filesystem. Use /tmp for ephemeral caching, ISR for HTTP-level caching.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ~130 item unit price database | Custom composition from scratch | AyC Revista subscription ($7,000 ARS/year) | 44 years of publication, monthly updates, already covers all major Argentine construction categories with material + labor split |
| Blue rate exchange | Custom scraper of Dolar Hoy / El Cronista | DolarAPI (`dolarapi.com/v1/dolares/blue`) | Free, no auth, live JSON API, verified working as of 2026-03-21 |
| ICC index history | Manual PDF parsing | datos.gob.ar CSV + manual INDEC press release entry | CSV is stale but available; press releases are parseable; existing `indec-icc.ts` structure is correct |
| Price-at-base + adjustment | Re-adjusting all stored prices | `updatePrice()` already in types.ts | Already implemented and tested; storing raw + adjusting at calc time is the standard pattern |
| Unit price composition structure | Custom data model | Extend existing `UnitCost` interface with `priceBaseDate` + `iccBaseValue` | Interface already defined; don't add new types when existing ones suffice |

**Key insight:** The Argentine construction pricing ecosystem has no free comprehensive API. The paid sources (AyC Revista) are the only path to validated ~130 item coverage. At ~USD 5/year, subscribing is cheaper than the engineering time to compose prices from scratch for each item.

---

## Data Source Findings

### 1. INDEC ICC (HIGH confidence)

**URL:** `https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33`

**What it provides:** Monthly construction cost index (base 1993=100) with chapter-level breakdown (estructura, mamposteria, revoques, pinturas, sanitaria, gas, electrica). Does NOT provide absolute prices.

**February 2026 verified data:**
- General level: monthly increase of 1.9% vs January
- Materials chapter: +1.5%
- Labor chapter: +1.6%
- Other components: +4.4%

**Existing ICC_HISTORY in `indec-icc.ts`:** The current hardcoded values (82,450 for Feb 2026 general) are PLACEHOLDER ESTIMATES. The real Feb 2026 general index needs to be read from the INDEC press release PDF. The structure is correct; the numbers need verification.

**CSV access:** `https://datos.gob.ar/ro/dataset/sspm-indice-costo-construccion-icc` — confirmed to contain monthly CSV but the open data series may be stale (last verified update unclear). Use as supplement to manual press release entry.

**Update schedule:** Around the 15th of each month. The cron should run on the 16th to catch fresh data.

### 2. UOCRA Labor Rates (HIGH confidence)

**URL:** `https://www.construar.com.ar/` — publishes tables promptly after each paritaria.

**Current verified rates for Zona A (February–March 2026):**

| Category | Base Hourly (ARS) | Zone Supplement | Effective (×2.2) |
|----------|-------------------|-----------------|------------------|
| Oficial Especializado | $5,470 | $602 | ~$13,371 |
| Oficial | $4,679 | $518 | ~$11,436 |
| Medio Oficial | $4,324 | $469 | ~$10,562 |
| Ayudante | $3,980 | $458 | ~$9,727 |

**Zone supplement note:** The PRICING-SOURCES.md research found a zone supplement (adicional de zona) of $518–$602/hour on top of the base. The existing `uocra.ts` does NOT include the zone supplement — it uses raw base rates. This means effective hourly costs are HIGHER than currently modeled. The `CARGAS_SOCIALES_MULTIPLIER = 2.2` is applied to the base only. Correct formula should be: `(base + zone_supplement) * 2.2`.

**Update schedule:** Bimonthly paritarias. construar.com.ar publishes within days of each negotiation.

### 3. MercadoLibre API (MEDIUM confidence for wholesale cost)

**Base URL:** `https://api.mercadolibre.com/sites/MLA/search`

**Authentication:** Basic item search works WITHOUT OAuth. The existing `mercadolibre.ts` stub is correct — public search endpoints do not require a bearer token for category searches.

**Rate limits:** Authenticated requests get 1,500 req/min. Unauthenticated requests have lower limits (approximately 30 req/min based on CONTEXT.md research). The existing 2-second delay between requests is appropriate for unauthenticated calls.

**Wholesale discount research (D-05):** No authoritative Argentine source was found that quantifies the wholesale vs retail discount with precision. The 25% discount currently hardcoded is a commonly cited range (sources indicate "10–30% above wholesale"). Research recommendation:
- Keep 0.75x for bulk commodities (cement, bricks, aggregate, lime)
- Use 0.80x for specialty items (electrical conduit, plumbing fittings) — smaller format makes retail/wholesale differential smaller
- Use 0.70x for large volume materials (steel rebar, sand by m³) — larger discount at corralon
- The architect on the team should validate before shipping (D-22)

**Practical coverage:** MercadoLibre covers retail prices for the 12 tracked materials in `mercadolibre.ts`. To reach ~130 line items, MercadoLibre alone is insufficient — it works best for material inputs that then feed composition formulas, not as direct unit costs.

### 4. DolarAPI Blue Rate (HIGH confidence)

**Endpoint:** `GET https://dolarapi.com/v1/dolares/blue`

**Response (verified 2026-03-21):**
```json
{
  "moneda": "USD",
  "casa": "blue",
  "nombre": "Blue",
  "compra": 1405,
  "venta": 1425,
  "fechaActualizacion": "2026-03-21T17:58:00.000Z"
}
```

**Authentication:** None required. Free public API.

**Rate limits:** Not documented. Daily cron with single fetch is safe.

**For display:** Use `venta` (sell rate) for ARS→USD conversion, as this is the rate at which users would buy dollars — the reference rate the construction market uses when quoting USD prices.

**Fallback:** If DolarAPI is unreailable, secondary source is `https://bluelytics.com.ar/` (provides similar data).

### 5. AyC Revista Subscription (HIGH confidence, RECOMMENDED)

**URL:** `https://aycrevista.com.ar/precios-la-construccion/`

**Cost:** ~$7,000 ARS/year (approximately USD 5 at blue rate). Monthly Excel download with current prices.

**What you get:** ~130 unit price analyses across 20 construction categories, each with:
- Materials cost per unit (with IVA + IIBB)
- Labor cost per unit (with 120% cargas sociales)
- Total unit cost
- Updated on the 15th of each month

**Categories confirmed covered:**
Demolicion, Movimiento de tierra, Fundaciones, Aislaciones, Mamposteria y tabiques (18 items), Estructura (11 items), Revoques (9 items), Revestimientos (9 items), Pisos (15 items), Zocalos, Cubiertas (10 items), Membranas, Carpinteria de madera, Herreria/Aluminio (10 items), Pintura (13 items), Vidrios y espejos, Instalacion electrica, Sistemas constructivos.

**Gap:** AyC categorization may not perfectly match `categories-config.ts` item codes. Mapping work required. Categories like "Instalaciones Sanitarias" and "Gas" may need supplemental sources.

**Free pages:** Show prices 4–5 months stale. Do not use free pages — subscribe.

### 6. GCBA ICCBA Reference Values (HIGH confidence for m² reference)

**November 2025 verified values:**
- Vivienda FONAVI (44 m²): ~$1,149,936 ARS/m²
- Vivienda 2 plantas (249 m²): ~$1,109,580 ARS/m²
- Edificios (1,620 m²): ~$1,280,439 ARS/m²

**Use:** Replace the hardcoded `$900,000 ARS/m²` fallback in `engine.ts` (D-15). The current fallback is from a mid-2024 reference. November 2025 mid-range = ~$1,109,580 ARS/m². Adjust forward using ICC: approximately $1,109,580 × (82,450 / estimated Nov 2025 ICC) ≈ $1.2–1.3M ARS/m² for March 2026.

**For USD display:** At March 2026 blue rate of ~1,415 ARS/USD: $1,200,000 ARS/m² ÷ 1,415 ≈ **$848 USD/m²** as a mid-market estimate. Published market data puts residential construction at USD 800–2,000/m² depending on quality tier.

### 7. Seguridad e Higiene / Plan de Gestion Ambiental (D-14, MEDIUM confidence)

**Research finding:** No Argentine law specifies a mandatory percentage. IRAM standards and UOCRA safety framework define requirements qualitatively, not as a fixed budget percentage.

**Industry practice (from multiple Spanish-language construction sources):**
- "Seguridad e Higiene en la Construccion": typically **1–2% of PEM (Presupuesto de Ejecucion Material)** = direct cost
- "Plan de Gestion Ambiental": typically **0.5–1% of direct cost** on projects where required
- For residential construction under 500 m², PGA is often not required by regulation

**Recommended implementation:**
- `Seguridad_e_Higiene`: 1.5% of total direct construction cost (excluding preliminaries and compliance items)
- `Plan_Gestion_Ambiental`: 0.75% of total direct cost, conditional on `includesSafety: true`
- Both stored as percentage-of-direct constants, not unit costs

These are lump-sum line items calculated AFTER summing the direct-cost categories. They should NOT go through the unit cost × quantity formula. Add a post-processing step in `engine.ts` or a special flag in `categories-config.ts`.

---

## ICC Adjustment Strategy (D-11 Resolution)

**Decision: Store raw prices at a known base date, adjust at calc time.**

**Why:**
- `updatePrice()` is already implemented and tested in `types.ts`
- The `Estimate` output already has `priceBaseDate`, `iccBaseValue`, and `iccCurrentValue` fields
- Pre-adjusting would require rewriting all cache files on every ICC update (monthly work)
- At-calc-time is a single division operation — negligible performance cost

**Implementation:**
1. Each `UnitCost` entry stores `lastUpdated` (the AyC publication month) and `source` (e.g., `"AyC Revista Feb 2026"`).
2. The ICC value for that month (e.g., `80,100` for Jan 2026, `82,450` for Feb 2026) is stored in `iccBaseValue` on the `UnitCost`. Add this field to the `UnitCost` interface.
3. In `engine.ts`, `applyUnitCosts()` calls `updatePrice(unitCost.totalCost, unitCost.iccBaseValue, getLatestICC().generalValue)`.
4. The `Estimate` output reports both base date and current ICC so the user can see how stale the reference is.

**Interface extension needed:**
```typescript
// Extend UnitCost in types.ts:
export interface UnitCost {
  itemCode: string;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  lastUpdated: string;
  source: string;
  isPlaceholder: boolean;
  iccBaseValue?: number;  // ADD: ICC general index when this price was set
}
```

---

## Common Pitfalls

### Pitfall 1: Vercel Filesystem is Read-Only at Runtime

**What goes wrong:** Cron job tries to `fs.writeFileSync()` into `src/lib/pricing/cache/` — EROFS error in production. Works fine locally but fails silently or throws on Vercel.

**Why it happens:** Vercel serverless functions run in an immutable container. The `/public` and `/src` directories are built into the deployment image and cannot be written to.

**How to avoid:** Two valid approaches:
1. Use `/tmp` for ephemeral caching (lost on cold start, but ISR prevents cold starts for frequently hit routes)
2. Keep dynamic data (blue rate, ML prices) served from an API route with `revalidate = 86400` — Next.js ISR caches the response without writing files
3. Keep static reference data (UOCRA, ICC history, AyC prices) as committed JSON files — no runtime writes needed

**For this project:** UOCRA and AyC data change at most monthly. They belong as committed files. Only blue rate and MercadoLibre benefit from daily refresh — use ISR for those.

### Pitfall 2: MercadoLibre Returns Retail, Not Wholesale

**What goes wrong:** Direct use of ML median prices produces unit costs 25–30% above what a builder actually pays. Estimates come out too high.

**How to avoid:** Always call `toWholesalePrice()` (currently 0.75x). Consider per-material calibration for Phase 8. Architect validation (D-22) is the final check.

**Warning sign:** If the estimated total for a 100 m² house with normal finishes exceeds USD 1,500/m², the wholesale discount may be insufficient.

### Pitfall 3: UOCRA Zone Supplement Not Applied

**What goes wrong:** The existing `uocra.ts` uses only the base hourly rate, ignoring the zone supplement (`adicional de zona`) which adds $458–$602/hour. This underestimates effective labor cost by ~10%.

**Correct formula:**
```
effectiveHourlyRate = (baseHourlyRate + zoneSupplementRate) * socialChargesMultiplier
```

**Verified Zona A supplement (Feb 2026):**
- Oficial Especializado: $602/hour supplement
- Oficial: $518/hour
- Medio Oficial: $469/hour
- Ayudante: $458/hour

**How to avoid:** Update `UOCRA_RATES` to include `zoneSupplementRate` field. Test asserts that `official effectiveHourlyRate ≈ (4679 + 518) * 2.2 = 11,433`.

### Pitfall 4: ICC History Values Are Placeholders

**What goes wrong:** The current `ICC_HISTORY` in `indec-icc.ts` contains PLACEHOLDER ESTIMATES (the comment says so explicitly). If the plan treats these as real, price adjustments will be wrong.

**How to avoid:** The first task in this phase must be fetching real ICC values from INDEC press releases and replacing the placeholder values. The February 2026 PDF URL is known: `https://www.indec.gob.ar/uploads/informesdeprensa/icc_03_262C783ED834.pdf`.

**Real Feb 2026 ICC general index:** Not extractable from PDF programmatically — requires manual reading. The current placeholder of 82,450 needs validation.

### Pitfall 5: AyC Categoria Mismatch

**What goes wrong:** AyC Revista's 20-category structure does not perfectly match the 26-category structure in `categories-config.ts`. Some items (especially MEP installations) have different granularity.

**How to avoid:** Build an explicit mapping table between AyC item names and `categories-config.ts` item codes before ingesting subscription data. Some items will need manual composition from UOCRA + ML data.

### Pitfall 6: Lump-Sum Items Processed as Unit Costs

**What goes wrong:** If "Seguridad e Higiene" (category 26 or special) is stored with a `totalCost` per m² and quantity coefficient, the result depends on area — but this item is a percentage of project cost, not an area-based cost.

**How to avoid:** Implement lump-sum items as a post-processing step in `computeEstimate()`. Calculate them AFTER the direct cost sum is known: `segHigiene = directCost * 0.015`. Store the percentage constants in `amba-unit-costs.ts` or a new `LUMP_SUM_RATES` constant.

---

## Code Examples

### DolarAPI Adapter

```typescript
// src/lib/data-sources/dolar-api.ts
const DOLAR_API_BASE = "https://dolarapi.com/v1";

export interface BlueRate {
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export async function fetchBlueRate(): Promise<BlueRate> {
  const res = await fetch(`${DOLAR_API_BASE}/dolares/blue`, {
    next: { revalidate: 86400 }, // ISR: cache for 24 hours
  });
  if (!res.ok) throw new Error(`DolarAPI error: ${res.status}`);
  const data = await res.json();
  return {
    compra: data.compra,
    venta: data.venta,
    fechaActualizacion: data.fechaActualizacion,
  };
}

// Convert ARS total to USD using blue sell rate
export function arsToUsd(arsAmount: number, blueVenta: number): number {
  return Math.round(arsAmount / blueVenta);
}
```

### UOCRA Rates with Zone Supplement (corrected)

```typescript
// Update in uocra.ts
const SOCIAL_CHARGES_MULTIPLIER = 2.2;

export const UOCRA_RATES: LaborRate[] = [
  {
    category: "oficial",
    label: "Oficial",
    baseHourlyRate: 4679,
    zoneSupplementRate: 518,          // Zona A Feb 2026 — ADD THIS
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round((4679 + 518) * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-02-01",
    source: "UOCRA paritaria Feb 2026 — https://www.construar.com.ar/2026/02/...",
  },
  // ...
];
```

### Composition Formula Pattern

```typescript
// src/lib/pricing/composition/formulas.ts
import { getEffectiveRate } from "@/lib/data-sources/uocra";
import { toWholesalePrice } from "@/lib/data-sources/mercadolibre";

interface CompositionFormula {
  laborHours: {
    oficial?: number;
    oficial_especializado?: number;
    medio_oficial?: number;
    ayudante?: number;
  };
  materials: Array<{
    key: string;         // matches TRACKED_MATERIALS key
    quantity: number;    // per unit of the line item
    unit: string;
  }>;
}

export function computeUnitCost(
  formula: CompositionFormula,
  materialPrices: Record<string, number>,  // from ML cache
): { materialCost: number; laborCost: number; totalCost: number } {
  const laborCost =
    (formula.laborHours.oficial ?? 0) * getEffectiveRate("oficial") +
    (formula.laborHours.ayudante ?? 0) * getEffectiveRate("ayudante") +
    (formula.laborHours.oficial_especializado ?? 0) * getEffectiveRate("oficial_especializado");

  const materialCost = formula.materials.reduce((sum, mat) => {
    const retailPrice = materialPrices[mat.key] ?? 0;
    const wholesalePrice = toWholesalePrice(retailPrice);
    return sum + wholesalePrice * mat.quantity;
  }, 0);

  return {
    materialCost: Math.round(materialCost),
    laborCost: Math.round(laborCost),
    totalCost: Math.round(materialCost + laborCost),
  };
}
```

### Vercel Cron Route

```typescript
// app/api/cron/refresh-prices/route.ts
import { fetchBlueRate } from "@/lib/data-sources/dolar-api";
import { fetchAllTrackedPrices } from "@/lib/data-sources/mercadolibre";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [blueRate, mlPrices] = await Promise.all([
    fetchBlueRate(),
    fetchAllTrackedPrices(),
  ]);

  // In-memory cache — survives warm invocations, lost on cold start
  // ISR on the route that READS this data prevents cold starts during normal use

  return Response.json({
    blueRate,
    mlPrices,
    refreshedAt: new Date().toISOString(),
  });
}

// vercel.json
// { "crons": [{ "path": "/api/cron/refresh-prices", "schedule": "0 8 * * *" }] }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| File writes at runtime for caching | ISR (`revalidate`) + committed JSON for static data | Next.js App Router (2023+) | Cannot write to Vercel FS at runtime; use revalidate instead |
| FERES reference percentages | Independently sourced unit costs from AyC Revista | This phase | FERES is not a public database; its incidence %s are from an academic project, not independently verified |
| $900K ARS/m² fallback (mid-2024) | ~$1.2–1.3M ARS/m² (March 2026 estimate) | Continuous inflation | ARS prices inflate monthly; use current GCBA/CAC data |
| Placeholder UOCRA rates (base only) | UOCRA rates with zone supplement + correct multiplier | Feb 2026 paritaria | Effective rate is (base + zona_A_supplement) × 2.2 |

**Deprecated/outdated:**
- `datos.gob.ar` ICC CSV: Series may be stale (only updated through 2015 in previous research note). Use INDEC PDF press releases for current values.
- `$900,000 ARS/m²` fallback: Replace with `~$1,250,000 ARS/m²` (GCBA Nov 2025 data, ICC-adjusted to March 2026).

---

## Open Questions

1. **Real INDEC ICC values for Feb 2026**
   - What we know: The placeholder in `indec-icc.ts` shows 82,450 for Feb 2026
   - What's unclear: Is this close to real? The INDEC press release PDF shows +1.9% MoM from Jan
   - Recommendation: Read the PDF manually before planning tasks that depend on ICC values. If Jan 2026 actual was 80,100, then Feb = 80,100 × 1.019 = 81,622 (not 82,450)

2. **AyC Revista category-to-code mapping completeness**
   - What we know: AyC covers 20 categories with ~130 items; `categories-config.ts` has 26 categories
   - What's unclear: Which 6 categories in our config have NO AyC coverage (likely: Instalaciones Sanitarias, Instalacion de Gas, Amoblamientos, Espejos, MEP items)
   - Recommendation: Subscribe first, then inventory gaps. Plan fallback composition formulas for uncovered items

3. **Cifras Online data format**
   - What we know: Provides cost per m² and cost per rubro via Google Sheets
   - What's unclear: Are the Google Sheets truly public (no login)? What's the current data date?
   - Recommendation: Verify accessibility before planning a Cifras Online adapter task

4. **March 2026 UOCRA paritaria outcome**
   - What we know: February 2026 rates are confirmed. March negotiations were "ongoing" per construar.com.ar
   - What's unclear: Whether March 2026 rates increased from February baseline
   - Recommendation: Check construar.com.ar before writing rate values to the cache file

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.x |
| Config file | `/Users/nico/dev/arqui/vitest.config.ts` |
| Quick run command | `npx vitest run src/lib` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-03 | Composition formula: (labor × rate) + (mat × price) = correct unit cost | unit | `npx vitest run src/lib/pricing/composition` | ❌ Wave 0 |
| D-09 | Cache file read/write with correct JSON shape | unit | `npx vitest run src/lib/pricing/__tests__/cache` | ❌ Wave 0 |
| D-11 | ICC adjustment applied at calc time (not pre-baked) | unit | `npx vitest run src/lib/estimate/__tests__/engine` | ✅ |
| D-18 | Blue rate fetch returns `{compra, venta, fechaActualizacion}` | unit (mock) | `npx vitest run src/lib/data-sources/__tests__` | ❌ Wave 0 |
| D-21 | Manual overrides not overwritten by daily refresh | unit | `npx vitest run src/lib/pricing/__tests__/overrides` | ❌ Wave 0 |
| DATA-02 | All ~130 items in categories-config have a non-placeholder cost | unit | `npx vitest run src/lib/pricing/__tests__/coverage` | ❌ Wave 0 |
| UOCRA rates | Effective rate includes zone supplement | unit | `npx vitest run src/lib/data-sources/__tests__/uocra` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/data-sources/__tests__/uocra.test.ts` — covers UOCRA rates including zone supplement
- [ ] `src/lib/data-sources/__tests__/dolar-api.test.ts` — covers blue rate fetch + ARS→USD conversion
- [ ] `src/lib/pricing/__tests__/cache.test.ts` — covers cache file read/write shapes (Zod validation)
- [ ] `src/lib/pricing/__tests__/overrides.test.ts` — covers manual override merge logic
- [ ] `src/lib/pricing/__tests__/coverage.test.ts` — asserts every item in `getAllItems()` has a non-placeholder unit cost
- [ ] `src/lib/pricing/composition/__tests__/formulas.test.ts` — covers composition formula math

---

## Sources

### Primary (HIGH confidence)
- PRICING-SOURCES.md (prior research) — comprehensive 26-source analysis, consulted directly
- `https://dolarapi.com/v1/dolares/blue` — verified live response 2026-03-21
- `https://www.construar.com.ar/2026/03/escala-uocra-marzo-2026-...` — UOCRA Feb 2026 rates confirmed
- `https://www.indec.gob.ar/uploads/informesdeprensa/icc_03_262C783ED834.pdf` — ICC Feb 2026 PDF (content not extractable but URL confirmed)
- Existing source files (`indec-icc.ts`, `uocra.ts`, `mercadolibre.ts`) — code reviewed directly

### Secondary (MEDIUM confidence)
- `https://www.lanacion.com.ar/...nid10032026/` — March 2026 material prices table
- `https://www.estadisticaciudad.gob.ar/eyc/wp-content/uploads/2025/11/ir_2025_1992.pdf` — GCBA Nov 2025 cost per m² values
- `https://vercel.com/docs/cron-jobs` — Vercel cron job documentation
- WebSearch: Vercel serverless filesystem read-only constraint — corroborated by multiple sources

### Tertiary (LOW confidence — verify before implementing)
- Wholesale discount percentages by material type (0.70–0.80x range): estimated from multiple web sources, no authoritative Argentine construction study found
- Seguridad e Higiene percentage (1.5% of direct cost): common industry practice cited in Spanish construction sources, not from an Argentine regulatory document

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing stack covers all needs
- Data sources: HIGH for DolarAPI, UOCRA, INDEC structure; MEDIUM for AyC content (behind paywall); MEDIUM for ML wholesale discount
- Architecture patterns: HIGH — Vercel read-only constraint verified by multiple sources; ISR pattern is documented
- Composition formulas: MEDIUM — structure is clear; specific per-item values require AyC subscription data
- Pitfalls: HIGH — all documented pitfalls verified against code and official source constraints

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (UOCRA rates may change; ICC updates monthly; blue rate changes daily but DolarAPI adapts)
