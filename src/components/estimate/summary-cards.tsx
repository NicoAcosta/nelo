"use client";

import type { Estimate } from "@/lib/estimate/types";
import { AnimatedCounter } from "./animated-counter";
import { formatARS } from "./format";

interface SummaryCardsProps {
  estimate: Estimate;
}

export function SummaryCards({ estimate }: SummaryCardsProps) {
  const activeCategories = estimate.categories.filter(
    (c) => c.subtotal > 0,
  ).length;

  const confidenceLabel =
    estimate.confidence === "quick"
      ? "Quick"
      : estimate.confidence === "standard"
        ? "Standard"
        : "Detailed";

  const cards = [
    {
      label: "Price / m²",
      value: estimate.pricePerM2,
      format: (n: number) => `$${formatARS(Math.round(n))}`,
      sub: "ARS per square meter",
      accent: true,
    },
    {
      label: "Total Area",
      value: estimate.floorAreaM2,
      format: (n: number) => `${Math.round(n)} m²`,
      sub: null,
    },
    {
      label: "Categories",
      value: activeCategories,
      format: (n: number) => String(Math.round(n)),
      sub: "construction categories",
    },
    {
      label: "Line Items",
      value: estimate.activeLineItems,
      format: (n: number) => String(Math.round(n)),
      sub: "individual cost items",
    },
    {
      label: "Confidence",
      value: null,
      staticText: confidenceLabel,
      sub: `${estimate.inputsProvided} of ${estimate.inputsTotal} inputs`,
      green: true,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-px bg-white/[0.06] mx-8 rounded-xl overflow-hidden border border-white/[0.06]">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#111113] px-5 py-[18px] hover:bg-[#18181b] transition-colors"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#71717a] mb-1.5">
            {card.label}
          </div>
          <div
            className={`font-mono text-xl font-bold ${
              card.accent
                ? "text-[#ccff00]"
                : card.green
                  ? "text-[#22c55e]"
                  : "text-[#fafafa]"
            }`}
          >
            {card.staticText ?? (
              <AnimatedCounter
                value={card.value!}
                format={card.format!}
                duration={800}
              />
            )}
          </div>
          {card.sub && (
            <div className="text-[11px] text-[#3f3f46] mt-0.5">{card.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
