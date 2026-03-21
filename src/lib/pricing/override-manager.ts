/**
 * Nelo — Manual Override Manager
 *
 * Manages team-set price overrides that survive auto-refresh.
 * Overrides are stored in a dedicated JSON file that auto-refresh never touches.
 *
 * Per D-20: team can override any price.
 * Per D-21: manual overrides persist — auto-refresh never touches manual-overrides.json.
 */

import * as fs from "fs";
import * as path from "path";

import type { UnitCost } from "@/lib/estimate/types";
import { AMBA_UNIT_COSTS } from "./amba-unit-costs";

/** A manually-set price override for a specific line item */
export interface ManualOverride {
  materialCost: number; // ARS per unit
  laborCost: number; // ARS per unit
  totalCost: number; // ARS per unit (auto-calculated: materialCost + laborCost)
  source: string; // Human-readable reason (e.g., "architect review", "updated market data")
  setAt: string; // ISO timestamp when override was set
  setBy: string; // Who set the override (e.g., "team", "admin")
}

/** Default path to the manual overrides file */
const DEFAULT_OVERRIDES_PATH = path.join(
  process.cwd(),
  "src/lib/pricing/cache/manual-overrides.json",
);

/**
 * Loads all manual overrides from the overrides JSON file.
 * Returns an empty record if the file does not exist or is empty.
 */
export function loadOverrides(
  overridesPath: string = DEFAULT_OVERRIDES_PATH,
): Record<string, ManualOverride> {
  try {
    const raw = fs.readFileSync(overridesPath, "utf-8");
    if (!raw || raw.trim() === "") return {};
    return JSON.parse(raw) as Record<string, ManualOverride>;
  } catch {
    return {};
  }
}

/**
 * Sets a manual override for a specific item code.
 * Merges with existing overrides; does not delete other entries.
 * Auto-calculates totalCost and sets the setAt timestamp.
 */
export function setOverride(
  itemCode: string,
  override: {
    materialCost: number;
    laborCost: number;
    source: string;
    setBy: string;
  },
  overridesPath: string = DEFAULT_OVERRIDES_PATH,
): void {
  const current = loadOverrides(overridesPath);

  current[itemCode] = {
    materialCost: override.materialCost,
    laborCost: override.laborCost,
    totalCost: override.materialCost + override.laborCost,
    source: override.source,
    setAt: new Date().toISOString(),
    setBy: override.setBy,
  };

  // Ensure directory exists before writing
  const dir = path.dirname(overridesPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(overridesPath, JSON.stringify(current, null, 2), "utf-8");
}

/**
 * Gets a specific manual override by item code.
 * Returns null if no override exists for that code.
 */
export function getOverride(
  itemCode: string,
  overridesPath: string = DEFAULT_OVERRIDES_PATH,
): ManualOverride | null {
  const current = loadOverrides(overridesPath);
  return current[itemCode] ?? null;
}

/**
 * Removes a manual override for a specific item code.
 * No-op if the item code does not exist.
 */
export function removeOverride(
  itemCode: string,
  overridesPath: string = DEFAULT_OVERRIDES_PATH,
): void {
  const current = loadOverrides(overridesPath);
  if (!(itemCode in current)) return;

  delete current[itemCode];

  const dir = path.dirname(overridesPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(overridesPath, JSON.stringify(current, null, 2), "utf-8");
}

/**
 * Resolves the unit cost for an item code.
 *
 * Priority:
 * 1. Manual override (if exists) — source: "manual_override", isPlaceholder: false
 * 2. AMBA_UNIT_COSTS base table
 * 3. null if neither exists
 */
export function resolveUnitCost(
  itemCode: string,
  overridesPath: string = DEFAULT_OVERRIDES_PATH,
): UnitCost | null {
  // Check manual override first
  const override = getOverride(itemCode, overridesPath);
  if (override) {
    return {
      itemCode,
      materialCost: override.materialCost,
      laborCost: override.laborCost,
      totalCost: override.totalCost,
      lastUpdated: override.setAt,
      source: "manual_override",
      isPlaceholder: false,
    };
  }

  // Fall back to AMBA base prices
  const base = AMBA_UNIT_COSTS[itemCode];
  if (base) {
    return base;
  }

  return null;
}
