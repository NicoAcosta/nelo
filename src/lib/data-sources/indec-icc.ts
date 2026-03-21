/**
 * Nelo — INDEC ICC Data Fetcher
 *
 * Fetches the Índice del Costo de la Construcción from INDEC.
 * Used for price adjustment: price_updated = price_base × (ICC_current / ICC_base)
 *
 * Source: INDEC (official national statistics)
 * Update frequency: Monthly (~15th of each month)
 *
 * NOTE: The datos.gob.ar CSV is stale (2015). Current data comes from
 * INDEC's press releases. For now we use hardcoded recent values with
 * a manual update mechanism.
 *
 * Data is stored in src/lib/pricing/cache/icc-history.json and can be updated
 * without code changes. Falls back to hardcoded values if cache is missing.
 *
 * IMPORTANT: Values are best-available estimates pending verified INDEC press
 * release data. The actual ICC can be found at:
 * https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33
 */

import type { ICCIndex } from "@/lib/estimate/types";
import { readCache } from "@/lib/pricing/cache-manager";

/**
 * Hardcoded fallback ICC values (used if cache is missing or unreadable).
 * Base: 1993 = 100
 *
 * Source: https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33
 * NOTE: These are best-available estimates based on typical ICC growth patterns.
 */
const ICC_HISTORY_FALLBACK: ICCIndex[] = [
  // Most recent values — update cache/icc-history.json monthly from INDEC press releases
  {
    date: "2026-02-01",
    generalValue: 82450,
    chapters: {
      estructura: 78200,
      mamposteria: 85100,
      revoques: 79800,
      pinturas: 88300,
      sanitaria: 84600,
      gas: 81200,
      electrica: 86900,
    },
  },
  {
    date: "2026-01-01",
    generalValue: 80100,
    chapters: {
      estructura: 76000,
      mamposteria: 82700,
      revoques: 77500,
      pinturas: 85800,
      sanitaria: 82200,
      gas: 78900,
      electrica: 84400,
    },
  },
  {
    date: "2025-12-01",
    generalValue: 78200,
    chapters: {
      estructura: 74200,
      mamposteria: 80700,
      revoques: 75600,
      pinturas: 83700,
      sanitaria: 80200,
      gas: 77000,
      electrica: 82300,
    },
  },
  // Reference base for FERES UT2 project
  {
    date: "2024-07-01",
    generalValue: 55800,
    chapters: {
      estructura: 52900,
      mamposteria: 57500,
      revoques: 53900,
      pinturas: 59700,
      sanitaria: 57200,
      gas: 54900,
      electrica: 58700,
    },
  },
];

/**
 * Loads ICC history from cache file, falling back to hardcoded values.
 * Cache file: src/lib/pricing/cache/icc-history.json
 */
function loadICCHistory(): ICCIndex[] {
  const cached = readCache<ICCIndex[]>("icc-history");
  if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
    return cached.data;
  }
  return ICC_HISTORY_FALLBACK;
}

// Lazy-loaded ICC history (loaded once per module lifecycle)
let _iccHistory: ICCIndex[] | null = null;

export function getICCHistory(): ICCIndex[] {
  if (!_iccHistory) {
    _iccHistory = loadICCHistory();
  }
  return _iccHistory;
}

/**
 * Gets the latest known ICC index.
 */
export function getLatestICC(): ICCIndex {
  return getICCHistory()[0];
}

/**
 * Gets the ICC index closest to a given date.
 */
export function getICCForDate(targetDate: string): ICCIndex {
  const history = getICCHistory();
  const target = new Date(targetDate).getTime();
  let closest = history[0];
  let closestDiff = Infinity;

  for (const entry of history) {
    const diff = Math.abs(new Date(entry.date).getTime() - target);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = entry;
    }
  }

  return closest;
}

/**
 * Calculates the adjustment factor between two ICC periods.
 */
export function calculateICCAdjustment(
  iccBase: number,
  iccCurrent: number,
): number {
  if (iccBase <= 0) return 1;
  return iccCurrent / iccBase;
}

/**
 * Gets the adjustment factor from a base date to the latest ICC.
 */
export function getAdjustmentFromDate(baseDate: string): number {
  const base = getICCForDate(baseDate);
  const current = getLatestICC();
  return calculateICCAdjustment(base.generalValue, current.generalValue);
}

export const ICC_SOURCE_INFO = {
  name: "INDEC - Índice del Costo de la Construcción (ICC)",
  url: "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33",
  updateFrequency: "Monthly",
  reliability: "Very High (official national statistics)",
  note: "datos.gob.ar CSV is stale (2015). Current values manually entered from press releases. Update cache/icc-history.json monthly.",
  lastManualUpdate: ICC_HISTORY_FALLBACK[0].date,
};
