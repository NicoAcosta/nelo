/**
 * Nelo — AMBA Unit Costs
 *
 * Placeholder pricing data for Buenos Aires metropolitan area.
 * Values are NOT real — they are rough estimates for development/testing.
 * Real prices will be sourced from: AyC Revista, UOCRA, INDEC ICC, MercadoLibre API.
 *
 * Price base date: 2024-07-01 (FERES UT2 reference period)
 * ICC base value: TBD (will be set when real ICC data is fetched)
 *
 * IMPORTANT: All prices in ARS. Mark isPlaceholder: true until verified.
 */

import type { UnitCost, ICCIndex } from "@/lib/estimate/types";

/** Placeholder ICC index values */
export const ICC_REFERENCE: ICCIndex = {
  date: "2024-07-01",
  generalValue: 1000, // placeholder — will be replaced with real INDEC value
  chapters: {
    estructura: 1000,
    mamposteria: 1000,
    revoques: 1000,
    pinturas: 1000,
    sanitaria: 1000,
    gas: 1000,
    electrica: 1000,
  },
};

/**
 * Unit costs keyed by item code.
 *
 * Placeholder values derived from the FERES reference project total ($90.2M ARS)
 * distributed by incidence percentages. These are rough approximations.
 *
 * Formula: unit_cost = (total_project_cost × incidence%) / estimated_quantity
 */
export const AMBA_UNIT_COSTS: Record<string, UnitCost> = {
  // 1. Trabajos Preliminares
  "1.01": { itemCode: "1.01", materialCost: 2000, laborCost: 3287, totalCost: 5287, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "1.02": { itemCode: "1.02", materialCost: 50000, laborCost: 78580, totalCost: 128580, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },

  // 2. Procedimientos
  "2.01": { itemCode: "2.01", materialCost: 10000, laborCost: 16074, totalCost: 26074, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "2.02": { itemCode: "2.02", materialCost: 80000, laborCost: 52270, totalCost: 132270, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "2.03": { itemCode: "2.03", materialCost: 500, laborCost: 1743, totalCost: 2243, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "2.04": { itemCode: "2.04", materialCost: 100000, laborCost: 55025, totalCost: 155025, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "2.05": { itemCode: "2.05", materialCost: 300000, laborCost: 138305, totalCost: 438305, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },

  // 3. Movimiento de Suelos
  "3.1.1": { itemCode: "3.1.1", materialCost: 0, laborCost: 8520, totalCost: 8520, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "3.2.1": { itemCode: "3.2.1", materialCost: 50000, laborCost: 43389, totalCost: 93389, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },

  // 4. Estructura Resistente
  "4.1.1": { itemCode: "4.1.1", materialCost: 180000, laborCost: 117618, totalCost: 297618, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "4.1.2": { itemCode: "4.1.2", materialCost: 12000, laborCost: 11953, totalCost: 23953, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "4.2.1": { itemCode: "4.2.1", materialCost: 55000, laborCost: 38305, totalCost: 93305, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },

  // 5. Mampostería
  "5.1.1": { itemCode: "5.1.1", materialCost: 15000, laborCost: 18994, totalCost: 33994, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "5.2.3": { itemCode: "5.2.3", materialCost: 14000, laborCost: 17491, totalCost: 31491, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "5.3.1": { itemCode: "5.3.1", materialCost: 22000, laborCost: 23401, totalCost: 45401, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
  "5.3.2": { itemCode: "5.3.2", materialCost: 15000, laborCost: 16980, totalCost: 31980, lastUpdated: "2024-07-01", source: "placeholder (FERES ratio)", isPlaceholder: true },
};

/** Location zone multipliers for AMBA sub-regions */
export const ZONE_MULTIPLIERS: Record<string, number> = {
  caba: 1.0,
  gba_norte: 0.92,
  gba_sur: 0.88,
  gba_oeste: 0.87,
};

/** Default overhead and profit percentages */
export const COST_STRUCTURE = {
  overheadPercent: 10, // Gastos generales
  profitPercent: 12, // Beneficio
  ivaPercent: 21,
};

/** Get unit cost for an item, falling back to incidence-based estimate */
export function getUnitCost(itemCode: string): UnitCost | null {
  return AMBA_UNIT_COSTS[itemCode] ?? null;
}
