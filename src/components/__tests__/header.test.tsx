import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Header } from "../header";
import { LocaleProvider } from "@/lib/i18n/context";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("Header", () => {
  it("renders the Nelo brand name", () => {
    renderWithLocale(<Header />);
    expect(screen.getByText("Nelo")).toBeInTheDocument();
  });

  it("renders a new estimate button with translated text", () => {
    renderWithLocale(<Header />);
    expect(
      screen.getByRole("link", { name: /new estimate/i }),
    ).toBeInTheDocument();
  });

  it("shows project name when provided", () => {
    renderWithLocale(<Header projectName="Vivienda Unifamiliar" />);
    expect(screen.getByText("Vivienda Unifamiliar")).toBeInTheDocument();
  });

  it("renders base prices text using translations", () => {
    renderWithLocale(<Header />);
    expect(screen.getByText("Base prices: Jul 2024")).toBeInTheDocument();
  });

  it("renders EN/ES language toggle button", () => {
    renderWithLocale(<Header />);
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("ES")).toBeInTheDocument();
  });

  it("toggles language when toggle button is clicked", () => {
    renderWithLocale(<Header />);
    const toggleBtn = screen.getByRole("button", { name: /switch to spanish/i });
    fireEvent.click(toggleBtn);
    // After switching to ES, the label should change
    expect(screen.getByRole("button", { name: /cambiar a ingles/i })).toBeInTheDocument();
    // Translated text should appear
    expect(screen.getByText("Nueva Estimacion")).toBeInTheDocument();
  });
});
