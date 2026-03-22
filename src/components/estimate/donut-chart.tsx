"use client";

import { useState } from "react";
import type { CategoryTotal } from "@/lib/estimate/types";
import { assignCategoryColors } from "./category-colors";
import { formatCompact, formatPercent } from "./format";
import { useLocale } from "@/lib/i18n/use-locale";

interface DonutChartProps {
  categories: CategoryTotal[];
}

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 26;
const HOVER_STROKE = 32;

type Segment = {
  id: string;
  name: string;
  value: number;
  percent: number;
  color: string;
};

export function DonutChart({ categories }: DonutChartProps) {
  const { t } = useLocale();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const active = categories
    .filter((c) => c.subtotal > 0)
    .sort((a, b) => b.subtotal - a.subtotal);

  const colorMap = assignCategoryColors(active.map((c) => c.id));

  const top9 = active.slice(0, 9);
  const rest = active.slice(9);
  const restTotal = rest.reduce((sum, c) => sum + c.subtotal, 0);
  const directCost = active.reduce((sum, c) => sum + c.subtotal, 0);

  const segments: Segment[] = top9.map((c) => ({
    id: c.id,
    name: c.name,
    value: c.subtotal,
    percent: directCost > 0 ? (c.subtotal / directCost) * 100 : 0,
    color: colorMap.get(c.id) ?? "#52525b",
  }));

  if (restTotal > 0) {
    segments.push({
      id: "__rest__",
      name: t("estimate.nMoreCategories").replace("{n}", String(rest.length)),
      value: restTotal,
      percent: directCost > 0 ? (restTotal / directCost) * 100 : 0,
      color: "#52525b",
    });
  }

  let offset = 0;
  const segmentData = segments.map((seg) => {
    const dashLen = (seg.percent / 100) * CIRCUMFERENCE;
    const gapLen = CIRCUMFERENCE - dashLen;
    const currentOffset = -offset;
    offset += dashLen;
    return { ...seg, dashLen, gapLen, offset: currentOffset };
  });

  return (
    <div className="bg-[#111113] p-8 flex flex-col items-center justify-center gap-6">
      <div className="w-[260px] h-[260px] relative">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90" role="list" aria-label={t("estimate.donutAriaLabel")}>
          {segmentData.map((seg) => (
            <circle
              key={seg.id}
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredId === seg.id ? HOVER_STROKE : STROKE_WIDTH}
              strokeDasharray={`${seg.dashLen} ${seg.gapLen}`}
              strokeDashoffset={seg.offset}
              className="transition-[stroke-dasharray,stroke-dashoffset,filter] duration-200 cursor-pointer outline-none"
              style={{
                filter:
                  hoveredId === seg.id
                    ? `brightness(1.3) drop-shadow(0 0 6px ${seg.color})`
                    : "none",
              }}
              tabIndex={0}
              role="listitem"
              aria-label={`${seg.name}: ${formatPercent(seg.percent)}`}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(seg.id)}
              onBlur={() => setHoveredId(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[22px] font-bold text-[#fafafa] tabular-nums">
            {formatCompact(directCost)}
          </span>
          <span className="text-[11px] text-[#71717a] mt-0.5">
            {t("estimate.nCategories").replace("{n}", String(active.length))}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full">
        {segments.map((seg) => (
          <div
            key={seg.id}
            tabIndex={0}
            role="button"
            aria-label={`${seg.name}: ${formatPercent(seg.percent)}`}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#ccff00] ${
              hoveredId === seg.id ? "bg-white/[0.03]" : ""
            }`}
            onMouseEnter={() => setHoveredId(seg.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(seg.id)}
            onBlur={() => setHoveredId(null)}
          >
            <span
              className="w-2 h-2 rounded-[3px] flex-shrink-0"
              style={{ background: seg.color }}
            />
            <span className="text-xs text-[#a1a1aa] flex-1 truncate">
              {seg.name}
            </span>
            <span className="font-mono text-[11px] text-[#71717a] flex-shrink-0 tabular-nums">
              {formatPercent(seg.percent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
