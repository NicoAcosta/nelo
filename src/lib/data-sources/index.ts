/**
 * Nelo — Data Sources Index
 *
 * Aggregates all pricing data sources into a unified interface.
 */

export {
  getLatestICC,
  getICCForDate,
  getAdjustmentFromDate,
  calculateICCAdjustment,
  ICC_SOURCE_INFO,
} from "./indec-icc";

export {
  UOCRA_RATES,
  getEffectiveRate,
  calculateLaborCost,
  CREW_COMPOSITIONS,
  UOCRA_SOURCE_INFO,
} from "./uocra";

export {
  searchMaterial,
  fetchMaterialPrice,
  fetchAllTrackedPrices,
  TRACKED_MATERIALS,
  WHOLESALE_DISCOUNT,
  toWholesalePrice,
  MELI_SOURCE_INFO,
} from "./mercadolibre";

export type { LaborRate, WorkerCategory } from "./uocra";
export type { MaterialPrice, MaterialSearchResult } from "./mercadolibre";

/** All data source metadata for transparency */
export const ALL_SOURCES = {
  icc: () => import("./indec-icc").then((m) => m.ICC_SOURCE_INFO),
  uocra: () => import("./uocra").then((m) => m.UOCRA_SOURCE_INFO),
  mercadolibre: () => import("./mercadolibre").then((m) => m.MELI_SOURCE_INFO),
};
