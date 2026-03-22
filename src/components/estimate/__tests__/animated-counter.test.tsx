import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedCounter } from "../animated-counter";

describe("AnimatedCounter", () => {
  it("renders the final value when reduced motion is preferred", () => {
    render(<AnimatedCounter value={187450000} duration={0} />);
    expect(screen.getByText(/187/)).toBeTruthy();
  });

  it("accepts a custom formatter", () => {
    render(
      <AnimatedCounter
        value={1000}
        duration={0}
        format={(n) => `$${n}`}
      />,
    );
    expect(screen.getByText("$1000")).toBeTruthy();
  });
});
