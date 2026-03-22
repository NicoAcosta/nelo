"use client";

import type { Estimate } from "@/lib/estimate/types";
import { formatARS } from "./format";
import { useLocale } from "@/lib/i18n/use-locale";

interface CostBuildUpProps {
  estimate: Estimate;
}

export function CostBuildUp({ estimate }: CostBuildUpProps) {
  const { t } = useLocale();
  const maxVal = estimate.totalPrice;

  const rows = [
    { label: t("estimate.directCost"), value: estimate.directCost, color: "bg-[#222225]", textColor: "text-[#a1a1aa]" },
    { label: `${t("estimate.overhead")} ${estimate.overheadPercent}%`, value: estimate.overheadAmount, color: "bg-[rgba(59,130,246,0.15)]", textColor: "text-[#3b82f6]" },
    { label: `${t("estimate.profit")} ${estimate.profitPercent}%`, value: estimate.profitAmount, color: "bg-[rgba(245,158,11,0.15)]", textColor: "text-[#f59e0b]" },
  ];

  return (
    <div className="bg-[#111113] p-6">
      <h3 className="text-sm font-semibold text-[#fafafa] mb-4">{t("estimate.costBuildup")}</h3>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3.5">
            <span className="text-[13px] text-[#a1a1aa] w-[110px] flex-shrink-0 truncate">{row.label}</span>
            <div
              className={`h-[30px] rounded-md flex items-center px-3 font-mono text-xs font-semibold tabular-nums ${row.color} ${row.textColor}`}
              style={{ width: `${Math.max((row.value / maxVal) * 100, 8)}%` }}
            >
              ${formatARS(row.value)}
            </div>
          </div>
        ))}

        {/* Divider + subtotal */}
        <div className="h-px bg-white/[0.06] ml-[124px] my-1" />

        {/* IVA */}
        <div className="flex items-center gap-3.5">
          <span className="text-[13px] text-[#a1a1aa] w-[110px] flex-shrink-0">IVA {estimate.ivaPercent}%</span>
          <div
            className="h-[30px] rounded-md flex items-center px-3 font-mono text-xs font-semibold tabular-nums bg-[rgba(168,85,247,0.15)] text-[#a855f7]"
            style={{ width: `${Math.max((estimate.ivaAmount / maxVal) * 100, 8)}%` }}
          >
            ${formatARS(estimate.ivaAmount)}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] ml-[124px] my-1" />

        {/* Total */}
        <div className="flex items-center gap-3.5">
          <span className="text-[13px] text-[#fafafa] w-[110px] flex-shrink-0 font-semibold">{t("estimate.total")}</span>
          <div
            className="h-[30px] rounded-md flex items-center px-3 font-mono text-xs font-semibold tabular-nums border-2 border-[#ccff00] bg-[rgba(204,255,0,0.15)] text-[#ccff00]"
            style={{ width: "100%" }}
          >
            ${formatARS(estimate.totalPrice)}
          </div>
        </div>
      </div>
    </div>
  );
}
