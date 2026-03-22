import type { LocationZone } from "@/lib/estimate/types";

export const ZONE_LABELS: Record<LocationZone, string> = {
  caba: "CABA",
  gba_norte: "GBA Norte",
  gba_sur: "GBA Sur",
  gba_oeste: "GBA Oeste",
};

/** Format ARS with dots as thousands separator, no decimals */
export function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format USD with comma thousands separator, no decimals */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format percentage: "22.5%" or "10%" */
export function formatPercent(value: number): string {
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted}%`;
}

/** Format compact: $42.2M or $850K */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${value}`;
}
