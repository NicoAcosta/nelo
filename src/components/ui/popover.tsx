"use client";

/**
 * Popover — floating panel anchored to a trigger element.
 * Built as a custom component (no Radix dependency).
 * Adapted to project design tokens from globals.css.
 */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface PopoverTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  /** Alignment relative to trigger: start | center | end */
  align?: "start" | "center" | "end";
  /** Side to appear on: top | bottom | left | right */
  side?: "top" | "bottom" | "left" | "right";
}

interface PopoverContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
import { createContext, useContext } from "react";

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error("Popover compound components must be used within <Popover>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Popover root
// ---------------------------------------------------------------------------
export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const triggerRef = useRef<HTMLElement | null>(null);

  return (
    <PopoverContext.Provider value={{ open, onOpenChange, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// PopoverTrigger
// ---------------------------------------------------------------------------
export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const { open, onOpenChange, triggerRef } = usePopoverContext();

  // Ref callback to capture the DOM element
  const refCallback = (el: HTMLElement | null) => {
    triggerRef.current = el;
  };

  if (asChild) {
    // Clone the single child and inject ref + onClick
    const child = children as React.ReactElement<{
      ref?: React.Ref<HTMLElement>;
      onClick?: React.MouseEventHandler;
    }>;
    return {
      ...child,
      props: {
        ...child.props,
        ref: refCallback,
        onClick: (e: React.MouseEvent) => {
          child.props.onClick?.(e);
          onOpenChange(!open);
        },
      },
    } as React.ReactElement;
  }

  return (
    <span
      ref={refCallback as React.RefCallback<HTMLSpanElement>}
      onClick={() => onOpenChange(!open)}
      style={{ display: "contents" }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// PopoverContent
// ---------------------------------------------------------------------------
export function PopoverContent({
  children,
  className = "",
  align = "center",
  side = "bottom",
}: PopoverContentProps) {
  const { open, onOpenChange, triggerRef } = usePopoverContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  // Position calculation
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    if (side === "bottom") {
      top = rect.bottom + gap + window.scrollY;
    } else if (side === "top") {
      top = rect.top - gap + window.scrollY;
    } else if (side === "left") {
      left = rect.left - gap;
      top = rect.top + window.scrollY;
    } else if (side === "right") {
      left = rect.right + gap;
      top = rect.top + window.scrollY;
    }

    if (side === "bottom" || side === "top") {
      if (align === "start") left = rect.left;
      else if (align === "end") left = rect.right;
      else left = rect.left + rect.width / 2;
    }

    setStyle({
      position: "absolute",
      top,
      left,
      zIndex: 50,
      transform:
        side === "bottom" || side === "top"
          ? align === "center"
            ? "translateX(-50%)"
            : align === "end"
              ? "translateX(-100%)"
              : "none"
          : side === "top"
            ? "translateY(-100%)"
            : "none",
    });
  }, [open, side, align, triggerRef]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onOpenChange(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onOpenChange, triggerRef]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="dialog"
      style={style}
      className={`bg-[--color-surface] border border-[--color-outline-variant] rounded-xl shadow-lg p-4 ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
