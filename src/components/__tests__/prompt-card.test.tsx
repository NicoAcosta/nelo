import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PromptCard } from "../prompt-card";

describe("PromptCard", () => {
  const defaultProps = {
    icon: "cottage",
    text: "¿Cuánto cuesta hacer una casa de 100m²?",
    onClick: vi.fn(),
  };

  it("renders the prompt text", () => {
    render(<PromptCard {...defaultProps} />);
    expect(
      screen.getByText("¿Cuánto cuesta hacer una casa de 100m²?"),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<PromptCard {...defaultProps} onClick={onClick} />);
    fireEvent.click(
      screen.getByText("¿Cuánto cuesta hacer una casa de 100m²?"),
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a button element", () => {
    render(<PromptCard {...defaultProps} />);
    const button = screen
      .getByText("¿Cuánto cuesta hacer una casa de 100m²?")
      .closest("button");
    expect(button).toBeInTheDocument();
  });
});
