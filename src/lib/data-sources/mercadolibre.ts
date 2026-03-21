/**
 * Nelo — MercadoLibre Material Price Fetcher
 *
 * Searches MercadoLibre Argentina API for construction material prices.
 * Provides retail price references for key materials.
 *
 * API: https://api.mercadolibre.com
 * Auth: Public search endpoints don't require OAuth for basic queries.
 * Rate limits: ~30 requests/minute for unauthenticated calls.
 *
 * NOTE: These are RETAIL prices (10-30% above wholesale).
 * Apply a wholesale discount factor for estimation purposes.
 */

const MELI_API_BASE = "https://api.mercadolibre.com";
const MELI_SITE_ID = "MLA"; // Argentina

/** Construction materials category on MercadoLibre */
const CONSTRUCTION_CATEGORY = "MLA1500"; // Materiales de Construcción

export interface MaterialPrice {
  query: string;
  title: string;
  price: number; // ARS
  currency: string;
  unit: string; // inferred (e.g., "bolsa", "m2", "unidad")
  permalink: string;
  seller: string;
  condition: string;
  fetchedAt: string;
}

export interface MaterialSearchResult {
  query: string;
  results: MaterialPrice[];
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
}

/**
 * Key construction materials to track.
 * Each entry has a search query and expected unit.
 */
export const TRACKED_MATERIALS = [
  { query: "cemite portland 50kg", unit: "bolsa 50kg", key: "cement_50kg" },
  { query: "ladrillo hueco ceramico 12x18x33", unit: "unidad", key: "brick_hollow_12" },
  { query: "ladrillo hueco ceramico 18x18x33", unit: "unidad", key: "brick_hollow_18" },
  { query: "hierro construccion 10mm aletado", unit: "barra 12m", key: "rebar_10mm" },
  { query: "hierro construccion 8mm aletado", unit: "barra 12m", key: "rebar_8mm" },
  { query: "arena gruesa construccion m3", unit: "m3", key: "sand_coarse" },
  { query: "cal hidratada 25kg", unit: "bolsa 25kg", key: "lime_25kg" },
  { query: "membrana asfaltica 4mm aluminio", unit: "rollo 10m2", key: "membrane_4mm" },
  { query: "porcellanato 60x60 primera", unit: "m2", key: "porcelain_60x60" },
  { query: "caño termofusion 25mm", unit: "barra 4m", key: "pipe_ppr_25mm" },
  { query: "cable unipolar 2.5mm", unit: "rollo 100m", key: "wire_2.5mm" },
  { query: "pintura latex interior 20 litros", unit: "lata 20L", key: "paint_latex_20l" },
] as const;

/**
 * Searches MercadoLibre for a construction material.
 * Returns top results with pricing data.
 */
export async function searchMaterial(
  query: string,
  limit: number = 10,
): Promise<MaterialPrice[]> {
  const url = new URL(`${MELI_API_BASE}/sites/${MELI_SITE_ID}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("category", CONSTRUCTION_CATEGORY);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("condition", "new");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `MercadoLibre search failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  return (data.results ?? []).map(
    (item: Record<string, unknown>): MaterialPrice => ({
      query,
      title: String(item.title ?? ""),
      price: Number(item.price ?? 0),
      currency: String(item.currency_id ?? "ARS"),
      unit: inferUnit(String(item.title ?? "")),
      permalink: String(item.permalink ?? ""),
      seller: String(
        (item.seller as Record<string, unknown>)?.nickname ?? "unknown",
      ),
      condition: String(item.condition ?? "new"),
      fetchedAt: new Date().toISOString(),
    }),
  );
}

/**
 * Fetches prices for a tracked material and returns aggregated stats.
 */
export async function fetchMaterialPrice(
  query: string,
): Promise<MaterialSearchResult> {
  const results = await searchMaterial(query, 15);
  const prices = results.map((r) => r.price).filter((p) => p > 0);

  prices.sort((a, b) => a - b);

  return {
    query,
    results,
    medianPrice: prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0,
    minPrice: prices.length > 0 ? prices[0] : 0,
    maxPrice: prices.length > 0 ? prices[prices.length - 1] : 0,
    sampleSize: prices.length,
  };
}

/**
 * Fetches all tracked material prices.
 * Runs searches sequentially to respect rate limits.
 */
export async function fetchAllTrackedPrices(): Promise<
  Record<string, MaterialSearchResult>
> {
  const results: Record<string, MaterialSearchResult> = {};

  for (const material of TRACKED_MATERIALS) {
    try {
      results[material.key] = await fetchMaterialPrice(material.query);
      // Respect rate limits: ~2 second delay between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to fetch ${material.key}:`, error);
    }
  }

  return results;
}

/**
 * Wholesale discount factor.
 * MercadoLibre prices are retail. Construction projects buy wholesale.
 */
export const WHOLESALE_DISCOUNT = 0.75; // 25% discount from retail

/**
 * Adjusts a retail price to estimated wholesale.
 */
export function toWholesalePrice(retailPrice: number): number {
  return Math.round(retailPrice * WHOLESALE_DISCOUNT);
}

/**
 * Infers the unit from a product title.
 */
function inferUnit(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("m2") || lower.includes("m²")) return "m2";
  if (lower.includes("m3") || lower.includes("m³")) return "m3";
  if (lower.includes("bolsa")) return "bolsa";
  if (lower.includes("rollo")) return "rollo";
  if (lower.includes("barra")) return "barra";
  if (lower.includes("lata") || lower.includes("litro")) return "lata";
  return "unidad";
}

export const MELI_SOURCE_INFO = {
  name: "MercadoLibre Argentina API",
  url: "https://api.mercadolibre.com",
  category: `${MELI_API_BASE}/sites/${MELI_SITE_ID}/categories/${CONSTRUCTION_CATEGORY}`,
  updateFrequency: "Real-time (on-demand)",
  reliability: "Medium (retail prices, 10-30% above wholesale)",
  note: "Public search API, no auth needed for basic queries. Apply 25% wholesale discount.",
  trackedMaterials: TRACKED_MATERIALS.length,
};
