/**
 * Nelo — Pricing Coverage Tests
 *
 * Verifies that every item code in categories-config.ts has a corresponding
 * entry in AMBA_UNIT_COSTS with real (non-placeholder) prices.
 *
 * This test is intentionally RED until Tasks 2+3 populate all items.
 */

import { describe, it, expect } from "vitest";
import { getAllItems } from "@/lib/pricing/categories-config";
import { AMBA_UNIT_COSTS } from "@/lib/pricing/amba-unit-costs";

describe("AMBA_UNIT_COSTS coverage", () => {
  const allItems = getAllItems();

  it("every item in categories-config has a unit cost entry", () => {
    const missingCodes: string[] = [];
    for (const item of allItems) {
      if (!AMBA_UNIT_COSTS[item.code]) {
        missingCodes.push(item.code);
      }
    }
    if (missingCodes.length > 0) {
      throw new Error(
        `Missing unit costs for ${missingCodes.length} items: ${missingCodes.join(", ")}`
      );
    }
    expect(missingCodes).toHaveLength(0);
  });

  it("no item is a placeholder", () => {
    const placeholderCodes: string[] = [];
    for (const [code, cost] of Object.entries(AMBA_UNIT_COSTS)) {
      if (cost.isPlaceholder) {
        placeholderCodes.push(code);
      }
    }
    if (placeholderCodes.length > 0) {
      throw new Error(
        `Found ${placeholderCodes.length} placeholder items: ${placeholderCodes.join(", ")}`
      );
    }
    expect(placeholderCodes).toHaveLength(0);
  });

  it("every item has a real source (not 'placeholder')", () => {
    const badSources: string[] = [];
    for (const [code, cost] of Object.entries(AMBA_UNIT_COSTS)) {
      if (cost.source.toLowerCase().includes("placeholder")) {
        badSources.push(`${code}: "${cost.source}"`);
      }
    }
    if (badSources.length > 0) {
      throw new Error(
        `Found ${badSources.length} items with placeholder sources: ${badSources.join("; ")}`
      );
    }
    expect(badSources).toHaveLength(0);
  });

  it("every item has a recent lastUpdated date (within last 6 months)", () => {
    const cutoff = Date.now() - 180 * 86400 * 1000; // 6 months ago
    const staleCodes: string[] = [];
    for (const [code, cost] of Object.entries(AMBA_UNIT_COSTS)) {
      const parsed = Date.parse(cost.lastUpdated);
      if (isNaN(parsed) || parsed < cutoff) {
        staleCodes.push(`${code}: "${cost.lastUpdated}"`);
      }
    }
    if (staleCodes.length > 0) {
      throw new Error(
        `Found ${staleCodes.length} items with stale lastUpdated: ${staleCodes.join("; ")}`
      );
    }
    expect(staleCodes).toHaveLength(0);
  });
});
