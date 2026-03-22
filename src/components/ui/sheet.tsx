"use client";

/**
 * Sheet — right-side slide-over drawer.
 * Built as a custom portal component (no Radix/shadcn dependency).
 * Adapted to project design tokens from globals.css.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface SheetContentProps {
  children: ReactNode;
  /** Accessible label for aria-labelledby */
  titleId?: string;
}

interface SheetHeaderProps {
  children: ReactNode;
}

interface SheetTitleProps {
  id?: string;
  children: ReactNode;
}

interface SheetBodyProps {
  children: ReactNode;
}

interface SheetFooterProps {
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  // Handle Escape key
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <SheetRoot onOpenChange={onOpenChange}>{children}</SheetRoot>,
    document.body,
  );
}

function SheetRoot({
  onOpenChange,
  children,
}: {
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-dialog-backdrop"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet panel */}
      <div className="relative ml-auto">{children}</div>
    </div>
  );
}

export function SheetContent({
  children,
  titleId,
}: SheetContentProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus first focusable element on mount
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, []);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="relative h-full w-screen md:w-[420px] bg-[--color-surface] border-l border-[--color-outline-variant] shadow-2xl flex flex-col overflow-hidden"
      style={{
        animation: "sheet-slide-in 250ms cubic-bezier(0.25,1,0.5,1) both",
      }}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-outline-variant] shrink-0">
      {children}
    </div>
  );
}

export function SheetTitle({ id, children }: SheetTitleProps) {
  return (
    <h2 id={id} className="text-base font-bold text-[--color-on-surface]">
      {children}
    </h2>
  );
}

export function SheetBody({ children }: SheetBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {children}
    </div>
  );
}

export function SheetFooter({ children }: SheetFooterProps) {
  return (
    <div className="shrink-0 px-6 py-4 border-t border-[--color-outline-variant] bg-[--color-surface]">
      {children}
    </div>
  );
}
