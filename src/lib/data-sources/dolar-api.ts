/**
 * Nelo — DolarAPI Blue Rate Adapter
 *
 * Fetches the Argentine blue (informal) USD exchange rate from DolarAPI.
 * Used for ARS-to-USD conversion in the pricing pipeline.
 *
 * Source: https://dolarapi.com/v1/dolares/blue
 * Update frequency: Real-time
 *
 * Per D-18: blue rate uses DolarAPI `venta` (sell) field for ARS->USD conversion.
 */

/** Typed response from DolarAPI /v1/dolares/blue endpoint */
export interface BlueRateData {
  compra: number; // Buy rate (ARS per USD)
  venta: number; // Sell rate (ARS per USD) — used for ARS->USD conversion
  fechaActualizacion: string; // ISO timestamp of last update
}

const DOLAR_API_URL = "https://dolarapi.com/v1/dolares/blue";

/**
 * Fetches the current blue dollar rate from DolarAPI.
 * Throws if the response is not successful.
 */
export async function fetchBlueRate(): Promise<BlueRateData> {
  const response = await fetch(DOLAR_API_URL);

  if (!response.ok) {
    throw new Error(`DolarAPI fetch failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    compra: Number(data.compra),
    venta: Number(data.venta),
    fechaActualizacion: String(data.fechaActualizacion),
  };
}

/**
 * Returns the current blue dollar venta (sell) rate.
 * The sell rate is used for ARS-to-USD conversion (buying USD with ARS).
 */
export async function getBlueVenta(): Promise<number> {
  const data = await fetchBlueRate();
  return data.venta;
}
