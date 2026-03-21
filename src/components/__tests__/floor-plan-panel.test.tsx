import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FloorPlanPanel } from "../floor-plan-panel";
import type { FloorPlanExtraction } from "@/lib/estimate/types";

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
    render(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByDisplayValue("120")).toBeInTheDocument();
  });

  it("renders extracted room count", () => {
    render(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("renders extracted bathroom count", () => {
    render(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
  });

  it("renders extracted window count", () => {
    render(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
  });

  it("renders confirm button", () => {
    render(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
  });

  it("calls onConfirm with updated values when confirmed", () => {
    const onConfirm = vi.fn();
    render(<FloorPlanPanel extraction={mockExtraction} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders the analysis phase badge", () => {
    render(<FloorPlanPanel extraction={mockExtraction} onConfirm={vi.fn()} />);
    expect(screen.getByText("Analysis Phase")).toBeInTheDocument();
  });
});
