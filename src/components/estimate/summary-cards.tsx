"use client";

import type { Estimate } from "@/lib/estimate/types";
import { AnimatedCounter } from "./animated-counter";
import { formatARS } from "./format";
import { useLocale } from "@/lib/i18n/use-locale";

interface SummaryCardsProps {
  estimate: Estimate;
}

export function SummaryCards({ estimate }: SummaryCardsProps) {
  const { t } = useLocale();
  const activeCategories = estimate.categories.filter(
    (c) => c.subtotal > 0,
  ).length;

  const confidenceLabel =
    estimate.confidence === "quick"
      ? t("estimate.confidenceQuick")
      : estimate.confidence === "standard"
        ? t("estimate.confidenceStandard")
        : t("estimate.confidenceDetailed");

  const cards = [
    {
      label: t("estimate.pricePerM2"),
      value: estimate.pricePerM2,
      format: (n: number) => `$${formatARS(Math.round(n))}`,
      sub: t("estimate.arsPerM2"),
      accent: true,
    },
    {
      label: t("estimate.totalArea"),
      value: estimate.floorAreaM2,
      format: (n: number) => `${Math.round(n)} m²`,
      sub: null,
    },
    {
      label: t("estimate.categories"),
      value: activeCategories,
      format: (n: number) => String(Math.round(n)),
      sub: t("estimate.constructionCategories"),
    },
    {
      label: t("estimate.lineItems"),
      value: estimate.activeLineItems,
      format: (n: number) => String(Math.round(n)),
      sub: t("estimate.individualCostItems"),
    },
    {
      label: t("estimate.confidence"),
      value: null,
      staticText: confidenceLabel,
      sub: t("estimate.inputsOf")
        .replace("{provided}", String(estimate.inputsProvided))
        .replace("{total}", String(estimate.inputsTotal)),
      green: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-white/[0.06] mx-4 md:mx-8 rounded-xl overflow-hidden border border-white/[0.06]">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#111113] px-5 py-[18px] hover:bg-[#18181b] transition-colors"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#71717a] mb-1.5">
            {card.label}
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums ${
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
            <div className="text-[11px] text-[#52525b] mt-0.5">{card.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
