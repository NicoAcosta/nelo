"use client";

import type { Estimate, ProjectInputs, LocationZone } from "@/lib/estimate/types";
import { EstimateTopbar } from "@/components/estimate/estimate-topbar";
import { HeroSection } from "@/components/estimate/hero-section";
import { SummaryCards } from "@/components/estimate/summary-cards";
import { DonutChart } from "@/components/estimate/donut-chart";
import { CategoryBreakdown } from "@/components/estimate/category-breakdown";
import { CostBuildUp } from "@/components/estimate/cost-buildup";
import { AssumptionsPanel } from "@/components/estimate/assumptions-panel";
import { NeloFooter } from "@/components/estimate/nelo-footer";

const ZONE_LABELS: Record<LocationZone, string> = {
  caba: "CABA",
  gba_norte: "GBA Norte",
  gba_sur: "GBA Sur",
  gba_oeste: "GBA Oeste",
};

interface EstimateDashboardProps {
  estimate: Estimate;
  inputs: ProjectInputs;
  projectName: string;
  chatId: string;
}

export function EstimateDashboard({
  estimate,
  inputs,
  projectName,
  chatId,
}: EstimateDashboardProps) {
  const locationLabel = ZONE_LABELS[estimate.locationZone] ?? "";

  return (
    <div className="min-h-screen bg-[#08080a] text-[#fafafa] relative">
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px",
        }}
      />

      <EstimateTopbar
        projectName={projectName}
        chatId={chatId}
        locationLabel={locationLabel}
      />

      <HeroSection estimate={estimate} />

      <SummaryCards estimate={estimate} />

      {/* Main two-panel grid */}
      <div className="grid grid-cols-[1fr_1.3fr] gap-px bg-white/[0.06] mx-8 my-5 rounded-xl overflow-hidden border border-white/[0.06] min-h-[480px]">
        <DonutChart
          categories={estimate.categories}
          totalPrice={estimate.totalPrice}
        />
        <CategoryBreakdown categories={estimate.categories} />
      </div>

      {/* Bottom two-panel grid */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.06] mx-8 mb-5 rounded-xl overflow-hidden border border-white/[0.06]">
        <CostBuildUp estimate={estimate} />
        <AssumptionsPanel estimate={estimate} inputs={inputs} />
      </div>

      <NeloFooter chatId={chatId} />
    </div>
  );
}
