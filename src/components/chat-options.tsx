"use client";

import { useEffect, useRef, useCallback } from "react";
import { IconCheck } from "@/components/icons";

interface ChatOptionsProps {
  questionId: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (label: string) => void;
  disabled: boolean;
  selectedValue: string | null;
  /** Only the latest active option set should handle keyboard events */
  isLatest: boolean;
}

const baseStyles =
  "text-sm font-medium transition duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background";

const pillStyles = "px-4 py-2 rounded-full";
const verticalStyles = "px-4 py-2.5 rounded-xl w-full text-left";

const stateStyles = {
  selected: "glass-primary text-black font-bold",
  notSelected: "glass-card opacity-50 cursor-not-allowed text-on-surface/60",
  active: "glass-card text-on-surface/80 hover:text-on-surface hover:bg-surface-container-high cursor-pointer",
} as const;

export function ChatOptions({
  questionId,
  options,
  onSelect,
  disabled,
  selectedValue,
  isLatest,
}: ChatOptionsProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusIndex = useRef(-1);

  const usePills =
    options.length <= 4 && options.every((o) => o.label.length <= 20);

  const handleSelect = useCallback(
    (label: string) => {
      if (!disabled) onSelect(label);
    },
    [disabled, onSelect],
  );

  const moveFocus = useCallback(
    (delta: number) => {
      const next = Math.max(
        0,
        Math.min(options.length - 1, focusIndex.current + delta),
      );
      focusIndex.current = next;
      buttonRefs.current[next]?.focus();
    },
    [options.length],
  );

  // Only register keyboard listener on the latest, non-disabled option set
  useEffect(() => {
    if (disabled || !isLatest) return;

    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      if (
        active?.tagName === "TEXTAREA" ||
        active?.tagName === "INPUT"
      ) {
        return;
      }

      // Number keys 1-9
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= options.length) {
        e.preventDefault();
        handleSelect(options[num - 1].label);
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        moveFocus(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        moveFocus(-1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [disabled, isLatest, options, handleSelect, moveFocus]);

  const hasSelection = selectedValue !== null;

  return (
    <div
      role="group"
      aria-label="Options"
      data-layout={usePills ? "pills" : "vertical"}
      data-question-id={questionId}
      className={[
        usePills ? "flex flex-wrap gap-2" : "flex flex-col gap-1.5 max-w-sm",
        "animate-result-in",
      ].join(" ")}
    >
      {options.map((opt, i) => {
        const isSelected = hasSelection && selectedValue === opt.label;
        const isNotSelected = hasSelection && selectedValue !== opt.label;

        const stateClass = isSelected
          ? stateStyles.selected
          : isNotSelected
            ? stateStyles.notSelected
            : stateStyles.active;

        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            disabled={disabled}
            aria-pressed={hasSelection ? isSelected : undefined}
            data-selected={hasSelection ? String(isSelected) : undefined}
            onClick={() => handleSelect(opt.label)}
            className={[
              usePills ? pillStyles : verticalStyles,
              baseStyles,
              stateClass,
            ].join(" ")}
          >
            {isSelected && <IconCheck className="flex-shrink-0" />}
            <kbd
              className="kbd-hint text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-on-surface/40 flex-shrink-0"
              aria-hidden="true"
            >
              {i + 1}
            </kbd>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
