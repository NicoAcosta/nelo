"use client";

import { useState, useRef } from "react";
import { IconSend, IconAttach } from "./icons";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Write a message or upload a file...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass-card border-2 border-white/50 rounded-2xl flex flex-col p-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-on-surface placeholder:text-on-surface/30 min-h-[60px] max-h-[200px] resize-none px-4 py-2 font-bold text-sm uppercase tracking-tight"
        />
        <div className="flex items-center justify-between px-2 pb-1 pt-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Attach file"
              className="p-2 text-on-surface/50 hover:text-on-surface hover:bg-white/40 rounded-xl transition-all"
            >
              <IconAttach />
            </button>
          </div>
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSend}
            disabled={disabled || !value.trim()}
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
