"use client";

import { useState } from "react";
import type { CategoryTotal } from "@/lib/estimate/types";
import { CATEGORIES } from "@/lib/pricing/categories-config";
import { assignCategoryColors } from "./category-colors";
import { formatARS, formatPercent } from "./format";
import { useLocale } from "@/lib/i18n/use-locale";

// Module-level constant — CATEGORIES never changes at runtime
const ENGLISH_NAMES = new Map<string, string>(
  CATEGORIES.map((cat) => [cat.id, cat.nameEn]),
);

interface CategoryBreakdownProps {
  categories: CategoryTotal[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<"cost" | "percent" | "grouped">("cost");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const active = categories
    .filter((c) => c.subtotal > 0)
    .sort((a, b) => b.subtotal - a.subtotal);

  const colorMap = assignCategoryColors(active.map((c) => c.id));
  const maxCost = active[0]?.subtotal ?? 1;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs = [
    { key: "cost" as const, label: t("estimate.byCost") },
    { key: "percent" as const, label: t("estimate.byPercent") },
    { key: "grouped" as const, label: t("estimate.grouped") },
  ];

  return (
    <div className="bg-[#111113] p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#fafafa]">{t("estimate.categoryBreakdown")}</h3>
        <div className="flex gap-0.5 bg-[#18181b] p-0.5 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#222225] text-[#fafafa]"
                  : "text-[#71717a] hover:text-[#a1a1aa]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-px">
        {active.map((cat, i) => {
          const isExpanded = expanded.has(cat.id);
          const barWidth =
            activeTab === "percent"
              ? cat.incidencePercent
              : (cat.subtotal / maxCost) * 95;
          const displayValue =
            activeTab === "percent"
              ? formatPercent(cat.incidencePercent)
              : `$${formatARS(cat.subtotal)}`;

          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => toggleExpand(cat.id)}
                className="w-full grid grid-cols-[24px_1fr_2.2fr_72px] items-center gap-2.5 px-1.5 py-2 rounded-md hover:bg-white/[0.025] transition-colors text-left"
                title={ENGLISH_NAMES.get(cat.id) ?? cat.name}
                aria-expanded={isExpanded}
              >
                <span className="font-mono text-[10px] text-[#3f3f46] text-center tabular-nums">
                  {i + 1}
                </span>
                <span className="text-[13px] text-[#a1a1aa] truncate">
                  {cat.name}
                </span>
                <div className="h-[5px] bg-[#18181b] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: colorMap.get(cat.id) ?? "#52525b",
                    }}
                  />
                </div>
                <span className="font-mono text-xs text-[#a1a1aa] text-right font-medium tabular-nums">
                  {displayValue}
                </span>
              </button>

              {/* Expanded line items */}
              {isExpanded && cat.lineItems.filter((li) => li.isActive).length > 0 && (
                <div className="ml-8 mb-2 border-l border-white/[0.06] pl-3">
                  {cat.lineItems
                    .filter((li) => li.isActive)
                    .map((li) => (
                      <div
                        key={li.code}
                        className="flex items-center justify-between py-1 text-[11px]"
                      >
                        <span className="text-[#71717a] truncate mr-4">
                          {li.code} — {li.description}
                        </span>
                        <span className="font-mono text-[#3f3f46] flex-shrink-0 tabular-nums">
                          ${formatARS(li.subtotal)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
