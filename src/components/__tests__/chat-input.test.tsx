import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatInput } from "../chat-input";
import { LocaleProvider } from "@/lib/i18n/context";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("ChatInput", () => {
  it("renders a text input with translated placeholder", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    expect(
      screen.getByPlaceholderText(/write a message/i),
    ).toBeInTheDocument();
  });

  it("renders a send button", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("renders an attach button", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /attach/i }),
    ).toBeInTheDocument();
  });

  it("calls onSend with input value on submit", () => {
    const onSend = vi.fn();
    renderWithLocale(<ChatInput onSend={onSend} />);
    const input = screen.getByPlaceholderText(/write a message/i);
    fireEvent.change(input, { target: { value: "100m2 in Palermo" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith("100m2 in Palermo");
  });

  it("clears input after sending", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    const input = screen.getByPlaceholderText(/write a message/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(input.value).toBe("");
  });

  it("disables send button when input is empty", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    const sendBtn = screen.getByRole("button", { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });

  it("disables input when disabled prop is true", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} disabled />);
    const input = screen.getByPlaceholderText(/write a message/i);
    expect(input).toBeDisabled();
  });

  it("renders translated disclaimer text", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByText(/nelo can make mistakes/i)).toBeInTheDocument();
  });
});
