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

  it("opens upload dialog when attach button is clicked", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /attach/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Upload Documents")).toBeInTheDocument();
  });

  it("shows file chips after confirming files in dialog", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /attach/i }));

    // Add a file via the dialog's file input
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    const file = new File([new ArrayBuffer(5000)], "plan.dxf", { type: "application/octet-stream" });
    Object.defineProperty(fileInput, "files", {
      value: { length: 1, item: () => file, 0: file, [Symbol.iterator]: function* () { yield file; } } as unknown as FileList,
      configurable: true,
    });
    fireEvent.change(fileInput);

    // Confirm upload
    fireEvent.click(screen.getByText("Upload Files"));

    // Dialog closes and file chip appears in chat input
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("plan.dxf")).toBeInTheDocument();
  });

  it("shows remove button for file chips", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    // Open dialog and add file
    fireEvent.click(screen.getByRole("button", { name: /attach/i }));
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    const file = new File([new ArrayBuffer(1024)], "a.png", { type: "application/octet-stream" });
    Object.defineProperty(fileInput, "files", {
      value: { length: 1, item: () => file, 0: file, [Symbol.iterator]: function* () { yield file; } } as unknown as FileList,
      configurable: true,
    });
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText("Upload Files"));

    // Remove file chip
    expect(screen.getByLabelText("Remove a.png")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Remove a.png"));
    expect(screen.queryByText("a.png")).not.toBeInTheDocument();
  });
});
