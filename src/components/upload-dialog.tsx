"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { IconUpload, IconAutoCAD, IconPDF, IconPhoto, IconClose } from "./icons";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  ACCEPT_STRING,
  MAX_FILES_PER_MESSAGE,
  validateFile,
  detectFileType,
} from "@/lib/documents/validation";

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (files: File[]) => void;
  /** Pre-populate with already-selected files so users can add incrementally */
  initialFiles?: File[];
}

export function getFileTypeIcon(fileName: string) {
  const type = detectFileType(fileName);
  if (type === "dwg" || type === "dxf") return IconAutoCAD;
  if (type === "pdf") return IconPDF;
  return IconPhoto;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function UploadDialog({ open, onClose, onConfirm, initialFiles = [] }: UploadDialogProps) {
  const { t } = useLocale();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const dragCounterRef = useRef(0);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      setFiles(initialFiles);
      setFileError(null);
      setIsDragOver(false);
      dragCounterRef.current = 0;
      document.body.style.overflow = "hidden";
      // Focus close button after render
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else {
      document.body.style.overflow = "";
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      setFileError(null);
      for (const file of newFiles) {
        const validation = validateFile(file.name, file.size);
        if (!validation.valid) {
          setFileError(validation.error ?? "Invalid file");
          return;
        }
      }
      setFiles((prev) => {
        const combined = [...prev, ...newFiles];
        if (combined.length > MAX_FILES_PER_MESSAGE) {
          setFileError(t("uploadDialog.maxFiles"));
          return prev;
        }
        return combined;
      });
    },
    [t],
  );

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    if (newFiles.length > 0) addFiles(newFiles);
    e.target.value = "";
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) addFiles(droppedFiles);
  }

  function handleConfirm() {
    if (files.length > 0) {
      onConfirm(files);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!open) return null;

  const fileTypeCards = [
    {
      Icon: IconAutoCAD,
      label: t("uploadDialog.cadLabel"),
      formats: t("uploadDialog.cadFormats"),
      limit: t("uploadDialog.upTo20"),
    },
    {
      Icon: IconPDF,
      label: t("uploadDialog.pdfLabel"),
      formats: t("uploadDialog.pdfFormats"),
      limit: t("uploadDialog.upTo20"),
    },
    {
      Icon: IconPhoto,
      label: t("uploadDialog.photoLabel"),
      formats: t("uploadDialog.photoFormats"),
      limit: t("uploadDialog.upTo10"),
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-50 animate-dialog-backdrop"
      data-testid="upload-dialog-backdrop"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog container */}
      <div className="relative flex items-center justify-center h-full p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-dialog-title"
          className="w-full max-w-2xl bg-surface rounded-2xl shadow-xl animate-dialog-panel overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              <h2
                id="upload-dialog-title"
                className="text-xl font-black tracking-tight font-headline text-on-surface"
              >
                {t("uploadDialog.title")}
              </h2>
              <p className="text-sm text-on-surface/50 mt-1">
                {t("uploadDialog.subtitle")}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 -m-2 text-on-surface/40 hover:text-on-surface rounded-lg transition-colors"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          {/* Drop zone */}
          <div className="p-6">
            <div
              data-testid="upload-dialog-dropzone"
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative min-h-[200px] rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-outline hover:border-on-surface/30 hover:bg-surface-container-high"
                }
                ${files.length > 0 ? "p-4" : "flex flex-col items-center justify-center gap-3"}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_STRING}
                multiple
                onChange={handleFileChange}
                className="hidden"
                data-testid="upload-dialog-file-input"
                tabIndex={-1}
              />

              {files.length === 0 ? (
                <>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isDragOver
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-container-high text-on-surface/30"
                    }`}
                  >
                    <IconUpload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-on-surface/50">
                    {t("uploadDialog.dropHere")}
                  </p>
                  <p className="text-xs text-on-surface/30">
                    {t("uploadDialog.orBrowse")}
                  </p>
                </>
              ) : (
                <ul className="space-y-2 w-full" onClick={(e) => e.stopPropagation()}>
                  {files.map((file, i) => {
                    const TypeIcon = getFileTypeIcon(file.name);
                    return (
                      <li
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-3 glass-card rounded-lg p-3 animate-message-in"
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-4 h-4 text-on-surface/60" />
                        </div>
                        <span className="text-sm font-medium text-on-surface truncate flex-1 min-w-0">
                          {file.name}
                        </span>
                        <span className="text-xs text-on-surface/40 font-mono flex-shrink-0">
                          {formatSize(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          aria-label={`Remove ${file.name}`}
                          className="p-1 text-on-surface/30 hover:text-on-surface rounded transition-colors flex-shrink-0"
                        >
                          <IconClose className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                  {files.length < MAX_FILES_PER_MESSAGE && (
                    <li className="flex items-center justify-center py-2">
                      <span className="text-xs text-on-surface/30">
                        {t("uploadDialog.orBrowse")}
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* File type cards */}
          <div className="px-6 grid grid-cols-3 gap-3">
            {fileTypeCards.map(({ Icon, label, formats, limit }) => (
              <div
                key={label}
                className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 text-center"
              >
                <Icon className="w-7 h-7 text-on-surface/50" />
                <span className="text-xs font-semibold text-on-surface/70">
                  {label}
                </span>
                <span className="text-[11px] font-mono font-bold text-on-surface/40 tracking-wide">
                  {formats}
                </span>
                <span className="text-[10px] text-on-surface/30 uppercase tracking-wider">
                  {limit}
                </span>
              </div>
            ))}
          </div>

          {/* Error */}
          {fileError && (
            <div role="alert" className="mx-6 mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-error bg-error/10 px-3 py-1 rounded-lg">
                {fileError}
              </span>
              <button
                type="button"
                onClick={() => setFileError(null)}
                className="text-error/70 hover:text-error text-xs font-bold transition-colors"
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-on-surface/60 hover:text-on-surface rounded-xl transition-colors"
            >
              {t("uploadDialog.cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={files.length === 0}
              className="px-6 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl shadow-md hover:brightness-95 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t("uploadDialog.upload")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
