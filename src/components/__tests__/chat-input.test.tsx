import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatInput } from "../chat-input";
import { LocaleProvider } from "@/lib/i18n/context";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

function createFile(name: string, size: number = 1024): File {
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer]);
  return new File([blob], name, { type: "application/octet-stream" });
}

function makeFileList(files: File[]): FileList {
  const list = {
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () { yield* files; },
  } as unknown as FileList;
  for (let i = 0; i < files.length; i++) {
    (list as Record<number, File>)[i] = files[i];
  }
  return list;
}

function selectFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", { value: makeFileList(files), configurable: true });
  fireEvent.change(input);
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

  it("accepts DXF file", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    const fileInput = screen.getByLabelText("Upload floor plan") as HTMLInputElement;
    const file = createFile("plan.dxf", 5000);
    selectFiles(fileInput, [file]);
    expect(screen.getByText("plan.dxf")).toBeInTheDocument();
  });

  it("accepts DWG file", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    const fileInput = screen.getByLabelText("Upload floor plan") as HTMLInputElement;
    const file = createFile("blueprint.dwg", 5000);
    selectFiles(fileInput, [file]);
    expect(screen.getByText("blueprint.dwg")).toBeInTheDocument();
  });

  it("rejects oversized DWG file (>20MB)", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    const fileInput = screen.getByLabelText("Upload floor plan") as HTMLInputElement;
    const file = createFile("huge.dwg", 21 * 1024 * 1024);
    selectFiles(fileInput, [file]);
    expect(screen.queryByText("huge.dwg")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("allows up to 3 files", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    const fileInput = screen.getByLabelText("Upload floor plan") as HTMLInputElement;

    selectFiles(fileInput, [createFile("a.png", 1024)]);
    selectFiles(fileInput, [createFile("b.pdf", 1024)]);
    selectFiles(fileInput, [createFile("c.dwg", 1024)]);

    expect(screen.getByText("a.png")).toBeInTheDocument();
    expect(screen.getByText("b.pdf")).toBeInTheDocument();
    expect(screen.getByText("c.dwg")).toBeInTheDocument();
  });

  it("rejects 4th file with error message", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    const fileInput = screen.getByLabelText("Upload floor plan") as HTMLInputElement;

    selectFiles(fileInput, [createFile("a.png", 1024)]);
    selectFiles(fileInput, [createFile("b.pdf", 1024)]);
    selectFiles(fileInput, [createFile("c.dwg", 1024)]);
    selectFiles(fileInput, [createFile("d.jpg", 1024)]);

    expect(screen.queryByText("d.jpg")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/maximum 3 files/i)).toBeInTheDocument();
  });

  it("shows remove button for each file chip", () => {
    renderWithLocale(<ChatInput onSend={vi.fn()} />);
    const fileInput = screen.getByLabelText("Upload floor plan") as HTMLInputElement;

    selectFiles(fileInput, [createFile("a.png", 1024)]);
    selectFiles(fileInput, [createFile("b.pdf", 1024)]);

    expect(screen.getByLabelText("Remove a.png")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove b.pdf")).toBeInTheDocument();

    // Click remove on first file
    fireEvent.click(screen.getByLabelText("Remove a.png"));
    expect(screen.queryByText("a.png")).not.toBeInTheDocument();
    expect(screen.getByText("b.pdf")).toBeInTheDocument();
  });
});
