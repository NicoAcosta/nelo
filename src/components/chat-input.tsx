"use client";

import { useState, useRef } from "react";
import { IconSend, IconAttach } from "./icons";

interface ChatInputProps {
  onSend: (message: string, files?: FileList) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Write a message or upload a file...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed && !selectedFile) return;

    if (selectedFile) {
      const dt = new DataTransfer();
      dt.items.add(selectedFile);
      onSend(trimmed || "Analyze this floor plan", dt.files);
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
      setSelectedFile(file);
    }
    e.target.value = "";
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass-card border-2 border-white/50 rounded-2xl flex flex-col p-3">
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
          placeholder={placeholder}
          rows={1}
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
        Nelo may make mistakes. Verify important information with a professional.
      </p>
    </div>
  );
}
