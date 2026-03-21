/**
 * Nelo — UOCRA Wage Scale Data
 *
 * Construction labor rates from UOCRA (Unión Obrera de la Construcción).
 * Official wage scales published after each bimonthly paritaria negotiation.
 *
 * Source: https://www.uocra.org/escalas-salariales
 * Update frequency: Bimonthly (every 2 months)
 *
 * NOTE: No API available. Values are manually updated from published scales.
 * The effective cost multiplier (cargas sociales) is ~2.2x the base hourly rate.
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
  socialChargesMultiplier: number; // typically 2.2x (120% cargas sociales)
  effectiveHourlyRate: number; // base × multiplier = what employer actually pays
  zone: string;
  validFrom: string; // ISO date
  source: string;
}

/**
 * Current UOCRA wage scales for Zona A (Buenos Aires / AMBA).
 *
 * Last updated from published paritaria scales.
 * Base hourly rates + 120% cargas sociales = effective cost.
 *
 * IMPORTANT: These are PLACEHOLDER values based on research estimates.
 * Replace with actual UOCRA published values.
 */
const SOCIAL_CHARGES_MULTIPLIER = 2.2; // 120% cargas sociales ≈ 2.2x multiplier

export const UOCRA_RATES: LaborRate[] = [
  {
    category: "oficial_especializado",
    label: "Oficial Especializado",
    baseHourlyRate: 5200,
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round(5200 * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-01-01",
    source: "UOCRA escala salarial (placeholder estimate)",
  },
  {
    category: "oficial",
    label: "Oficial",
    baseHourlyRate: 4679,
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round(4679 * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-01-01",
    source: "UOCRA escala salarial (placeholder estimate)",
  },
  {
    category: "medio_oficial",
    label: "Medio Oficial",
    baseHourlyRate: 4300,
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round(4300 * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-01-01",
    source: "UOCRA escala salarial (placeholder estimate)",
  },
  {
    category: "ayudante",
    label: "Ayudante",
    baseHourlyRate: 3980,
    socialChargesMultiplier: SOCIAL_CHARGES_MULTIPLIER,
    effectiveHourlyRate: Math.round(3980 * SOCIAL_CHARGES_MULTIPLIER),
    zone: "zona_a_buenos_aires",
    validFrom: "2026-01-01",
    source: "UOCRA escala salarial (placeholder estimate)",
  },
];

/**
 * Gets the effective hourly rate for a worker category.
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
  url: "https://www.uocra.org/escalas-salariales",
  updateFrequency: "Bimonthly",
  reliability: "Very High (official union published scales)",
  note: "No API. Values manually updated from published paritaria results.",
  lastManualUpdate: UOCRA_RATES[0].validFrom,
};
