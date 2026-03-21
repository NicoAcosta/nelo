/**
 * Nelo — Calculation Engine
 *
 * Pure functions that take ProjectInputs and produce an Estimate.
 * No side effects, no I/O, fully unit-testable.
 */

import type {
  ProjectInputs,
  LineItem,
  CategoryTotal,
  Estimate,
  Assumption,
  ConfidenceLevel,
  Unit,
} from "./types";
import {
  deriveBaseQuantities,
  resolveItemQuantity,
  evaluateConditions,
  type BaseQuantities,
} from "./derive-quantities";
import { CATEGORIES } from "@/lib/pricing/categories-config";
import { AMBA_UNIT_COSTS, ZONE_MULTIPLIERS, COST_STRUCTURE } from "@/lib/pricing/amba-unit-costs";

/**
 * Produces all line items with quantities and costs applied.
 */
export function applyUnitCosts(inputs: ProjectInputs): LineItem[] {
  const base = deriveBaseQuantities(inputs);
  const zoneMultiplier = ZONE_MULTIPLIERS[inputs.locationZone ?? "caba"] ?? 1.0;

  const lineItems: LineItem[] = [];

  for (const category of CATEGORIES) {
    for (const sub of category.subcategories) {
      for (const item of sub.items) {
        const isActive = evaluateConditions(item.conditions, inputs);
        const quantity = isActive
          ? resolveItemQuantity(item.quantityCoefficient, base)
          : 0;

        const unitCost = AMBA_UNIT_COSTS[item.code];
        const materialCost = (unitCost?.materialCost ?? 0) * zoneMultiplier;
        const laborCost = (unitCost?.laborCost ?? 0) * zoneMultiplier;
        const totalCost = materialCost + laborCost;

        lineItems.push({
          code: item.code,
          categoryId: category.id,
          description: item.description,
          unit: item.unit as Unit,
          quantity: Math.round(quantity * 100) / 100,
          materialCostPerUnit: Math.round(materialCost),
          laborCostPerUnit: Math.round(laborCost),
          totalCostPerUnit: Math.round(totalCost),
          subtotal: Math.round(quantity * totalCost),
          isActive,
          source: unitCost ? (unitCost.isPlaceholder ? "placeholder" : "calculated") : "placeholder",
        });
      }
    }
  }

  return lineItems;
}

/**
 * Groups line items by category and calculates subtotals + incidence %.
 */
export function sumByCategory(lineItems: LineItem[]): CategoryTotal[] {
  const activeItems = lineItems.filter((i) => i.isActive);
  const directCost = activeItems.reduce((sum, i) => sum + i.subtotal, 0);

  const categoryMap = new Map<string, { items: LineItem[]; subtotal: number }>();

  for (const item of activeItems) {
    const existing = categoryMap.get(item.categoryId);
    if (existing) {
      existing.items.push(item);
      existing.subtotal += item.subtotal;
    } else {
      categoryMap.set(item.categoryId, {
        items: [item],
        subtotal: item.subtotal,
      });
    }
  }

  // Also include categories from config that have no active items (show as 0)
  for (const cat of CATEGORIES) {
    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, { items: [], subtotal: 0 });
    }
  }

  return Array.from(categoryMap.entries()).map(([id, data]) => {
    const catConfig = CATEGORIES.find((c) => c.id === id);
    return {
      id,
      name: catConfig?.name ?? id,
      subtotal: data.subtotal,
      incidencePercent: directCost > 0 ? (data.subtotal / directCost) * 100 : 0,
      lineItems: data.items,
    };
  });
}

/**
 * Determines confidence level based on how many inputs are provided.
 */
export function computeConfidence(inputs: ProjectInputs): ConfidenceLevel {
  const fields = Object.entries(inputs).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  const count = fields.length;

  if (count >= 15) return "detailed";
  if (count >= 8) return "standard";
  return "quick";
}

const CONFIDENCE_RANGES: Record<ConfidenceLevel, { low: number; high: number }> = {
  quick: { low: 40, high: 50 },
  standard: { low: 20, high: 25 },
  detailed: { low: 10, high: 15 },
};

/**
 * Collects assumptions made due to missing inputs.
 */
