"use client";

import type { Estimate } from "@/lib/estimate/types";
import { formatARS, formatUSD } from "@/components/estimate/format";
import { useLocale } from "@/lib/i18n/use-locale";

interface EstimatePreviewProps {
  estimate: Estimate;
  chatId: string;
}

export function EstimatePreview({ estimate, chatId }: EstimatePreviewProps) {
  const { t } = useLocale();
  const confidencePercent =
    estimate.inputsTotal > 0
      ? Math.round((estimate.inputsProvided / estimate.inputsTotal) * 100)
      : 0;

  const top5 = [...estimate.categories]
    .filter((c) => c.subtotal > 0)
    .sort((a, b) => b.subtotal - a.subtotal)
    .slice(0, 5);

  const maxCost = top5[0]?.subtotal ?? 1;

  return (
    <div className="bg-[#1a1a1a] text-[#f2f2f2] rounded-lg overflow-hidden shadow-2xl max-w-lg">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z" fill="#ccff00" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">
            {t("costBreakdown.estimatedBudget")}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-3xl font-extrabold tracking-tight tabular-nums">
              ARS {formatARS(estimate.totalPrice)}
            </div>
            <div className="font-mono text-sm text-[#ccff00] mt-1 tabular-nums">
              ARS {formatARS(estimate.pricePerM2)} /m²
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#888] tabular-nums">
              {confidencePercent}% {t("estimate.confidence").toLowerCase()}
            </div>
            <div className="font-mono text-sm text-[#666] mt-0.5 tabular-nums">
              ≈ USD {formatUSD(estimate.totalPriceUsd)}
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 categories */}
      <div className="px-5 py-3 space-y-1.5">
        {top5.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3">
            <span className="text-[11px] text-[#888] w-[100px] truncate flex-shrink-0">
              {cat.name}
            </span>
            <div className="flex-1 h-[4px] bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#ccff00]/60"
                style={{ width: `${(cat.subtotal / maxCost) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-[#888] w-[50px] text-right flex-shrink-0 tabular-nums">
              {cat.incidencePercent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* View Full Estimate link */}
      <a
        href={`/estimate/${chatId}`}
        className="block text-center py-3 border-t border-white/5 text-sm font-semibold text-[#ccff00] hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-[#ccff00] focus-visible:ring-inset"
      >
        {t("estimate.viewFull")}
      </a>
    </div>
  );
}
