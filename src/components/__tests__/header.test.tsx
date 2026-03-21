import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Header } from "../header";

describe("Header", () => {
  it("renders the Nelo brand name", () => {
    render(<Header />);
    expect(screen.getByText("Nelo")).toBeInTheDocument();
  });

  it("renders a new estimate button", () => {
    render(<Header />);
    expect(
      screen.getByRole("link", { name: /new estimate/i }),
    ).toBeInTheDocument();
  });

  it("shows project name when provided", () => {
    render(<Header projectName="Vivienda Unifamiliar" />);
    expect(screen.getByText("Vivienda Unifamiliar")).toBeInTheDocument();
  });
});
