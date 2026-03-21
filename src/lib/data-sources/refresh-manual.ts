/**
 * Nelo — Manual Refresh Script for UOCRA and ICC
 *
 * Writes current UOCRA wage scales and ICC index history to cache files.
 * Run this script after updating uocra.ts or indec-icc.ts with new data.
 *
 * Usage: npm run refresh:manual
 *        npx tsx src/lib/data-sources/refresh-manual.ts
 *
 * Per D-08: UOCRA (bimonthly) and ICC (monthly) update too infrequently
 * for automated cron. This script provides a one-command update workflow.
 */

import { writeCache } from "@/lib/pricing/cache-manager";
import { UOCRA_RATES } from "./uocra";
import { getICCHistory } from "./indec-icc";

/** Result for a single manual refresh attempt */
export interface ManualSourceResult {
  success: boolean;
  error?: string;
  updatedAt: string; // ISO timestamp
}

/** Combined result of refreshing all manual sources */
export interface ManualRefreshResult {
  uocra: ManualSourceResult;
  icc: ManualSourceResult;
  refreshedAt: string; // ISO timestamp
}

/**
 * Writes current UOCRA_RATES to the uocra-rates cache file.
 * Run after updating src/lib/data-sources/uocra.ts with new paritaria values.
 */
export async function refreshUOCRA(): Promise<ManualSourceResult> {
  const updatedAt = new Date().toISOString();
  try {
    writeCache("uocra-rates", UOCRA_RATES, "manual-refresh");
    return { success: true, updatedAt };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      updatedAt,
    };
  }
}

/**
 * Writes current ICC history to the icc-history cache file.
 * Run after adding new INDEC press release data to src/lib/data-sources/indec-icc.ts.
 */
export async function refreshICC(): Promise<ManualSourceResult> {
  const updatedAt = new Date().toISOString();
  try {
    const history = getICCHistory();
    writeCache("icc-history", history, "manual-refresh");
    return { success: true, updatedAt };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      updatedAt,
    };
  }
}

/**
 * Refreshes both UOCRA and ICC cache files.
 * Called by `npm run refresh:manual`.
 */
export async function refreshManualSources(): Promise<ManualRefreshResult> {
  const refreshedAt = new Date().toISOString();
  const [uocra, icc] = await Promise.all([refreshUOCRA(), refreshICC()]);
  return { uocra, icc, refreshedAt };
}

// CLI entry point: npm run refresh:manual
// Runs when invoked directly via tsx (not when imported as a module)
if (
  typeof require !== "undefined" &&
  (require.main === module ||
    process.argv[1]?.includes("refresh-manual"))
) {
  refreshManualSources().then((result) => {
    console.log("Manual refresh complete:", JSON.stringify(result, null, 2));
    process.exit(result.uocra.success && result.icc.success ? 0 : 1);
  });
}
