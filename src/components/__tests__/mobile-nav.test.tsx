import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MobileNav } from "../mobile-nav";
import { LocaleProvider } from "@/lib/i18n/context";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("MobileNav", () => {
  it("renders bottom navigation tabs", () => {
    renderWithLocale(<MobileNav />);
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Estimates")).toBeInTheDocument();
    expect(screen.getByText("Blueprints")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("is only visible on mobile", () => {
    const { container } = renderWithLocale(<MobileNav />);
    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("md:hidden");
  });

  it("highlights the active tab", () => {
    renderWithLocale(<MobileNav activeTab="chat" />);
    const chatTab = screen.getByText("Chat").closest("a");
    expect(chatTab).toHaveClass("text-on-surface");
  });
});
