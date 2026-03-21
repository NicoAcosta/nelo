import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MobileNav } from "../mobile-nav";

describe("MobileNav", () => {
  it("renders bottom navigation tabs", () => {
    render(<MobileNav />);
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Estimates")).toBeInTheDocument();
    expect(screen.getByText("Blueprints")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("is only visible on mobile", () => {
    const { container } = render(<MobileNav />);
    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("md:hidden");
  });

  it("highlights the active tab", () => {
    render(<MobileNav activeTab="chat" />);
    const chatTab = screen.getByText("Chat").closest("a");
    expect(chatTab).toHaveClass("text-on-surface");
  });
});
