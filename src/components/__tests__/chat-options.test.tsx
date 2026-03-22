import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatOptions } from "../chat-options";
import type { UIMessage } from "ai";
import { getSelectedValue } from "@/app/chat/get-selected-value";

const shortOptions = [
  { value: "economico", label: "Económico" },
  { value: "medio", label: "Medio" },
  { value: "premium", label: "Premium" },
];

const longOptions = [
  { value: "azotea_inaccesible", label: "Azotea inaccesible" },
  { value: "azotea_transitable", label: "Azotea transitable" },
  { value: "chapa_trapezoidal", label: "Chapa trapezoidal" },
  { value: "chapa_prepintada", label: "Chapa prepintada" },
  { value: "tejas_ceramicas", label: "Tejas cerámicas" },
  { value: "panel_sandwich", label: "Panel sándwich" },
];

const defaultProps = {
  questionId: "finishLevel",
  options: shortOptions,
  onSelect: vi.fn(),
  disabled: false,
  selectedValue: null,
  isLatest: true,
};

describe("ChatOptions", () => {
  describe("adaptive layout", () => {
    it("renders pills layout for ≤4 short options", () => {
      render(<ChatOptions {...defaultProps} />);
      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("data-layout", "pills");
    });

    it("renders vertical layout for 5+ options", () => {
      render(<ChatOptions {...defaultProps} options={longOptions} />);
      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("data-layout", "vertical");
    });

    it("renders vertical layout for long labels even with few options", () => {
      const longLabelOptions = [
        { value: "a", label: "This is a very long option label text" },
        { value: "b", label: "Another extremely long label" },
      ];
      render(<ChatOptions {...defaultProps} options={longLabelOptions} />);
      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("data-layout", "vertical");
    });
  });

  describe("rendering", () => {
    it("renders all option labels as buttons", () => {
      render(<ChatOptions {...defaultProps} />);
      for (const opt of shortOptions) {
        expect(screen.getByRole("button", { name: new RegExp(opt.label) })).toBeInTheDocument();
      }
    });

    it("renders number badges", () => {
      render(<ChatOptions {...defaultProps} />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("renders questionId as data attribute", () => {
      render(<ChatOptions {...defaultProps} />);
      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("data-question-id", "finishLevel");
    });
  });

  describe("click behavior", () => {
    it("calls onSelect with the label when an option is clicked", () => {
      const onSelect = vi.fn();
      render(<ChatOptions {...defaultProps} onSelect={onSelect} />);
      fireEvent.click(screen.getByRole("button", { name: /Medio/ }));
      expect(onSelect).toHaveBeenCalledWith("Medio");
    });

    it("does not call onSelect when disabled", () => {
      const onSelect = vi.fn();
      render(<ChatOptions {...defaultProps} onSelect={onSelect} disabled />);
      fireEvent.click(screen.getByRole("button", { name: /Medio/ }));
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("selected state", () => {
    it("highlights the selected option with aria-pressed", () => {
      render(<ChatOptions {...defaultProps} selectedValue="Medio" disabled />);
      const selectedBtn = screen.getByRole("button", { name: /Medio/ });
      expect(selectedBtn).toHaveAttribute("data-selected", "true");
      expect(selectedBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("dims non-selected options when one is selected", () => {
      render(<ChatOptions {...defaultProps} selectedValue="Medio" disabled />);
      const otherBtn = screen.getByRole("button", { name: /Económico/ });
      expect(otherBtn).toHaveAttribute("data-selected", "false");
      expect(otherBtn).toHaveAttribute("aria-pressed", "false");
    });

    it("disables all buttons when disabled prop is true", () => {
      render(<ChatOptions {...defaultProps} disabled />);
      const buttons = screen.getAllByRole("button");
      for (const btn of buttons) {
        expect(btn).toBeDisabled();
      }
    });
  });

  describe("keyboard navigation", () => {
    it("selects option when number key is pressed", () => {
      const onSelect = vi.fn();
      render(<ChatOptions {...defaultProps} onSelect={onSelect} />);
      fireEvent.keyDown(document, { key: "2" });
      expect(onSelect).toHaveBeenCalledWith("Medio");
    });

    it("does not handle number keys when disabled", () => {
      const onSelect = vi.fn();
      render(<ChatOptions {...defaultProps} onSelect={onSelect} disabled />);
      fireEvent.keyDown(document, { key: "1" });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("ignores number keys beyond option count", () => {
      const onSelect = vi.fn();
      render(<ChatOptions {...defaultProps} onSelect={onSelect} />);
      fireEvent.keyDown(document, { key: "9" });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("does not handle keyboard when isLatest is false", () => {
      const onSelect = vi.fn();
      render(<ChatOptions {...defaultProps} onSelect={onSelect} isLatest={false} />);
      fireEvent.keyDown(document, { key: "1" });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("moves focus with ArrowDown", () => {
      render(<ChatOptions {...defaultProps} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.keyDown(document, { key: "ArrowDown" });
      expect(document.activeElement).toBe(buttons[0]);
      fireEvent.keyDown(document, { key: "ArrowDown" });
      expect(document.activeElement).toBe(buttons[1]);
    });

    it("moves focus with ArrowUp", () => {
      render(<ChatOptions {...defaultProps} />);
      const buttons = screen.getAllByRole("button");
      // Move down twice first
      fireEvent.keyDown(document, { key: "ArrowDown" });
      fireEvent.keyDown(document, { key: "ArrowDown" });
      expect(document.activeElement).toBe(buttons[1]);
      // Move back up
      fireEvent.keyDown(document, { key: "ArrowUp" });
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("clamps focus at boundaries", () => {
      render(<ChatOptions {...defaultProps} />);
      const buttons = screen.getAllByRole("button");
      // ArrowUp at start stays at 0
      fireEvent.keyDown(document, { key: "ArrowUp" });
      expect(document.activeElement).toBe(buttons[0]);
      // Move to end and try past it
      fireEvent.keyDown(document, { key: "ArrowDown" });
      fireEvent.keyDown(document, { key: "ArrowDown" });
      fireEvent.keyDown(document, { key: "ArrowDown" });
      fireEvent.keyDown(document, { key: "ArrowDown" });
      expect(document.activeElement).toBe(buttons[2]); // last button
    });
  });
});

describe("getSelectedValue", () => {
  function makeMessage(role: "user" | "assistant", text: string): UIMessage {
    return {
      id: `msg-${Math.random()}`,
      role,
      parts: [{ type: "text" as const, text }],
    };
  }

  it("returns null when no next message exists", () => {
    const msg = makeMessage("assistant", "What roof type?");
    expect(getSelectedValue(msg, [msg])).toBeNull();
  });

  it("returns null when next message is from assistant", () => {
    const msg1 = makeMessage("assistant", "What roof type?");
    const msg2 = makeMessage("assistant", "Let me clarify...");
    expect(getSelectedValue(msg1, [msg1, msg2])).toBeNull();
  });

  it("returns the user text when next message is from user", () => {
    const msg1 = makeMessage("assistant", "What roof type?");
    const msg2 = makeMessage("user", "Tejas cerámicas");
    expect(getSelectedValue(msg1, [msg1, msg2])).toBe("Tejas cerámicas");
  });

  it("trims whitespace from user response", () => {
    const msg1 = makeMessage("assistant", "Finish level?");
    const msg2 = makeMessage("user", "  Premium  ");
    expect(getSelectedValue(msg1, [msg1, msg2])).toBe("Premium");
  });

  it("returns null for empty user text", () => {
    const msg1 = makeMessage("assistant", "Question?");
    const msg2: UIMessage = {
      id: "empty",
      role: "user",
      parts: [{ type: "text" as const, text: "  " }],
    };
    expect(getSelectedValue(msg1, [msg1, msg2])).toBeNull();
  });
});
