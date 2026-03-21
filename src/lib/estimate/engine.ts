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
import { updatePrice } from "./types";
import {
  deriveBaseQuantities,
  resolveItemQuantity,
  evaluateConditions,
  type BaseQuantities,
} from "./derive-quantities";
import { CATEGORIES } from "@/lib/pricing/categories-config";
import { AMBA_UNIT_COSTS, ZONE_MULTIPLIERS, COST_STRUCTURE } from "@/lib/pricing/amba-unit-costs";
import { getLatestICC } from "@/lib/data-sources/indec-icc";
import { getBlueRateVenta, convertToUsd } from "@/lib/pricing/usd-converter";
import type { Locale } from "@/lib/i18n/types";
import { translations } from "@/lib/i18n/translations";

/**
 * Produces all line items with quantities and costs applied.
 */
export function applyUnitCosts(inputs: ProjectInputs): LineItem[] {
  const base = deriveBaseQuantities(inputs);
  const zoneMultiplier = ZONE_MULTIPLIERS[inputs.locationZone ?? "caba"] ?? 1.0;
  const iccCurrent = getLatestICC().generalValue;

  const lineItems: LineItem[] = [];

  for (const category of CATEGORIES) {
    for (const sub of category.subcategories) {
      for (const item of sub.items) {
        const isActive = evaluateConditions(item.conditions, inputs);
        const quantity = isActive
          ? resolveItemQuantity(item.quantityCoefficient, base)
          : 0;

        const unitCost = AMBA_UNIT_COSTS[item.code];

        // Per-item ICC adjustment: if iccBaseValue is set, adjust price to current ICC level
        const rawTotalCost = unitCost?.totalCost ?? 0;
        const iccAdjustedTotal = (unitCost?.iccBaseValue && unitCost.iccBaseValue > 0)
          ? updatePrice(rawTotalCost, unitCost.iccBaseValue, iccCurrent)
          : rawTotalCost;

        // Proportionally split ICC-adjusted total back into material and labor
        const rawMaterialFraction = rawTotalCost > 0 ? (unitCost?.materialCost ?? 0) / rawTotalCost : 0.5;
        const materialCost = iccAdjustedTotal * rawMaterialFraction * zoneMultiplier;
        const laborCost = iccAdjustedTotal * (1 - rawMaterialFraction) * zoneMultiplier;
        const totalCost = materialCost + laborCost;

        const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
        const subtotal = Math.round(safeQuantity * totalCost);

        lineItems.push({
          code: item.code,
          categoryId: category.id,
          description: item.description,
          unit: item.unit as Unit,
          quantity: Math.round(safeQuantity * 100) / 100,
          materialCostPerUnit: Math.round(materialCost),
          laborCostPerUnit: Math.round(laborCost),
          totalCostPerUnit: Math.round(totalCost),
          subtotal: Number.isFinite(subtotal) ? subtotal : 0,
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
export function sumByCategory(lineItems: LineItem[], locale: Locale = "en"): CategoryTotal[] {
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
      name: locale === "en" ? (catConfig?.nameEn ?? catConfig?.name ?? id) : (catConfig?.name ?? id),
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
function collectAssumptions(inputs: ProjectInputs, locale: Locale = "en"): Assumption[] {
  const assumptions: Assumption[] = [];
  const t = translations[locale];

  if (inputs.ceilingHeightM === undefined) {
    assumptions.push({ field: "ceilingHeightM", label: t["engine.assumptionCeilingHeight"], assumedValue: "2.60m", source: "default" });
  }
  if (inputs.footprintM2 === undefined && inputs.totalFloorAreaM2 && inputs.stories) {
    assumptions.push({ field: "footprintM2", label: t["engine.assumptionFootprint"], assumedValue: `${Math.round(inputs.totalFloorAreaM2 / inputs.stories)}m² (${t["engine.assumptionTotalDivStories"]})`, source: "default" });
  }
  if (inputs.perimeterMl === undefined && inputs.footprintM2) {
    assumptions.push({ field: "perimeterMl", label: t["engine.assumptionPerimeter"], assumedValue: `${Math.round(4 * Math.sqrt(inputs.footprintM2))}ml (${t["engine.assumptionEstimatedSquare"]})`, source: "default" });
  } else if (inputs.perimeterMl === undefined) {
    assumptions.push({ field: "perimeterMl", label: t["engine.assumptionPerimeter"], assumedValue: t["engine.assumptionEstimatedSquare"], source: "default" });
  }
  if (inputs.doorCount === undefined) {
    assumptions.push({ field: "doorCount", label: t["engine.assumptionDoors"], assumedValue: `0 (${t["engine.assumptionNotSpecified"]})`, source: "default" });
  }
  if (inputs.windowCount === undefined) {
    assumptions.push({ field: "windowCount", label: t["engine.assumptionWindows"], assumedValue: `0 (${t["engine.assumptionNotSpecified"]})`, source: "default" });
  }
  if (inputs.bathroomCount === undefined) {
    assumptions.push({ field: "bathroomCount", label: t["engine.assumptionBathrooms"], assumedValue: `0 (${t["engine.assumptionNotSpecified"]})`, source: "default" });
  }

  return assumptions;
}

/**
 * Full estimation pipeline.
 * ProjectInputs → LineItems → CategoryTotals → Cost Structure → Estimate
 */
export function computeEstimate(inputs: ProjectInputs, locale: Locale = "en"): Estimate {
  const lineItems = applyUnitCosts(inputs);
  const categories = sumByCategory(lineItems, locale);
  const confidence = computeConfidence(inputs);
  const assumptions = collectAssumptions(inputs, locale);

  const activeItems = lineItems.filter((i) => i.isActive);
  const directCost = activeItems.reduce((sum, i) => sum + i.subtotal, 0);

  // If direct cost is zero (no pricing data), use incidence-based estimation
  // This provides a rough estimate even with placeholder data
  const rawEffective = directCost > 0 ? directCost : estimateFromIncidence(inputs);
  const effectiveDirectCost = Number.isFinite(rawEffective) ? rawEffective : 0;

  const overheadAmount = Math.round(effectiveDirectCost * COST_STRUCTURE.overheadPercent / 100);
  const profitAmount = Math.round(effectiveDirectCost * COST_STRUCTURE.profitPercent / 100);
  const subtotalBeforeTax = effectiveDirectCost + overheadAmount + profitAmount;
  const ivaAmount = Math.round(subtotalBeforeTax * COST_STRUCTURE.ivaPercent / 100);
  const totalPrice = subtotalBeforeTax + ivaAmount;

  const floorArea = inputs.totalFloorAreaM2 && inputs.totalFloorAreaM2 > 0
    ? inputs.totalFloorAreaM2
    : 1;
  const rawPricePerM2 = totalPrice / floorArea;
  const pricePerM2 = Number.isFinite(rawPricePerM2) ? Math.round(rawPricePerM2) : 0;

  const latestICC = getLatestICC();

  // USD conversion (D-17, D-18, D-19)
  const blueVenta = getBlueRateVenta();
  const pricePerM2Usd = convertToUsd(pricePerM2, blueVenta);
  const totalPriceUsd = convertToUsd(totalPrice, blueVenta);

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
    priceBaseDate: latestICC.date,
    iccBaseValue: latestICC.generalValue,
    iccCurrentValue: latestICC.generalValue,
    // USD display (D-17, D-19)
    pricePerM2Usd,
    totalPriceUsd,
    blueRateVenta: blueVenta,
    blueRateDate: new Date().toISOString().split("T")[0],
    // Price freshness (D-10)
    pricingLastUpdated: "2026-03-21",
  };
}

/**
 * Fallback: estimate direct cost from incidence percentages when no unit costs exist.
 * Reference: GCBA ICCBA Nov 2025 ~$1.1M/m2 adjusted to Mar 2026 via ICC (~1.2M)
 * Per D-15: replaces the hardcoded $900K fallback.
 */
function estimateFromIncidence(inputs: ProjectInputs): number {
  const area = inputs.totalFloorAreaM2 ?? 100;
  const roughCostPerM2 = 1_200_000; // ARS — GCBA ICCBA Nov 2025 ~$1.1M/m2 adjusted to Mar 2026 via ICC (~1.2M)
  return Math.round(area * roughCostPerM2);
}
