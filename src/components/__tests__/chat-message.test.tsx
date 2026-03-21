import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChatMessage } from "../chat-message";

describe("ChatMessage", () => {
  it("renders an assistant message with glass card styling", () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Hola, soy Nelo." />,
    );
    const messageCard = container.querySelector(".glass-card");
    expect(messageCard).toBeInTheDocument();
    expect(screen.getByText("Hola, soy Nelo.")).toBeInTheDocument();
  });

  it("renders a user message with primary styling", () => {
    const { container } = render(
      <ChatMessage role="user" content="Quiero construir una casa." />,
    );
    expect(
      screen.getByText("Quiero construir una casa."),
    ).toBeInTheDocument();
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("ml-auto");
  });

  it("renders an assistant avatar icon", () => {
    render(<ChatMessage role="assistant" content="Test" />);
    const avatar = screen.getByTestId("assistant-avatar");
    expect(avatar).toBeInTheDocument();
  });

  it("renders a user avatar icon", () => {
    render(<ChatMessage role="user" content="Test" />);
    const avatar = screen.getByTestId("user-avatar");
    expect(avatar).toBeInTheDocument();
  });
});
