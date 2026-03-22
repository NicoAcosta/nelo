"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number; // ms, default 1200
  format?: (value: number) => string;
  className?: string;
}

/**
 * Animated number counter that rolls up from 0 to the target value.
 * Uses requestAnimationFrame for smooth animation.
 * Respects prefers-reduced-motion by skipping animation.
 */
export function AnimatedCounter({
  value,
  duration = 1200,
  format = (n) => String(Math.round(n)),
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(duration === 0 ? value : 0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (duration === 0) {
      setDisplay(value);
      return;
    }

    // Check reduced motion preference
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    startTime.current = null;

    function step(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      } else {
        setDisplay(value);
      }
    }

    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
