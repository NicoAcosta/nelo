import type { Estimate } from "@/lib/estimate/types";

function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

const confidenceLabels: Record<string, string> = {
  quick: "Quick",
  standard: "Professional",
  detailed: "Detailed",
};

interface CostBreakdownProps {
  estimate: Estimate;
}

export function CostBreakdown({ estimate }: CostBreakdownProps) {
  const confidencePercent = estimate.inputsTotal > 0
    ? Math.round((estimate.inputsProvided / estimate.inputsTotal) * 100)
    : 0;

  return (
    <div className="bg-[#1a1a1a] text-[#f2f2f2] rounded-lg overflow-hidden shadow-2xl">
      {/* Hero */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-[0.2em] text-[#ccff00] uppercase font-headline">
                Estimated Budget
              </span>
              <div className="h-[1px] w-8 bg-[#ccff00]/30" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black font-headline tracking-tighter">
              ${formatARS(estimate.totalPrice)}
              <span className="text-lg font-medium text-[#999] align-baseline ml-2">
                ARS
              </span>
            </h2>
            <p className="mt-2 text-[#999] font-medium">
              Price per m²:{" "}
              <span className="text-[#ccff00] font-bold">
                ${formatARS(estimate.pricePerM2)}/m²
              </span>
            </p>
          </div>

          {/* Confidence */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 min-w-[240px] backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-[#999] uppercase tracking-wider">
                Confidence Level
              </span>
              <span className="text-[10px] font-black text-[#ccff00]">
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
              Based on {estimate.activeLineItems} active data points in the selected area.
            </p>
          </div>
        </div>
      </div>

      {/* Assumptions bar */}
      <div className="bg-white/5 px-6 py-3 flex flex-wrap gap-6 border-b border-white/5">
        {estimate.assumptions.map((a) => (
          <div key={a.field} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">{a.field}:</span>
            <span className="text-xs font-bold text-white/80 uppercase tracking-tighter">
              {a.assumedValue}
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] font-black text-[#999]/60 uppercase tracking-widest">
            Updated: {new Date(estimate.priceBaseDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
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
                Category
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-[#999] uppercase tracking-[0.2em] text-right">
                Subtotal (ARS)
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-[#999] uppercase tracking-[0.2em] text-right">
                Incidence (%)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {estimate.categories.map((cat, i) => (
              <tr
                key={cat.id}
                className={`hover:bg-white/5 transition-colors ${
                  i % 2 === 1 ? "bg-white/[0.02]" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-bold">{cat.name}</span>
                </td>
                <td className="px-6 py-4 text-right font-headline text-sm font-bold">
                  ${formatARS(cat.subtotal)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs font-black">{cat.incidencePercent.toFixed(1)}%</span>
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
      <div className="p-6 bg-white/5 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" disabled className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black uppercase tracking-widest opacity-40 cursor-not-allowed" title="Coming soon">
            Download PDF
          </button>
          <button type="button" disabled className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black uppercase tracking-widest opacity-40 cursor-not-allowed" title="Coming soon">
            Export Excel
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-[#999] uppercase tracking-widest">
            Adjust materials?
          </span>
          <button type="button" disabled className="bg-[#ccff00]/40 text-black/40 px-8 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] cursor-not-allowed" title="Coming soon">
            Recalculate
          </button>
        </div>
      </div>

      {/* ICC disclaimer */}
      <div className="mx-6 mb-6 flex items-center gap-3 p-4 bg-[#ccff00]/5 rounded-lg border border-[#ccff00]/20 backdrop-blur-sm">
        <p className="text-xs text-[#999] leading-relaxed">
          This budget incorporates the{" "}
          <span className="text-[#ccff00] font-bold">
            Construction Cost Index (ICC)
          </span>{" "}
          updated to the date of issue. Values may vary based on final choice of
          mid-to-high range finishes and fixtures.
        </p>
      </div>
    </div>
  );
}
