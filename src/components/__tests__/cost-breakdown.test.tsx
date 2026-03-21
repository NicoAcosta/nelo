import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CostBreakdown } from "../cost-breakdown";
import type { Estimate } from "@/lib/estimate/types";

const mockEstimate: Estimate = {
  pricePerM2: 452000,
  totalPrice: 45200000,
  directCost: 32000000,
  overheadPercent: 10,
  overheadAmount: 3200000,
  profitPercent: 12,
  profitAmount: 3840000,
  subtotalBeforeTax: 39040000,
  ivaPercent: 21,
  ivaAmount: 8198400,
  categories: [
    {
      id: "trabajos_preliminares",
      name: "Trabajos Preliminares",
      subtotal: 1356000,
      incidencePercent: 3.0,
      lineItems: [],
    },
    {
      id: "estructura_resistente",
      name: "Estructura de H.A.",
      subtotal: 10396000,
      incidencePercent: 23.0,
      lineItems: [],
    },
    {
      id: "albanileria",
      name: "Albañilería",
      subtotal: 8136000,
      incidencePercent: 18.0,
      lineItems: [],
    },
    {
      id: "instalacion_sanitaria",
      name: "Instalación Sanitaria",
      subtotal: 3164000,
      incidencePercent: 7.0,
      lineItems: [],
    },
    {
      id: "instalacion_electrica",
      name: "Instalación Eléctrica",
      subtotal: 2712000,
      incidencePercent: 6.0,
      lineItems: [],
    },
    {
      id: "carpinteria",
      name: "Carpintería de Aluminio",
      subtotal: 4520000,
      incidencePercent: 10.0,
      lineItems: [],
    },
  ],
  totalLineItems: 80,
  activeLineItems: 65,
  confidence: "standard",
  confidenceRange: { low: 20, high: 25 },
  inputsProvided: 8,
  inputsTotal: 14,
  assumptions: [
    { field: "ceilingHeightM", label: "Ceiling height", assumedValue: "2.60m", source: "default" },
    { field: "hasBasement", label: "Basement", assumedValue: "No", source: "default" },
    { field: "locationZone", label: "Location", assumedValue: "AMBA", source: "user" },
  ],
  locationZone: "caba",
  floorAreaM2: 100,
  priceBaseDate: "2026-03-21",
  iccBaseValue: 100,
  iccCurrentValue: 112,
};

describe("CostBreakdown", () => {
  it("renders the total price prominently", () => {
    render(<CostBreakdown estimate={mockEstimate} />);
    expect(screen.getByText(/45\.200\.000/)).toBeInTheDocument();
  });

  it("renders the price per m²", () => {
    render(<CostBreakdown estimate={mockEstimate} />);
    expect(screen.getByText(/452\.000\/m²/)).toBeInTheDocument();
  });

  it("renders the confidence level", () => {
    render(<CostBreakdown estimate={mockEstimate} />);
    expect(screen.getByText(/±20/)).toBeInTheDocument();
  });

  it("renders category rows", () => {
    render(<CostBreakdown estimate={mockEstimate} />);
    expect(screen.getByText("Trabajos Preliminares")).toBeInTheDocument();
    expect(screen.getByText("Estructura de H.A.")).toBeInTheDocument();
    expect(screen.getByText("Albañilería")).toBeInTheDocument();
  });

  it("renders incidence percentages", () => {
    render(<CostBreakdown estimate={mockEstimate} />);
    expect(screen.getByText("23.0%")).toBeInTheDocument();
    expect(screen.getByText("18.0%")).toBeInTheDocument();
  });

  it("renders assumption chips", () => {
    render(<CostBreakdown estimate={mockEstimate} />);
    expect(screen.getByText(/2\.60m/)).toBeInTheDocument();
    expect(screen.getByText(/AMBA/)).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<CostBreakdown estimate={mockEstimate} />);
    expect(screen.getByText(/recalculate/i)).toBeInTheDocument();
  });

  it("renders ICC disclaimer", () => {
    render(<CostBreakdown estimate={mockEstimate} />);
    expect(screen.getByText(/construction cost index/i)).toBeInTheDocument();
  });
});
