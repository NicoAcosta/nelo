/**
 * Nelo — USD Converter
 *
 * ARS to USD conversion using the cached blue (informal) dollar rate.
 *
 * Per D-17: price per m2 displayed in USD.
 * Per D-18: blue rate uses DolarAPI `venta` (sell) field.
 * Per D-19: ARS kept internally; USD conversion on summary fields only.
 */

import { readCache } from "@/lib/pricing/cache-manager";
import type { BlueRateData } from "@/lib/data-sources/dolar-api";

/**
 * Fallback blue rate venta — reasonable March 2026 estimate.
 * Used when the cache file is absent or unreadable.
 */
export const FALLBACK_BLUE_VENTA = 1415;

/**
 * Returns the blue dollar venta (sell) rate from the cache.
 * Falls back to FALLBACK_BLUE_VENTA when cache is empty or missing.
 */
export function getBlueRateVenta(): number {
  const cached = readCache<BlueRateData>("blue-rate");
  if (cached && cached.data && cached.data.venta > 0) {
    return cached.data.venta;
  }
  return FALLBACK_BLUE_VENTA;
}

/**
 * Converts an ARS amount to USD using the given blue venta rate.
 *
 * Returns 0 if blueVenta is 0 (guards against division by zero).
 * Returns 0 if arsAmount is 0.
 * Result is rounded to the nearest whole dollar.
 */
export function convertToUsd(arsAmount: number, blueVenta: number): number {
  if (blueVenta <= 0 || arsAmount === 0) return 0;
  return Math.round(arsAmount / blueVenta);
}
