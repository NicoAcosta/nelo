"use client";

import { useState, useRef } from "react";
import { IconSend, IconAttach } from "./icons";
import { useLocale } from "@/lib/i18n/use-locale";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 5000;

interface ChatInputProps {
  onSend: (message: string, files?: FileList) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const { t } = useLocale();
  const [value, setValue] = useState("");
  const resolvedPlaceholder = placeholder ?? t("chatInput.placeholder");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed && !selectedFile) return;

    if (selectedFile) {
      const dt = new DataTransfer();
      dt.items.add(selectedFile);
      onSend(trimmed || t("chatInput.analyzeFloorPlan"), dt.files);
      setSelectedFile(null);
    } else {
      onSend(trimmed);
    }
    setValue("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_FILE_SIZE_MB}MB.`);
        setSelectedFile(null);
      } else {
        setFileError(null);
        setSelectedFile(file);
      }
    }
    e.target.value = "";
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass-card border-2 border-white/50 rounded-2xl flex flex-col p-3">
        {fileError && (
          <div role="alert" className="flex items-center gap-2 px-4 py-2 mb-1">
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
        {selectedFile && (
          <div className="flex items-center gap-2 px-4 py-2 mb-1">
            <span className="text-xs font-bold text-on-surface/60 bg-white/40 px-3 py-1 rounded-lg truncate max-w-[200px]">
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-on-surface/40 hover:text-on-surface text-xs font-bold"
              aria-label="Remove file"
            >
              &times;
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-label="Message input"
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-on-surface placeholder:text-on-surface/30 min-h-[60px] max-h-[200px] resize-none px-4 py-2 font-medium text-sm"
        />
        <div className="flex items-center justify-between px-2 pb-1 pt-2">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload floor plan image"
            />
            <button
              type="button"
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-on-surface/50 hover:text-on-surface hover:bg-white/40 rounded-xl transition-all"
            >
              <IconAttach />
            </button>
          </div>
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSend}
            disabled={disabled || (!value.trim() && !selectedFile)}
            className="p-3 bg-primary text-on-primary rounded-xl shadow-md hover:brightness-95 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <IconSend />
          </button>
        </div>
      </div>
      <p className="text-center text-[9px] text-on-surface/30 mt-4 tracking-widest font-bold uppercase">
        {t("chatInput.disclaimer")}
      </p>
    </div>
  );
}
