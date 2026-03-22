/** 10-color palette: 9 distinct + 1 "rest" for remaining categories */
export const CATEGORY_PALETTE = [
  "#ccff00", // nelo green (cat 1)
  "#a8d900", // darker green (cat 2)
  "#3b82f6", // blue (cat 3)
  "#60a5fa", // light blue (cat 4)
  "#f59e0b", // orange (cat 5)
  "#fbbf24", // light orange (cat 6)
  "#22c55e", // green (cat 7)
  "#4ade80", // light green (cat 8)
  "#a855f7", // purple (cat 9)
  "#52525b", // zinc-600 (rest)
] as const;

/**
 * Assign colors to category IDs. Categories should be pre-sorted
 * by cost descending. Top 9 get distinct colors, rest get gray.
 */
export function assignCategoryColors(
  categoryIds: string[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < categoryIds.length; i++) {
    map.set(categoryIds[i], CATEGORY_PALETTE[Math.min(i, 9)]);
  }
  return map;
}
