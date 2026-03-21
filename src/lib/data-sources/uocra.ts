/**
 * Nelo — UOCRA Wage Scale Data
 *
 * Construction labor rates from UOCRA (Unión Obrera de la Construcción).
 * Official wage scales published after each bimonthly paritaria negotiation.
 *
 * Source: https://www.construar.com.ar/escalas-salariales-uocra
 * Update frequency: Bimonthly (every 2 months)
 *
 * NOTE: No API available. Values are manually updated from published scales.
 * The effective cost multiplier (cargas sociales) is ~2.2x the base hourly rate.
 *
 * Zone supplement (suplemento zona) added to base rate before applying
 * social charges multiplier: effectiveHourlyRate = (base + zoneSupplementHourly) * 2.2
 */

/** UOCRA worker categories for construction */
export type WorkerCategory =
  | "oficial_especializado"
  | "oficial"
  | "medio_oficial"
  | "ayudante";

export interface LaborRate {
  category: WorkerCategory;
  label: string;
  baseHourlyRate: number; // ARS/hour (basic salary)
  zoneSupplementHourly: number; // ARS/hour zone supplement (suplemento zona)
  socialChargesMultiplier: number; // typically 2.2x (120% cargas sociales)
  effectiveHourlyRate: number; // (base + zoneSupplementHourly) × multiplier = what employer actually pays
  zone: string;
  validFrom: string; // ISO date
  source: string;
}

/**
 * Current UOCRA wage scales for Zona A (Buenos Aires / AMBA).
 *
 * Data: UOCRA paritaria Feb-Mar 2026 via construar.com.ar
 * Effective rate = Math.round((baseHourlyRate + zoneSupplementHourly) * 2.2)
 */
const SOCIAL_CHARGES_MULTIPLIER = 2.2; // 120% cargas sociales ≈ 2.2x multiplier

export const UOCRA_RATES: LaborRate[] = [
  {
    category: "oficial_especializado",
    label: "Oficial Especializado",
    baseHourlyRate: 5470,
    zoneSupplementHourly: 602,
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round((5470 + 602) * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-02-01",
    source: "UOCRA paritaria Feb-Mar 2026 via construar.com.ar",
  },
  {
    category: "oficial",
    label: "Oficial",
    baseHourlyRate: 4679,
    zoneSupplementHourly: 518,
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round((4679 + 518) * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-02-01",
    source: "UOCRA paritaria Feb-Mar 2026 via construar.com.ar",
  },
  {
    category: "medio_oficial",
    label: "Medio Oficial",
    baseHourlyRate: 4324,
    zoneSupplementHourly: 469,
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round((4324 + 469) * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-02-01",
    source: "UOCRA paritaria Feb-Mar 2026 via construar.com.ar",
  },
  {
    category: "ayudante",
    label: "Ayudante",
    baseHourlyRate: 3980,
    zoneSupplementHourly: 458,
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round((3980 + 458) * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-02-01",
    source: "UOCRA paritaria Feb-Mar 2026 via construar.com.ar",
  },
];

/**
 * Gets the effective hourly rate for a worker category.
 * Includes zone supplement: (base + zone) * socialChargesMultiplier
 */
export function getEffectiveRate(category: WorkerCategory): number {
  const rate = UOCRA_RATES.find((r) => r.category === category);
  return rate?.effectiveHourlyRate ?? 0;
}

/**
 * Calculates labor cost for a task given hours and worker mix.
 *
 * @param oficialHours - hours of skilled labor (oficial)
 * @param ayudanteHours - hours of unskilled labor (ayudante)
 * @returns total labor cost in ARS
 */
export function calculateLaborCost(
  oficialHours: number,
  ayudanteHours: number,
): number {
  const oficialRate = getEffectiveRate("oficial");
  const ayudanteRate = getEffectiveRate("ayudante");
  return Math.round(oficialHours * oficialRate + ayudanteHours * ayudanteRate);
}

/**
 * Standard crew compositions for common construction tasks.
 * Hours per unit of work (e.g., per m² of wall).
 */
export const CREW_COMPOSITIONS = {
  masonry_wall_m2: { oficialHours: 1.2, ayudanteHours: 0.8 },
  concrete_m3: { oficialHours: 3.0, ayudanteHours: 4.0 },
  plaster_m2: { oficialHours: 0.8, ayudanteHours: 0.4 },
  floor_tile_m2: { oficialHours: 0.9, ayudanteHours: 0.5 },
  painting_m2: { oficialHours: 0.3, ayudanteHours: 0.2 },
  electrical_point: { oficialHours: 2.5, ayudanteHours: 1.0 },
  plumbing_point: { oficialHours: 3.0, ayudanteHours: 1.5 },
};

export const UOCRA_SOURCE_INFO = {
  name: "UOCRA - Escalas Salariales",
  url: "https://www.construar.com.ar/escalas-salariales-uocra",
  updateFrequency: "Bimonthly",
  reliability: "Very High (official union published scales)",
  note: "No API. Values manually updated from published paritaria results.",
  lastManualUpdate: UOCRA_RATES[0].validFrom,
};
