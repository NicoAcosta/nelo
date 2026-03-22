import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Sidebar } from "../sidebar";
import { LocaleProvider } from "@/lib/i18n/context";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("Sidebar", () => {
  it("renders the Nelo AI branding", () => {
    renderWithLocale(<Sidebar />);
    expect(screen.getByText("NELO")).toBeInTheDocument();
    expect(screen.getByText("Project Architect")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    renderWithLocale(<Sidebar />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Blueprints")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("highlights the active nav item", () => {
    renderWithLocale(<Sidebar activeItem="projects" />);
    const projectsLink = screen.getByText("Projects").closest("a");
    expect(projectsLink).toHaveClass("bg-primary");
  });

  it("is hidden on mobile by default", () => {
    const { container } = renderWithLocale(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("hidden");
    expect(aside).toHaveClass("md:flex");
  });
});
