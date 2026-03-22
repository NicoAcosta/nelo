"use client";

import { useState } from "react";
import Image from "next/image";
import type { FloorPlanExtraction } from "@/lib/estimate/types";
import { useLocale } from "@/lib/i18n/use-locale";

interface FloorPlanPanelProps {
  extraction: FloorPlanExtraction;
  imageUrl?: string;
  onConfirm: (values: {
    totalAreaM2: number;
    roomCount: number;
    bathroomCount: number;
    windowCount: number;
  }) => void;
}

export function FloorPlanPanel({
  extraction,
  imageUrl,
  onConfirm,
}: FloorPlanPanelProps) {
  const { t } = useLocale();
  const [area, setArea] = useState(extraction.totalAreaM2 ?? 0);
  const [rooms, setRooms] = useState(extraction.rooms.length);
  const [bathrooms, setBathrooms] = useState(extraction.bathroomCount ?? 0);
  const [windows, setWindows] = useState(extraction.windowCount ?? 0);

  const confidenceLabel =
    extraction.confidence === "high"
      ? t("floorPlanPanel.confidenceHigh")
      : extraction.confidence === "medium"
        ? t("floorPlanPanel.confidenceMedium")
        : t("floorPlanPanel.confidenceLow");

  function handleConfirm() {
    onConfirm({
      totalAreaM2: area,
      roomCount: rooms,
      bathroomCount: bathrooms,
      windowCount: windows,
    });
  }

  return (
    <div className="bg-[#1a1a1a] text-[#f2f2f2] rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ccff00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 12h18" />
            <path d="M12 3v18" />
          </svg>
          <span className="text-[10px] font-black tracking-[0.2em] text-[#ccff00] uppercase">
            {t("floorPlanPanel.analysisComplete")}
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
          {confidenceLabel}
        </span>
      </div>

      {/* Image + Values grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Image preview */}
        <div className="relative aspect-[4/3] bg-[#111] border-b md:border-b-0 md:border-r border-white/5">
          {imageUrl ? (
            <Image
              alt="Floor plan preview"
              className="w-full h-full object-contain p-3"
              src={imageUrl}
              fill
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[#444] text-xs font-bold uppercase tracking-widest">
                {t("floorPlanPanel.preview")}
              </span>
            </div>
          )}
        </div>

        {/* Editable values */}
        <div className="p-5 space-y-4">
          <CompactField
            label={t("floorPlanPanel.totalArea")}
            value={area}
            onChange={setArea}
            unit="m²"
            max={50000}
          />
          <div className="grid grid-cols-2 gap-3">
            <CompactField
              label={t("floorPlanPanel.rooms")}
              value={rooms}
              onChange={setRooms}
              max={100}
            />
            <CompactField
              label={t("floorPlanPanel.bathrooms")}
              value={bathrooms}
              onChange={setBathrooms}
              max={50}
            />
          </div>
          <CompactField
            label={t("floorPlanPanel.windows")}
            value={windows}
            onChange={setWindows}
            max={200}
          />
        </div>
      </div>

      {/* Room pills */}
      {extraction.rooms.length > 0 && (
        <div className="px-6 py-3 border-t border-white/5 flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider mr-1 self-center">
            {t("floorPlanPanel.rooms")}:
          </span>
          {extraction.rooms.map((room, i) => (
            <span
              key={`${room.type}-${i}`}
              className="text-[11px] font-medium text-[#aaa] bg-white/5 px-2.5 py-1 rounded-full"
            >
              {room.type}
              {room.approximateAreaM2 != null && (
                <span className="text-[#666] ml-1 font-mono text-[10px]">
                  {room.approximateAreaM2}m²
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {extraction.rawNotes && (
        <div className="px-6 py-3 border-t border-white/5">
          <p className="text-[11px] text-[#666] leading-relaxed">
            {extraction.rawNotes}
          </p>
        </div>
      )}

      {/* Action */}
      <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={area <= 0}
          className="w-full bg-[#ccff00] text-black py-2.5 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-95 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#ccff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
        >
          {area <= 0
            ? t("floorPlanPanel.enterArea")
            : t("floorPlanPanel.confirm")}
        </button>
      </div>
    </div>
  );
}

function CompactField({
  label,
  value,
  onChange,
  unit,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  max?: number;
}) {
  const inputId = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const clamp = (v: number) => {
    const clamped = Math.max(0, v);
    return max !== undefined ? Math.min(clamped, max) : clamped;
  };
  return (
    <div>
      <label
        htmlFor={inputId}
        className="text-[10px] font-bold text-[#666] uppercase tracking-wider block mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[#f2f2f2] font-mono text-sm font-bold tabular-nums focus:ring-2 focus:ring-[#ccff00] focus:border-transparent transition"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] font-mono text-xs">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
