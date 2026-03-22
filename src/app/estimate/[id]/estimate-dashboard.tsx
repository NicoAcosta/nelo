"use client";

import type { Estimate, ProjectInputs } from "@/lib/estimate/types";

interface EstimateDashboardProps {
  estimate: Estimate;
  inputs: ProjectInputs;
  projectName: string;
  chatId: string;
}

export function EstimateDashboard({
  estimate,
  projectName,
  chatId,
}: EstimateDashboardProps) {
  return (
    <div className="min-h-screen bg-[#08080a] text-[#fafafa] flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold">{projectName}</p>
        <p className="text-[#ccff00] font-mono text-4xl mt-4">
          ${estimate.totalPrice.toLocaleString("es-AR")}
        </p>
        <a
          href={`/chat/${chatId}`}
          className="mt-6 inline-block text-sm text-[#71717a] hover:text-white"
        >
          ← Back to Chat
        </a>
      </div>
    </div>
  );
}
