"use client";

import { useEffect, useState } from "react";
import type { Estimate } from "@/lib/estimate/types";
import { useLocale } from "@/lib/i18n/use-locale";
import { VersionHistorySheet } from "@/components/version-history-sheet";

import { formatARS } from "@/components/estimate/format";

interface CostBreakdownProps {
  estimate: Estimate;
  persistedId?: string;
  version?: number;
  totalVersions?: number;
  projectId?: string;
}

export function CostBreakdown({
  estimate,
  persistedId,
  version,
  totalVersions,
  projectId,
}: CostBreakdownProps) {
  const { locale, t } = useLocale();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(!!persistedId);

  // Auto-dismiss saved banner after 8 seconds
  useEffect(() => {
    if (!showSavedBanner) return;
    const timer = setTimeout(() => setShowSavedBanner(false), 8000);
    return () => clearTimeout(timer);
  }, [showSavedBanner]);

  const confidenceLabels: Record<string, string> = {
    quick: t("costBreakdown.confidenceQuick"),
    standard: t("costBreakdown.confidenceProfessional"),
    detailed: t("costBreakdown.confidenceDetailed"),
  };

  const confidencePercent = estimate.inputsTotal > 0
    ? Math.round((estimate.inputsProvided / estimate.inputsTotal) * 100)
    : 0;

  return (
    <div className="bg-[#1a1a1a] text-[#f2f2f2] rounded-lg overflow-hidden shadow-2xl">
      {/* Version badge + "View history" trigger */}
      {persistedId && version != null && (
        <div className="px-6 pt-4 flex items-center gap-3">
          <span className="bg-[#ccff00] text-black py-1 px-2 text-[10px] font-bold uppercase tracking-widest rounded">
            {t("versionHistory.versionBadge")
              .replace("{n}", String(version))
              .replace("{total}", String(totalVersions ?? version))}
          </span>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="text-[10px] font-bold text-[#ccff00] uppercase tracking-wider hover:underline cursor-pointer"
          >
            {t("versionHistory.viewHistory")}
          </button>
        </div>
      )}

      {/* Saved banner — auto-dismisses after 8s */}
      {showSavedBanner && persistedId && version != null && (
        <div className="mx-6 mt-2 flex items-center gap-3 p-3 bg-[#ccff00]/5 rounded-lg border border-[#ccff00]/20">
          <p className="text-[11px] font-bold text-[#999] uppercase tracking-widest">
            {t("versionHistory.savedBanner")
              .split("--")[0]
              .replace("{n}", String(version))}
            <button
              type="button"
              onClick={() => {
                setShowSavedBanner(false);
                setSheetOpen(true);
              }}
              className="text-[#ccff00] hover:underline ml-1 normal-case tracking-normal"
            >
              {t("versionHistory.viewHistory")}
            </button>
          </p>
        </div>
      )}

      {/* Hero */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-[0.2em] text-[#ccff00] uppercase font-headline">
                {t("costBreakdown.estimatedBudget")}
              </span>
              <div className="h-[1px] w-8 bg-[#ccff00]/30" />
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-headline tracking-tighter font-mono tabular-nums">
              ${formatARS(estimate.totalPrice)}
              <span className="text-lg font-medium text-[#999] align-baseline ml-2">
                ARS
              </span>
            </h2>
            <p className="mt-2 text-[#999] font-medium">
              {t("costBreakdown.pricePerM2")}:{" "}
              <span className="text-[#ccff00] font-bold font-mono tabular-nums">
                ${formatARS(estimate.pricePerM2)}/m²
              </span>
            </p>
          </div>

          {/* Confidence */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 min-w-[240px] backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-[#999] uppercase tracking-wider">
                {t("costBreakdown.confidenceLevel")}
              </span>
              <span className="text-[10px] font-black text-[#ccff00] font-mono tabular-nums">
                {confidenceLabels[estimate.confidence]} (±{estimate.confidenceRange.low}%)
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={confidencePercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Confidence level"
              className="h-1.5 w-full bg-[#0d0d0d] rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.5)]"
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <p className="text-[10px] mt-2 text-[#999] opacity-60 leading-tight">
              {t("costBreakdown.basedOn").replace("{n}", String(estimate.activeLineItems))}
            </p>
          </div>
        </div>
      </div>

      {/* Assumptions bar */}
      <div className="bg-white/5 px-4 sm:px-6 py-3 flex flex-wrap gap-3 sm:gap-6 border-b border-white/5">
        {estimate.assumptions.map((a) => (
          <div key={a.field} className="flex items-center gap-2 max-w-[280px] min-w-0">
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider shrink-0">{a.label}:</span>
            <span className="text-xs font-bold text-white/80 uppercase tracking-tighter truncate" title={a.assumedValue}>
              {a.assumedValue}
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] font-black text-[#999]/60 uppercase tracking-widest">
            {t("costBreakdown.pricesAsOf")} {new Date(estimate.priceBaseDate).toLocaleDateString(locale === "es" ? "es-AR" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Category table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">Construction cost breakdown by category</caption>
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black text-[#999] uppercase tracking-[0.2em]">
                {t("costBreakdown.category")}
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-[#999] uppercase tracking-[0.2em] text-right">
                {t("costBreakdown.subtotal")}
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-[#999] uppercase tracking-[0.2em] text-right">
                {t("costBreakdown.incidence")} (%)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {estimate.categories.map((cat, i) => (
              <tr
                key={cat.id}
                className={`hover:bg-white/5 transition-colors focus-within:bg-white/5 ${
                  i % 2 === 1 ? "bg-white/[0.02]" : ""
                }`}
              >
                <td className="px-6 py-4 max-w-[240px]">
                  <span className="text-sm font-bold block truncate" title={cat.name}>{cat.name}</span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm font-bold tabular-nums">
                  ${formatARS(cat.subtotal)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs font-black font-mono tabular-nums">{cat.incidencePercent.toFixed(1)}%</span>
                    <div aria-hidden="true" className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ccff00]"
                        style={{
                          width: `${Math.min(cat.incidencePercent * 3.5, 100)}%`,
                          opacity: 0.4 + cat.incidencePercent * 0.025,
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="p-4 sm:p-6 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" disabled aria-label={t("costBreakdown.downloadPdf")} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black uppercase tracking-widest opacity-40 cursor-not-allowed" title={t("costBreakdown.availableSoon")}>
            {t("costBreakdown.downloadPdf")}
          </button>
          <button type="button" disabled aria-label={t("costBreakdown.exportExcel")} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black uppercase tracking-widest opacity-40 cursor-not-allowed" title={t("costBreakdown.availableSoon")}>
            {t("costBreakdown.exportExcel")}
          </button>
        </div>
        <button type="button" disabled aria-label={t("costBreakdown.recalculate")} className="bg-[#ccff00]/40 text-black/40 px-8 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] cursor-not-allowed" title={t("costBreakdown.availableSoon")}>
          {t("costBreakdown.recalculate")}
        </button>
      </div>

      {/* ICC disclaimer */}
      <div className="mx-6 mb-6 flex items-center gap-3 p-4 bg-[#ccff00]/5 rounded-lg border border-[#ccff00]/20 backdrop-blur-sm">
        <p className="text-xs text-[#999] leading-relaxed">
          {t("costBreakdown.iccDisclaimer")}
        </p>
      </div>

      {/* Version history sheet — only rendered when estimate is persisted */}
      {projectId && persistedId && (
        <VersionHistorySheet
          projectId={projectId}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </div>
  );
}
