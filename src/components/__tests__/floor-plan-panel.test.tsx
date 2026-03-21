import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FloorPlanPanel } from "../floor-plan-panel";
import { LocaleProvider } from "@/lib/i18n/context";
import type { FloorPlanExtraction } from "@/lib/estimate/types";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

const mockExtraction: FloorPlanExtraction = {
  rooms: [
    { type: "living", approximateAreaM2: 30 },
    { type: "dormitorio", approximateAreaM2: 15 },
    { type: "cocina", approximateAreaM2: 12 },
  ],
  totalAreaM2: 120,
  doorCount: 6,
  windowCount: 8,
  bathroomCount: 2,
  kitchenCount: 1,
  perimeterMl: 44,
  layoutDescription: "Single-story house with L-shaped layout",
  confidence: "high",
  rawNotes: "Load-bearing walls detected at 30cm",
};

describe("FloorPlanPanel", () => {
  it("renders extracted area", () => {
    renderWithLocale(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByDisplayValue("120")).toBeInTheDocument();
  });

  it("renders extracted room count", () => {
    renderWithLocale(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("renders extracted bathroom count", () => {
    renderWithLocale(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
  });

  it("renders extracted window count", () => {
    renderWithLocale(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
  });

  it("renders confirm button", () => {
    renderWithLocale(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
  });

  it("calls onConfirm with updated values when confirmed", () => {
    const onConfirm = vi.fn();
    renderWithLocale(<FloorPlanPanel extraction={mockExtraction} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith({
      totalAreaM2: 120,
      roomCount: 3,
      bathroomCount: 2,
      windowCount: 8,
    });
  });

  it("renders translated analysis complete heading", () => {
    renderWithLocale(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByText("Floor Plan Analysis Complete")).toBeInTheDocument();
  });
});
