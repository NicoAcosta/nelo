"use client";

import type { Estimate, ProjectInputs } from "@/lib/estimate/types";
import { useLocale } from "@/lib/i18n/use-locale";

interface AssumptionsPanelProps {
  estimate: Estimate;
  inputs: ProjectInputs;
}

export function AssumptionsPanel({ estimate, inputs }: AssumptionsPanelProps) {
  const { t } = useLocale();

  const inputRows = [
    { label: t("estimate.structure"), value: inputs.structureType ?? "—" },
    { label: t("estimate.roof"), value: inputs.roofType ?? "—" },
    { label: t("estimate.finish"), value: inputs.finishLevel ?? "—" },
    { label: t("estimate.zone"), value: estimate.locationZone ?? "—" },
    { label: t("estimate.bedrooms"), value: inputs.bedroomCount != null ? String(inputs.bedroomCount) : "—" },
    { label: t("estimate.bathrooms"), value: inputs.bathroomCount != null ? String(inputs.bathroomCount) : "—" },
  ];

  return (
    <div className="bg-[#111113] p-6">
      <h3 className="text-sm font-semibold text-[#fafafa] mb-2">{t("estimate.assumptions")}</h3>
      <p className="text-[13px] text-[#71717a] mb-3.5 leading-relaxed">
        {t("estimate.assumptionsDesc")}
      </p>

      {/* Assumption tags */}
      {estimate.assumptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {estimate.assumptions.map((a) => (
            <span
              key={a.field}
              className="px-3 py-1 rounded-full text-xs bg-[#18181b] text-[#a1a1aa] border border-white/[0.06]"
            >
              {a.label}: {a.assumedValue}
            </span>
          ))}
        </div>
      )}

      {/* Project inputs grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {inputRows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between px-3 py-1.5 rounded-md bg-[#18181b]"
          >
            <span className="text-xs text-[#71717a]">{row.label}</span>
            <span className="font-mono text-xs text-[#fafafa] font-medium">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
