/**
 * Nelo — Composition Formula Engine
 *
 * Computes unit costs from labor and material inputs:
 *   unit cost = (labor hours × UOCRA effective rate) + (material qty × retail price × wholesale discount)
 *
 * Per D-03: composition = (labor hours x UOCRA rate) + (material qty x market price)
 * Per D-05: wholesale discount varies by material type (bulk=0.70, standard=0.75, specialty=0.80)
 * Per D-13: FERES incidence percentages NOT trusted — composition formulas derive costs independently
 */

import { calculateLaborCost, CREW_COMPOSITIONS } from "@/lib/data-sources/uocra";
import type { UnitCost } from "@/lib/estimate/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Wholesale category determines the discount factor applied to retail prices.
 * - bulk: high-volume commodities (sand, gravel, aggregate) — 0.70
 * - standard: common materials (bricks, cement, lime, tiles) — 0.75
 * - specialty: low-volume or specialized items (membranes, fixtures) — 0.80
 */
export type WholesaleCategory = "bulk" | "standard" | "specialty";

/** A single material input in a composition formula */
export interface MaterialInput {
  name: string;
  quantity: number; // units per output unit (e.g., bricks per m²)
  retailPricePerUnit: number; // ARS
  wholesaleCategory: WholesaleCategory;
}

/**
 * Describes how to compute the unit cost of a construction line item.
 * Crew can be specified as a named key from CREW_COMPOSITIONS or as explicit hours.
 */
export interface CompositionFormula {
  itemCode: string;
  crewType: keyof typeof CREW_COMPOSITIONS | { oficialHours: number; ayudanteHours: number };
  materials: MaterialInput[];
  description: string;
}

// ---------------------------------------------------------------------------
// Wholesale discount table
// ---------------------------------------------------------------------------

const WHOLESALE_DISCOUNT_TABLE: Record<WholesaleCategory, number> = {
  bulk: 0.70,
  standard: 0.75,
  specialty: 0.80,
};

/**
 * Returns the wholesale discount factor for a given material category.
 *
 * @param category - "bulk" | "standard" | "specialty"
 * @returns decimal multiplier (e.g., 0.75 means 25% discount from retail)
 */
export function getWholesaleDiscount(category: WholesaleCategory): number {
  return WHOLESALE_DISCOUNT_TABLE[category];
}

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

/**
 * Computes the unit cost for a construction line item using composition formulas.
 *
 * @param formula - The composition formula describing labor + materials
 * @returns UnitCost with itemCode, materialCost, laborCost, totalCost, and metadata
 */
export function computeUnitCost(formula: CompositionFormula): UnitCost {
  // Resolve crew hours
  let oficialHours: number;
  let ayudanteHours: number;

  if (typeof formula.crewType === "string") {
    const crew = CREW_COMPOSITIONS[formula.crewType];
    oficialHours = crew.oficialHours;
    ayudanteHours = crew.ayudanteHours;
  } else {
    oficialHours = formula.crewType.oficialHours;
    ayudanteHours = formula.crewType.ayudanteHours;
  }

  // Labor cost: uses UOCRA effective rates (base + zone supplement) * social charges
  const laborCost = calculateLaborCost(oficialHours, ayudanteHours);

  // Material cost: sum of (qty * retailPrice * wholesaleDiscount) per material
  let materialCostRaw = 0;
  for (const mat of formula.materials) {
    materialCostRaw += mat.quantity * mat.retailPricePerUnit * getWholesaleDiscount(mat.wholesaleCategory);
  }
  const materialCost = Math.round(materialCostRaw);

  return {
    itemCode: formula.itemCode,
    materialCost,
    laborCost,
    totalCost: materialCost + laborCost,
    lastUpdated: new Date().toISOString(),
    source: "composition",
    isPlaceholder: false,
  };
}
