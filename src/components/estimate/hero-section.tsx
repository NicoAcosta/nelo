"use client";

import type { Estimate } from "@/lib/estimate/types";
import { AnimatedCounter } from "./animated-counter";
import { formatARS, formatUSD, ZONE_LABELS } from "./format";
import { useLocale } from "@/lib/i18n/use-locale";

interface HeroSectionProps {
  estimate: Estimate;
}

export function HeroSection({ estimate }: HeroSectionProps) {
  const { t } = useLocale();
  const confidencePercent =
    estimate.inputsTotal > 0
      ? Math.round((estimate.inputsProvided / estimate.inputsTotal) * 100)
      : 0;

  const confidencePosition = confidencePercent;
  const rangeLow = estimate.confidenceRange?.low ?? 85;
  const rangeHigh = estimate.confidenceRange?.high ?? 115;
  const lowPrice = Math.round(estimate.totalPrice * (rangeLow / 100));
  const highPrice = Math.round(estimate.totalPrice * (rangeHigh / 100));

  return (
    <div className="relative px-8 pt-14 pb-10 text-center overflow-hidden">
      {/* Breathing glow */}
      <div className="absolute w-[700px] h-[350px] top-[10%] left-1/2 -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(204,255,0,0.06)_0%,transparent_70%)] blur-[80px] pointer-events-none animate-[breathe_5s_ease-in-out_infinite]" />

      {/* Blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(204,255,0,0.015) 59px, rgba(204,255,0,0.015) 60px),
            repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(204,255,0,0.015) 59px, rgba(204,255,0,0.015) 60px)
          `,
        }}
      />

      {/* N mark */}
      <div className="relative mb-5 inline-block">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="drop-shadow-[0_0_20px_rgba(204,255,0,0.3)]"
        >
          <path
            d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z"
            fill="#ccff00"
            stroke="rgba(204,255,0,0.3)"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Eyebrow */}
      <div className="relative text-[11px] font-semibold tracking-[4px] uppercase text-[#71717a] mb-4">
        {t("estimate.title")}
      </div>

      {/* Total price */}
      <div className="relative">
        <span className="font-mono text-[80px] font-extrabold leading-none tracking-[-3px] bg-gradient-to-b from-white/100 via-white/90 to-[#888] bg-clip-text text-transparent">
          <span className="text-[36px] font-medium !text-[#ccff00] tracking-normal mr-1.5 align-top leading-[80px] bg-none bg-clip-border [-webkit-text-fill-color:#ccff00]">
            ARS
          </span>
          <AnimatedCounter value={estimate.totalPrice} format={formatARS} />
        </span>
      </div>

      {/* USD */}
      <div className="relative font-mono text-[20px] font-medium text-[#3f3f46] mt-2.5 tabular-nums">
        ≈ USD <AnimatedCounter value={estimate.totalPriceUsd} format={formatUSD} />
      </div>

      {/* Metadata chips */}
      <div className="relative flex items-center justify-center gap-1.5 mt-5 flex-wrap">
        {[
          `${estimate.floorAreaM2} m²`,
          ZONE_LABELS[estimate.locationZone],
        ]
          .filter(Boolean)
          .map((label) => (
            <span
              key={label}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[#18181b] text-[#a1a1aa] border border-white/[0.06]"
            >
              {label}
            </span>
          ))}
      </div>

      {/* Confidence bar */}
      <div className="max-w-[380px] mx-auto mt-6 relative">
        <div className="h-[3px] bg-[#222225] rounded-full relative" role="meter" aria-valuenow={confidencePercent} aria-valuemin={0} aria-valuemax={100} aria-label="Estimate confidence">
          <div
            className="absolute h-full bg-gradient-to-r from-[rgba(204,255,0,0.2)] via-[#ccff00] to-[rgba(204,255,0,0.2)] rounded-full"
            style={{ left: "20%", right: "20%" }}
          />
          <div
            className="absolute w-2.5 h-2.5 bg-[#ccff00] rounded-full top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(204,255,0,0.5)]"
            style={{
              left: `${Math.min(Math.max(confidencePosition, 10), 90)}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
          <span
            className="absolute -top-5 text-[10px] font-bold text-[#ccff00] font-mono tracking-wide tabular-nums"
            style={{
              left: `${Math.min(Math.max(confidencePosition, 10), 90)}%`,
              transform: "translateX(-50%)",
            }}
          >
            {t("estimate.confidencePercent").replace("{n}", String(confidencePercent))}
          </span>
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-mono text-[#3f3f46] tabular-nums">
          <span>${formatARS(lowPrice)} {t("estimate.rangeLow")}</span>
          <span>${formatARS(highPrice)} {t("estimate.rangeHigh")}</span>
        </div>
      </div>
    </div>
  );
}