function collectAssumptions(inputs: ProjectInputs): Assumption[] {
  const assumptions: Assumption[] = [];

  if (inputs.ceilingHeightM === undefined) {
    assumptions.push({ field: "ceilingHeightM", label: "Altura de piso a techo", assumedValue: "2.60m", source: "default" });
  }
  if (inputs.footprintM2 === undefined && inputs.totalFloorAreaM2 && inputs.stories) {
    assumptions.push({ field: "footprintM2", label: "Superficie de pisada", assumedValue: `${Math.round(inputs.totalFloorAreaM2 / inputs.stories)}m² (total / plantas)`, source: "default" });
  }
  if (inputs.perimeterMl === undefined && inputs.footprintM2) {
    assumptions.push({ field: "perimeterMl", label: "Perímetro", assumedValue: `${Math.round(4 * Math.sqrt(inputs.footprintM2))}ml (estimado de planta cuadrada)`, source: "default" });
  } else if (inputs.perimeterMl === undefined) {
    assumptions.push({ field: "perimeterMl", label: "Perímetro", assumedValue: "Estimado de planta cuadrada", source: "default" });
  }
  if (inputs.doorCount === undefined) {
    assumptions.push({ field: "doorCount", label: "Cantidad de puertas", assumedValue: "0 (no especificado)", source: "default" });
  }
  if (inputs.windowCount === undefined) {
    assumptions.push({ field: "windowCount", label: "Cantidad de ventanas", assumedValue: "0 (no especificado)", source: "default" });
  }
  if (inputs.bathroomCount === undefined) {
    assumptions.push({ field: "bathroomCount", label: "Cantidad de baños", assumedValue: "0 (no especificado)", source: "default" });
  }

  return assumptions;
}

/**
 * Full estimation pipeline.
 * ProjectInputs → LineItems → CategoryTotals → Cost Structure → Estimate
 */
export function computeEstimate(inputs: ProjectInputs): Estimate {
  const lineItems = applyUnitCosts(inputs);
  const categories = sumByCategory(lineItems);
  const confidence = computeConfidence(inputs);
  const assumptions = collectAssumptions(inputs);

  const activeItems = lineItems.filter((i) => i.isActive);
  const directCost = activeItems.reduce((sum, i) => sum + i.subtotal, 0);

  // If direct cost is zero (no pricing data), use incidence-based estimation
  // This provides a rough estimate even with placeholder data
  const effectiveDirectCost = directCost > 0 ? directCost : estimateFromIncidence(inputs);

  const overheadAmount = Math.round(effectiveDirectCost * COST_STRUCTURE.overheadPercent / 100);
  const profitAmount = Math.round(effectiveDirectCost * COST_STRUCTURE.profitPercent / 100);
  const subtotalBeforeTax = effectiveDirectCost + overheadAmount + profitAmount;
  const ivaAmount = Math.round(subtotalBeforeTax * COST_STRUCTURE.ivaPercent / 100);
  const totalPrice = subtotalBeforeTax + ivaAmount;

  const floorArea = inputs.totalFloorAreaM2 || 1;
  const pricePerM2 = Math.round(totalPrice / floorArea);

  return {
    pricePerM2,
    totalPrice,
    directCost: effectiveDirectCost,
    overheadPercent: COST_STRUCTURE.overheadPercent,
    overheadAmount,
    profitPercent: COST_STRUCTURE.profitPercent,
    profitAmount,
    subtotalBeforeTax,
    ivaPercent: COST_STRUCTURE.ivaPercent,
    ivaAmount,
    categories,
    totalLineItems: lineItems.length,
    activeLineItems: activeItems.length,
    confidence,
    confidenceRange: CONFIDENCE_RANGES[confidence],
    inputsProvided: Object.values(inputs).filter((v) => v !== undefined).length,
    inputsTotal: 30, // approximate total possible inputs
    assumptions,
    locationZone: inputs.locationZone ?? "caba",
    floorAreaM2: floorArea,
    priceBaseDate: "2024-07-01",
    iccBaseValue: 1000,
    iccCurrentValue: 1000,
  };
}

/**
 * Fallback: estimate direct cost from incidence percentages when no unit costs exist.
 * Uses a rough market reference of ~$900,000 ARS/m² (mid-range, AMBA, Q1 2024).
 */
function estimateFromIncidence(inputs: ProjectInputs): number {
  const area = inputs.totalFloorAreaM2 ?? 100;
  const roughCostPerM2 = 900_000; // ARS — rough mid-range reference
  return Math.round(area * roughCostPerM2);
}
