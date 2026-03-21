/**
 * Nelo — Dynamic Source Refresh Orchestrator
 *
 * Refreshes all API-sourced data: blue dollar rate and MercadoLibre prices.
 *
 * Per D-07: daily automated refresh for API-sourced data.
 * Per D-21: auto-refresh NEVER touches manual-overrides.json.
 *
 * UOCRA and ICC are manual-only (see refresh-manual.ts, per D-08).
 */

import { fetchBlueRate } from "./dolar-api";
import { fetchAllTrackedPrices } from "./mercadolibre";
import { writeCache } from "@/lib/pricing/cache-manager";

/** Result for a single data source refresh attempt */
export interface SourceResult {
  success: boolean;
  error?: string;
}

/** Combined result of refreshing all dynamic data sources */
export interface RefreshResult {
  blueRate: SourceResult;
  mercadolibre: SourceResult;
  refreshedAt: string; // ISO timestamp when refresh ran
}

/**
 * Refreshes all dynamic (API-sourced) data sources.
 *
 * Sources refreshed:
 * - Blue dollar rate (DolarAPI) → cache "blue-rate"
 * - MercadoLibre material prices → cache "mercadolibre"
 *
 * Sources NOT touched (manual only):
 * - manual-overrides.json (per D-21)
 * - UOCRA rates (per D-08)
 * - ICC history (per D-08)
 *
 * On per-source failure: continues to the next source and reports partial failure.
 * Never throws — always returns a RefreshResult.
 */
export async function refreshDynamicSources(): Promise<RefreshResult> {
  const refreshedAt = new Date().toISOString();

  // --- Blue rate refresh ---
  let blueRate: SourceResult;
  try {
    const data = await fetchBlueRate();
    writeCache("blue-rate", data, "dolar-api");
    blueRate = { success: true };
  } catch (err) {
    blueRate = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // --- MercadoLibre refresh ---
  let mercadolibre: SourceResult;
  try {
    const data = await fetchAllTrackedPrices();
    writeCache("mercadolibre", data, "mercadolibre-api");
    mercadolibre = { success: true };
  } catch (err) {
    mercadolibre = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return { blueRate, mercadolibre, refreshedAt };
}
