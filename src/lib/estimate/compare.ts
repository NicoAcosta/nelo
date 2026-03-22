import type { Estimate } from "@/lib/estimate/types";

export interface CategoryDelta {
  id: string;
  name: string;
  versionA: number;
  versionB: number;
  delta: number;
  deltaPercent: number;
}

export interface EstimateComparison {
  categories: CategoryDelta[];
  totalPriceDelta: number;
  totalPricePercentDelta: number;
  pricePerM2Delta: number;
}

/**
 * Compare two Estimate objects and return per-category deltas + summary deltas.
 * Per D-03: estimates are immutable JSONB — comparison reads from stored result objects.
 *
 * - Categories present in A but not B get versionB=0
 * - Categories present in B but not A get versionA=0
 * - deltaPercent is 0 when versionA is 0 (avoid division by zero)
 */
export function compareEstimates(a: Estimate, b: Estimate): EstimateComparison {
  // Build maps keyed by category id
  const mapA = new Map(a.categories.map((cat) => [cat.id, cat]));
  const mapB = new Map(b.categories.map((cat) => [cat.id, cat]));

  // Collect all unique category ids preserving order (A first, then B-only)
  const allIds = new Set([...mapA.keys(), ...mapB.keys()]);

  const categories: CategoryDelta[] = [];

  for (const id of allIds) {
    const catA = mapA.get(id);
    const catB = mapB.get(id);

    const name = catA?.name ?? catB!.name;
    const versionA = catA?.subtotal ?? 0;
    const versionB = catB?.subtotal ?? 0;
    const delta = versionB - versionA;
    const deltaPercent = versionA > 0 ? (delta / versionA) * 100 : 0;

    categories.push({ id, name, versionA, versionB, delta, deltaPercent });
  }

  const totalPriceDelta = b.totalPrice - a.totalPrice;
  const totalPricePercentDelta =
    a.totalPrice > 0 ? (totalPriceDelta / a.totalPrice) * 100 : 0;
  const pricePerM2Delta = b.pricePerM2 - a.pricePerM2;

  return {
    categories,
    totalPriceDelta,
    totalPricePercentDelta,
    pricePerM2Delta,
  };
}
