"use client";

import { useState } from "react";
import type { FloorPlanExtraction } from "@/lib/estimate/types";

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
  const [area, setArea] = useState(extraction.totalAreaM2 ?? 0);
  const [rooms, setRooms] = useState(extraction.rooms.length);
  const [bathrooms, setBathrooms] = useState(extraction.bathroomCount ?? 0);
  const [windows, setWindows] = useState(extraction.windowCount ?? 0);

  function handleConfirm() {
    onConfirm({
      totalAreaM2: area,
      roomCount: rooms,
      bathroomCount: bathrooms,
      windowCount: windows,
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Phase badge */}
      <div className="mb-6">
        <span className="px-3 py-1 rounded-full bg-primary text-on-primary text-[10px] font-black uppercase tracking-[0.2em]">
          Analysis Phase
        </span>
      </div>

      <h2 className="text-4xl md:text-5xl font-headline font-black text-on-surface tracking-tighter mb-4">
        Floor Plan Analysis Complete
      </h2>
      <p className="text-on-surface-variant max-w-2xl text-lg font-medium leading-relaxed mb-10">
        Nelo has processed the floor plan. Vision AI identified perimeters and
        openings based on current Argentine construction standards.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Image preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-[4/3] glass rounded-2xl overflow-hidden shadow-sm border border-outline/30">
            {imageUrl ? (
              <img
                alt="Floor plan preview"
                className="w-full h-full object-cover opacity-80"
                src={imageUrl}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-background">
                <span className="text-on-surface/20 text-sm font-bold uppercase">
                  Floor Plan Preview
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 px-5 py-4 bg-surface-container-high rounded-2xl">
            <p className="text-xs text-on-surface-variant font-medium">
              {extraction.rawNotes || "AI detected standard construction patterns."}
            </p>
          </div>
        </div>

        {/* Editable values */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="glass rounded-3xl p-8 border border-outline/30 shadow-sm">
            <h3 className="text-xl font-headline font-black text-on-surface mb-8 uppercase tracking-tight">
              Extracted Values
            </h3>

            <div className="space-y-6">
              <InputField label="Total Area" value={area} onChange={setArea} unit="m²" />
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Rooms" value={rooms} onChange={setRooms} />
                <InputField label="Bathrooms" value={bathrooms} onChange={setBathrooms} />
              </div>
              <InputField label="Windows & Doors" value={windows} onChange={setWindows} />
            </div>

            <div className="mt-10 space-y-4">
              <button
                onClick={handleConfirm}
                className="w-full bg-primary py-5 rounded-2xl text-on-primary font-headline font-black text-lg uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-95 active:scale-[0.98] transition-all"
              >
                Confirm & Calculate
              </button>
              <button disabled className="w-full py-5 rounded-2xl text-on-surface/40 font-headline font-black text-sm uppercase tracking-widest border border-outline/20 cursor-not-allowed" title="Coming soon">
                Edit Other Values
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  const inputId = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-full bg-black/5 border-none rounded-2xl px-5 py-5 text-on-surface font-headline font-black text-2xl focus:ring-2 focus:ring-primary transition-all"
        />
        {unit && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface/30 font-bold text-sm">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
