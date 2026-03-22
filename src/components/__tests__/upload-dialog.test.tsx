import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadDialog } from "../upload-dialog";
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

function createDropEvent(files: File[]) {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      files: makeFileList(files),
      types: ["Files"],
    },
  };
}

describe("UploadDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open is true", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    renderWithLocale(<UploadDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has aria-modal and aria-labelledby", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "upload-dialog-title");
  });

  it("shows title and subtitle", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    expect(screen.getByText("Upload Documents")).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it("shows three file type cards", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    expect(screen.getByText("AutoCAD")).toBeInTheDocument();
    expect(screen.getByText("DWG, DXF")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Photos")).toBeInTheDocument();
    expect(screen.getByText("PNG, JPG, WEBP")).toBeInTheDocument();
  });

  it("shows size limits on file type cards", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const upTo20 = screen.getAllByText("Up to 20 MB");
    expect(upTo20.length).toBe(2); // CAD and PDF
    expect(screen.getByText("Up to 10 MB")).toBeInTheDocument();
  });

  it("shows drop zone prompt", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    expect(screen.getByText("Drop files here")).toBeInTheDocument();
    expect(screen.getByText("or click to browse")).toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    renderWithLocale(<UploadDialog {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on close button click", () => {
    const onClose = vi.fn();
    renderWithLocale(<UploadDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Cancel button click", () => {
    const onClose = vi.fn();
    renderWithLocale(<UploadDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on backdrop click", () => {
    const onClose = vi.fn();
    renderWithLocale(<UploadDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("upload-dialog-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking dialog panel", () => {
    const onClose = vi.fn();
    renderWithLocale(<UploadDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("selects files via click-to-browse", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("plan.dxf", 5000)]);
    expect(screen.getByText("plan.dxf")).toBeInTheDocument();
  });

  it("shows file size for selected files", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("plan.dxf", 2 * 1024 * 1024)]);
    expect(screen.getByText("2.0 MB")).toBeInTheDocument();
  });

  it("allows removing selected files", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("plan.dxf", 5000)]);
    expect(screen.getByText("plan.dxf")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Remove plan.dxf"));
    expect(screen.queryByText("plan.dxf")).not.toBeInTheDocument();
  });

  it("rejects unsupported file types", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("doc.zip", 1024)]);
    expect(screen.queryByText("doc.zip")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("rejects oversized files", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("huge.dwg", 21 * 1024 * 1024)]);
    expect(screen.queryByText("huge.dwg")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("enforces max 3 files", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("a.png", 1024)]);
    selectFiles(fileInput, [createFile("b.pdf", 1024)]);
    selectFiles(fileInput, [createFile("c.dwg", 1024)]);
    selectFiles(fileInput, [createFile("d.jpg", 1024)]);
    expect(screen.queryByText("d.jpg")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("disables upload button when no files selected", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    expect(screen.getByText("Upload Files").closest("button")).toBeDisabled();
  });

  it("enables upload button when files are selected", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("plan.dxf", 5000)]);
    expect(screen.getByText("Upload Files").closest("button")).not.toBeDisabled();
  });

  it("calls onConfirm with files and closes on upload", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderWithLocale(<UploadDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    const file = createFile("plan.dxf", 5000);
    selectFiles(fileInput, [file]);
    fireEvent.click(screen.getByText("Upload Files"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith([file]);
  });

  it("adds drag-over visual state on dragenter", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const dropZone = screen.getByTestId("upload-dialog-dropzone");
    fireEvent.dragEnter(dropZone, { dataTransfer: { types: ["Files"] } });
    expect(dropZone.className).toContain("border-primary");
  });

  it("removes drag-over visual state on dragleave", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const dropZone = screen.getByTestId("upload-dialog-dropzone");
    fireEvent.dragEnter(dropZone, { dataTransfer: { types: ["Files"] } });
    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).not.toContain("border-primary");
  });

  it("accepts files via drop", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const dropZone = screen.getByTestId("upload-dialog-dropzone");
    const file = createFile("dropped.pdf", 1024);
    fireEvent.drop(dropZone, createDropEvent([file]));
    expect(screen.getByText("dropped.pdf")).toBeInTheDocument();
  });

  it("resets files when dialog reopens without initialFiles", () => {
    const { rerender } = renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("plan.dxf", 5000)]);
    expect(screen.getByText("plan.dxf")).toBeInTheDocument();

    // Close and reopen
    rerender(<LocaleProvider><UploadDialog {...defaultProps} open={false} /></LocaleProvider>);
    rerender(<LocaleProvider><UploadDialog {...defaultProps} open={true} /></LocaleProvider>);
    expect(screen.queryByText("plan.dxf")).not.toBeInTheDocument();
  });

  it("pre-populates with initialFiles when provided", () => {
    const existingFile = createFile("existing.pdf", 2048);
    renderWithLocale(
      <UploadDialog {...defaultProps} initialFiles={[existingFile]} />,
    );
    expect(screen.getByText("existing.pdf")).toBeInTheDocument();
    // Can still add more files
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    selectFiles(fileInput, [createFile("new.dxf", 1024)]);
    expect(screen.getByText("new.dxf")).toBeInTheDocument();
    expect(screen.getByText("existing.pdf")).toBeInTheDocument();
  });

  it("deduplicates files with same name, size, and lastModified", () => {
    renderWithLocale(<UploadDialog {...defaultProps} />);
    const fileInput = screen.getByTestId("upload-dialog-file-input") as HTMLInputElement;
    const file = createFile("plan.dxf", 5000);
    selectFiles(fileInput, [file]);
    expect(screen.getByText("plan.dxf")).toBeInTheDocument();

    // Try adding the exact same file again
    selectFiles(fileInput, [file]);
    // Should still only have one instance
    const items = screen.getAllByText("plan.dxf");
    expect(items.length).toBe(1);
  });
});
