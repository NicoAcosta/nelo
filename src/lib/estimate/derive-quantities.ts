/**
 * Nelo — Quantity Derivation
 *
 * Derives base measurements from ProjectInputs, then calculates
 * individual line item quantities using coefficients from categories config.
 *
 * Pure functions, no side effects.
 */

import type { ProjectInputs, ItemCondition } from "./types";

/** Default values for missing inputs */
const DEFAULTS = {
  ceilingHeightM: 2.6,
  stories: 1,
  doorCount: 0,
  windowCount: 0,
  bathroomCount: 0,
  kitchenCount: 0,
  /** Default door opening size for wall area deduction */
  doorWidthM: 0.80,
  doorHeightM: 2.10,
  /** Default window opening size for wall area deduction */
  windowWidthM: 1.20,
  windowHeightM: 1.50,
};

/** Base quantities derived from project inputs */
export interface BaseQuantities {
  floorAreaM2: number;
  footprintM2: number;
  perimeterMl: number;
  wallAreaM2: number; // net, after subtracting openings
  roofAreaM2: number;
  stories: number;
  ceilingHeightM: number;
  doorCount: number;
  windowCount: number;
  bathroomCount: number;
  kitchenCount: number;
}

/**
 * Derives all base quantities from project inputs.
 * Fills in missing values with reasonable defaults.
 */
export function deriveBaseQuantities(inputs: ProjectInputs): BaseQuantities {
  const stories = inputs.stories ?? DEFAULTS.stories;
  const ceilingHeightM = inputs.ceilingHeightM ?? DEFAULTS.ceilingHeightM;
  const floorAreaM2 = inputs.totalFloorAreaM2 ?? 0;
  const doorCount = inputs.doorCount ?? DEFAULTS.doorCount;
  const windowCount = inputs.windowCount ?? DEFAULTS.windowCount;
  const bathroomCount = inputs.bathroomCount ?? DEFAULTS.bathroomCount;
  const kitchenCount = inputs.kitchenCount ?? DEFAULTS.kitchenCount;

  // Footprint: ground floor area. If not provided, divide total by stories.
  const footprintM2 = inputs.footprintM2 ?? (stories > 0 ? floorAreaM2 / stories : floorAreaM2);

  // Perimeter: if not provided, estimate from footprint assuming rectangular plan
  // Rectangle with aspect ratio ≈ 1:1 → side = sqrt(footprint) → perimeter = 4 × side
  const perimeterMl = inputs.perimeterMl ?? 4 * Math.sqrt(footprintM2);

  // Gross wall area = perimeter × ceiling height × stories
  const grossWallArea = perimeterMl * ceilingHeightM * stories;

  // Deduct door and window openings
  const doorOpeningArea = doorCount * DEFAULTS.doorWidthM * DEFAULTS.doorHeightM;
  const windowOpeningArea = windowCount * DEFAULTS.windowWidthM * DEFAULTS.windowHeightM;
  const wallAreaM2 = Math.max(0, grossWallArea - doorOpeningArea - windowOpeningArea);

  // Roof area ≈ footprint for flat roofs (azotea)
  const roofAreaM2 = footprintM2;

  return {
    floorAreaM2,
    footprintM2,
    perimeterMl,
    wallAreaM2,
    roofAreaM2,
    stories,
    ceilingHeightM,
    doorCount,
    windowCount,
    bathroomCount,
    kitchenCount,
  };
}

/**
 * Resolves a quantity for a line item based on its coefficient and base quantities.
 */
export function resolveItemQuantity(
  coefficient: { baseMeasurement: string; multiplier: number } | undefined,
  base: BaseQuantities,
): number {
  if (!coefficient) return 0;

  const measurementMap: Record<string, number> = {
    floor_area: base.floorAreaM2,
    footprint: base.footprintM2,
    perimeter: base.perimeterMl,
    wall_area: base.wallAreaM2,
    roof_area: base.roofAreaM2,
    stories: base.stories,
    door_count: base.doorCount,
    window_count: base.windowCount,
    bathroom_count: base.bathroomCount,
    kitchen_count: base.kitchenCount,
    fixed: 1,
  };

  const baseValue = measurementMap[coefficient.baseMeasurement] ?? 0;
  return baseValue * coefficient.multiplier;
}

/**
 * Evaluates whether a line item's conditions are met.
 * All conditions must be true (AND logic).
 */
export function evaluateConditions(
  conditions: ItemCondition[] | undefined,
  inputs: ProjectInputs,
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((cond) => {
    const value = inputs[cond.field];

    switch (cond.operator) {
      case "equals":
        return value === cond.value;
      case "not_equals":
        return value !== cond.value;
      case "exists":
        return value !== undefined && value !== null;
      case "not_exists":
        return value === undefined || value === null;
      default:
        return true;
    }
  });
}
