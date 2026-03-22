"use client";

import { useState, useRef } from "react";
import { IconSend, IconAttach } from "./icons";
import { UploadDialog, getFileTypeIcon } from "./upload-dialog";
import { useLocale } from "@/lib/i18n/use-locale";

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed && selectedFiles.length === 0) return;

    if (selectedFiles.length > 0) {
      const dt = new DataTransfer();
      for (const f of selectedFiles) dt.items.add(f);
      onSend(trimmed || t("chatInput.analyzeFloorPlan"), dt.files);
      setSelectedFiles([]);
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

  function handleDialogConfirm(files: File[]) {
    setSelectedFiles(files);
    setDialogOpen(false);
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass-card border-2 border-white/50 rounded-2xl flex flex-col p-3">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2 mb-1">
            {selectedFiles.map((file, i) => (
              <span key={`${file.name}-${i}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface/60 bg-white/40 px-3 py-1 rounded-lg">
                {(() => { const Icon = getFileTypeIcon(file.name); return <Icon className="w-3.5 h-3.5" />; })()}
                <span className="truncate max-w-[150px]">{file.name}</span>
                <span className="text-on-surface/30">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-on-surface/40 hover:text-on-surface ml-1"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </span>
            ))}
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
            <button
              type="button"
              aria-label="Attach file"
              onClick={() => setDialogOpen(true)}
              className="p-2 text-on-surface/50 hover:text-on-surface hover:bg-white/40 rounded-xl transition-all"
            >
              <IconAttach />
            </button>
          </div>
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSend}
            disabled={disabled || (!value.trim() && selectedFiles.length === 0)}
            className="p-3 bg-primary text-on-primary rounded-xl shadow-md hover:brightness-95 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <IconSend />
          </button>
        </div>
      </div>
      <p className="text-center text-[9px] text-on-surface/30 mt-4 tracking-widest font-bold uppercase">
        {t("chatInput.disclaimer")}
      </p>
      <UploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleDialogConfirm}
        initialFiles={selectedFiles}
      />
    </div>
  );
}
