# Estimate Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-screen interactive estimate results page at `/estimate/[id]` with cinematic animations, interactive SVG charts, and prominent Nelo branding, plus a compact in-chat preview linking to it.

**Architecture:** Server Component loads conversation from Supabase, extracts the latest `runEstimate` tool result (both inputs and output), and passes data to a Client Component dashboard. No new dependencies — SVG charts, CSS animations, `requestAnimationFrame` counters.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, Geist Sans/Mono, SVG, CSS animations

**Spec:** `docs/superpowers/specs/2026-03-22-estimate-dashboard-design.md`

---

## File Structure

```
src/
├── app/estimate/[id]/
│   ├── page.tsx                    — Server Component: load conversation, extract estimate
│   └── estimate-dashboard.tsx      — Client Component: root dashboard layout
│
├── components/estimate/
│   ├── animated-counter.tsx        — Reusable odometer number animation
│   ├── hero-section.tsx            — Big number, glow, confidence bar, metadata
│   ├── summary-cards.tsx           — 5-card metric strip
│   ├── donut-chart.tsx             — SVG radial chart with interactive segments
│   ├── category-breakdown.tsx      — Scrollable bar list with expand/collapse
│   ├── cost-buildup.tsx            — Waterfall visualization
│   ├── assumptions-panel.tsx       — Tags + project inputs grid
│   ├── nelo-footer.tsx             — Branding zone
│   ├── estimate-topbar.tsx         — Sticky top bar with actions
│   ├── category-colors.ts          — Color palette + assignment logic
│   └── format.ts                   — Shared ARS/USD formatting utilities
│
├── components/estimate-preview.tsx — Compact in-chat preview (replaces CostBreakdown usage)
│
├── lib/db/conversations.ts         — Modify: add loadEstimateData() helper
│
└── lib/i18n/translations.ts        — Modify: add estimate dashboard strings
```

---

### Task 1: Shared Utilities — Formatting + Category Colors

**Files:**
- Create: `src/components/estimate/format.ts`
- Create: `src/components/estimate/category-colors.ts`
- Create: `src/components/estimate/__tests__/format.test.ts`
- Create: `src/components/estimate/__tests__/category-colors.test.ts`

- [ ] **Step 1: Write failing tests for formatARS and formatUSD**

```typescript
// src/components/estimate/__tests__/format.test.ts
import { describe, it, expect } from "vitest";
import { formatARS, formatUSD, formatPercent, formatCompact } from "../format";

describe("formatARS", () => {
  it("formats large numbers with dots as thousands separator", () => {
    expect(formatARS(187450000)).toBe("187.450.000");
  });
  it("formats zero", () => {
    expect(formatARS(0)).toBe("0");
  });
});

describe("formatUSD", () => {
  it("formats with comma thousands separator", () => {
    expect(formatUSD(142680)).toBe("142,680");
  });
});

describe("formatPercent", () => {
  it("formats percentage with one decimal", () => {
    expect(formatPercent(22.5)).toBe("22.5%");
  });
  it("formats whole number without decimal", () => {
    expect(formatPercent(10)).toBe("10%");
  });
});

describe("formatCompact", () => {
  it("formats millions as $42.2M", () => {
    expect(formatCompact(42200000)).toBe("$42.2M");
  });
  it("formats thousands as $850K", () => {
    expect(formatCompact(850000)).toBe("$850K");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/estimate/__tests__/format.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement formatting utilities**

```typescript
// src/components/estimate/format.ts

/** Format ARS with dots as thousands separator, no decimals */
export function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format USD with comma thousands separator, no decimals */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format percentage: "22.5%" or "10%" */
export function formatPercent(value: number): string {
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted}%`;
}

/** Format compact: $42.2M or $850K */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return `$${value}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/estimate/__tests__/format.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing tests for category colors**

```typescript
// src/components/estimate/__tests__/category-colors.test.ts
import { describe, it, expect } from "vitest";
import { assignCategoryColors, CATEGORY_PALETTE } from "../category-colors";

describe("assignCategoryColors", () => {
  it("assigns distinct colors to top 9 categories", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `cat_${i}`);
    const colors = assignCategoryColors(ids);
    expect(colors.get("cat_0")).toBe(CATEGORY_PALETTE[0]);
    expect(colors.get("cat_8")).toBe(CATEGORY_PALETTE[8]);
  });

  it("assigns rest color to categories beyond top 9", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `cat_${i}`);
    const colors = assignCategoryColors(ids);
    expect(colors.get("cat_9")).toBe(CATEGORY_PALETTE[9]); // rest color
    expect(colors.get("cat_11")).toBe(CATEGORY_PALETTE[9]);
  });

  it("handles fewer than 9 categories", () => {
    const ids = ["a", "b", "c"];
    const colors = assignCategoryColors(ids);
    expect(colors.size).toBe(3);
  });
});
```

- [ ] **Step 6: Implement category colors**

```typescript
// src/components/estimate/category-colors.ts

/** 10-color palette: 9 distinct + 1 "rest" for remaining categories */
export const CATEGORY_PALETTE = [
  "#ccff00",           // nelo green (cat 1)
  "#a8d900",           // darker green (cat 2)
  "#3b82f6",           // blue (cat 3)
  "#60a5fa",           // light blue (cat 4)
  "#f59e0b",           // orange (cat 5)
  "#fbbf24",           // light orange (cat 6)
  "#22c55e",           // green (cat 7)
  "#4ade80",           // light green (cat 8)
  "#a855f7",           // purple (cat 9)
  "#52525b",           // zinc-600 (rest)
] as const;

/**
 * Assign colors to category IDs. Categories should be pre-sorted
 * by cost descending. Top 9 get distinct colors, rest get gray.
 */
export function assignCategoryColors(
  categoryIds: string[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < categoryIds.length; i++) {
    map.set(categoryIds[i], CATEGORY_PALETTE[Math.min(i, 9)]);
  }
  return map;
}
```

- [ ] **Step 7: Run all tests and verify they pass**

Run: `npx vitest run src/components/estimate/__tests__/`
Expected: PASS (all tests)

- [ ] **Step 8: Commit**

```bash
git add src/components/estimate/format.ts src/components/estimate/category-colors.ts src/components/estimate/__tests__/
git commit -m "feat(estimate): add formatting utilities and category color palette"
```

---

### Task 2: AnimatedCounter Component

**Files:**
- Create: `src/components/estimate/animated-counter.tsx`
- Create: `src/components/estimate/__tests__/animated-counter.test.tsx`

- [ ] **Step 1: Write failing test for AnimatedCounter**

```typescript
// src/components/estimate/__tests__/animated-counter.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedCounter } from "../animated-counter";

describe("AnimatedCounter", () => {
  it("renders the final value when reduced motion is preferred", () => {
    // AnimatedCounter should display the target value immediately
    // when animations are skipped (e.g., in test environment)
    render(<AnimatedCounter value={187450000} duration={0} />);
    // With duration=0, it should render the formatted value immediately
    expect(screen.getByText(/187/)).toBeTruthy();
  });

  it("accepts a custom formatter", () => {
    render(
      <AnimatedCounter
        value={1000}
        duration={0}
        format={(n) => `$${n}`}
      />,
    );
    expect(screen.getByText("$1000")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/estimate/__tests__/animated-counter.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement AnimatedCounter**

```tsx
// src/components/estimate/animated-counter.tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/estimate/__tests__/animated-counter.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/estimate/animated-counter.tsx src/components/estimate/__tests__/animated-counter.test.tsx
git commit -m "feat(estimate): add AnimatedCounter component with RAF animation"
```

---

### Task 3: Data Loading — Server-side estimate extraction

**Files:**
- Modify: `src/lib/db/conversations.ts` — add `loadEstimateData()` function
- Create: `src/lib/db/__tests__/load-estimate-data.test.ts`

- [ ] **Step 1: Write failing test for extractEstimateFromMessages**

```typescript
// src/lib/db/__tests__/load-estimate-data.test.ts
import { describe, it, expect } from "vitest";
import { extractEstimateFromMessages } from "../conversations";
import type { UIMessage } from "ai";

const mockEstimate = {
  totalPrice: 187450000,
  pricePerM2: 1041389,
  categories: [],
  confidence: "standard" as const,
  locationZone: "caba" as const,
} as any;

const mockInputs = {
  totalFloorAreaM2: 180,
  stories: 2,
  structureType: "hormigon_armado",
};

describe("extractEstimateFromMessages", () => {
  it("extracts the last runEstimate tool result", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "user",
        content: "estimate my house",
        parts: [{ type: "text", text: "estimate my house" }],
      },
      {
        id: "2",
        role: "assistant",
        content: "",
        parts: [
          {
            type: "tool-runEstimate",
            toolInvocationId: "t1",
            state: "output-available",
            args: mockInputs,
            output: mockEstimate,
          } as any,
        ],
      },
    ];
    const result = extractEstimateFromMessages(messages);
    expect(result).not.toBeNull();
    expect(result!.estimate.totalPrice).toBe(187450000);
    expect(result!.inputs.totalFloorAreaM2).toBe(180);
  });

  it("returns null when no runEstimate tool call exists", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "user",
        content: "hello",
        parts: [{ type: "text", text: "hello" }],
      },
    ];
    expect(extractEstimateFromMessages(messages)).toBeNull();
  });

  it("returns the last estimate when multiple exist", () => {
    const estimate1 = { ...mockEstimate, totalPrice: 100 };
    const estimate2 = { ...mockEstimate, totalPrice: 200 };
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        parts: [
          {
            type: "tool-runEstimate",
            toolInvocationId: "t1",
            state: "output-available",
            args: mockInputs,
            output: estimate1,
          } as any,
        ],
      },
      {
        id: "2",
        role: "assistant",
        content: "",
        parts: [
          {
            type: "tool-runEstimate",
            toolInvocationId: "t2",
            state: "output-available",
            args: mockInputs,
            output: estimate2,
          } as any,
        ],
      },
    ];
    const result = extractEstimateFromMessages(messages);
    expect(result!.estimate.totalPrice).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/db/__tests__/load-estimate-data.test.ts`
Expected: FAIL — function not found

- [ ] **Step 3: Implement extractEstimateFromMessages**

Add to `src/lib/db/conversations.ts`:

```typescript
import type { Estimate, ProjectInputs } from "@/lib/estimate/types";

export interface EstimateData {
  estimate: Estimate;
  inputs: ProjectInputs;
}

/**
 * Extract the most recent runEstimate tool result from conversation messages.
 * Returns both the Estimate output and the ProjectInputs that were passed as args.
 * Returns null if no runEstimate tool call exists.
 */
export function extractEstimateFromMessages(
  messages: UIMessage[],
): EstimateData | null {
  let lastResult: EstimateData | null = null;

  for (const message of messages) {
    if (message.role !== "assistant" || !message.parts) continue;
    for (const part of message.parts) {
      if (
        part.type === "tool-runEstimate" &&
        "state" in part &&
        part.state === "output-available" &&
        "output" in part &&
        part.output
      ) {
        lastResult = {
          estimate: part.output as Estimate,
          inputs: ("args" in part ? part.args : {}) as ProjectInputs,
        };
      }
    }
  }

  return lastResult;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/db/__tests__/load-estimate-data.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/conversations.ts src/lib/db/__tests__/load-estimate-data.test.ts
git commit -m "feat(estimate): add extractEstimateFromMessages for data extraction"
```

---

### Task 4: Estimate Page Route — Server Component

**Files:**
- Create: `src/app/estimate/[id]/page.tsx`

- [ ] **Step 1: Create the Server Component page**

```tsx
// src/app/estimate/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadConversation,
  extractEstimateFromMessages,
} from "@/lib/db/conversations";
import { EstimateDashboard } from "./estimate-dashboard";

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Load project title
  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Load conversation messages — pass empty userId (RLS handles auth)
  const messages = await loadConversation(id, "");
  if (!messages) notFound();

  // Extract estimate data from messages
  const estimateData = extractEstimateFromMessages(messages);
  if (!estimateData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#08080a] text-[#fafafa]">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No estimate found</p>
          <p className="text-sm text-[#71717a] mb-6">
            This conversation doesn&apos;t have a completed estimate yet.
          </p>
          <a
            href={`/chat/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ccff00] text-black font-semibold text-sm hover:brightness-95 transition-all"
          >
            ← Back to Chat
          </a>
        </div>
      </div>
    );
  }

  const projectName = project.title || "Construction Estimate";

  return (
    <EstimateDashboard
      estimate={estimateData.estimate}
      inputs={estimateData.inputs}
      projectName={projectName}
      chatId={id}
    />
  );
}
```

- [ ] **Step 2: Create a placeholder EstimateDashboard to verify routing**

```tsx
// src/app/estimate/[id]/estimate-dashboard.tsx
"use client";

import type { Estimate, ProjectInputs } from "@/lib/estimate/types";

interface EstimateDashboardProps {
  estimate: Estimate;
  inputs: ProjectInputs;
  projectName: string;
  chatId: string;
}

export function EstimateDashboard({
  estimate,
  projectName,
  chatId,
}: EstimateDashboardProps) {
  return (
    <div className="min-h-screen bg-[#08080a] text-[#fafafa] flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold">{projectName}</p>
        <p className="text-[#ccff00] font-mono text-4xl mt-4">
          ${estimate.totalPrice.toLocaleString("es-AR")}
        </p>
        <a
          href={`/chat/${chatId}`}
          className="mt-6 inline-block text-sm text-[#71717a] hover:text-white"
        >
          ← Back to Chat
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify route works by navigating to /estimate/[valid-id] in the browser**

Run: `npx next dev` (if not running)
Navigate to a conversation ID that has an estimate. Verify the placeholder renders.

- [ ] **Step 4: Commit**

```bash
git add src/app/estimate/[id]/page.tsx src/app/estimate/[id]/estimate-dashboard.tsx
git commit -m "feat(estimate): add /estimate/[id] route with data loading"
```

---

### Task 5: EstimateTopbar Component

**Files:**
- Create: `src/components/estimate/estimate-topbar.tsx`

- [ ] **Step 1: Implement the sticky top bar**

```tsx
// src/components/estimate/estimate-topbar.tsx
"use client";

import { useCallback, useState } from "react";
import { useLocale } from "@/lib/i18n/use-locale";

interface EstimateTopbarProps {
  projectName: string;
  chatId: string;
  locationLabel: string;
}

export function EstimateTopbar({
  projectName,
  chatId,
  locationLabel,
}: EstimateTopbarProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const displayName = locationLabel
    ? `${projectName} — ${locationLabel}`
    : projectName;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-8 py-2.5 bg-[#08080a]/85 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-3.5">
        {/* N mark */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z"
            fill="#ccff00"
            stroke="#000"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[15px] font-black tracking-[2px] text-[#ccff00]">
          NELO
        </span>
        <span className="w-px h-4 bg-[#3f3f46]" />
        <span className="text-[13px] text-[#71717a] font-medium truncate max-w-[300px]">
          {displayName}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-all flex items-center gap-1.5"
        >
          {copied ? "Copied!" : "↗ Share"}
        </button>
        <button
          disabled
          title="Coming soon"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] text-[#3f3f46] cursor-not-allowed flex items-center gap-1.5"
        >
          ⬇ Export
        </button>
        <a
          href={`/chat/${chatId}`}
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#ccff00] text-black border border-[#ccff00] hover:bg-[#E2FF00] transition-all"
        >
          ← Back to Chat
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/estimate/estimate-topbar.tsx
git commit -m "feat(estimate): add EstimateTopbar with share and navigation"
```

---

### Task 6: HeroSection Component

**Files:**
- Create: `src/components/estimate/hero-section.tsx`

- [ ] **Step 1: Implement HeroSection with animated counter, glow, confidence bar**

```tsx
// src/components/estimate/hero-section.tsx
"use client";

import type { Estimate, LocationZone } from "@/lib/estimate/types";
import { AnimatedCounter } from "./animated-counter";
import { formatARS, formatUSD } from "./format";

const ZONE_LABELS: Record<LocationZone, string> = {
  caba: "CABA",
  gba_norte: "GBA Norte",
  gba_sur: "GBA Sur",
  gba_oeste: "GBA Oeste",
};

interface HeroSectionProps {
  estimate: Estimate;
}

export function HeroSection({ estimate }: HeroSectionProps) {
  const confidencePercent =
    estimate.inputsTotal > 0
      ? Math.round((estimate.inputsProvided / estimate.inputsTotal) * 100)
      : 0;

  const confidencePosition = confidencePercent;
  const rangeLow = estimate.confidenceRange?.low ?? 85;
  const rangeHigh = estimate.confidenceRange?.high ?? 115;
  const lowPrice = Math.round(estimate.totalPrice * (rangeLow / 100));
  const highPrice = Math.round(estimate.totalPrice * (rangeHigh / 100));

  return (
    <div className="relative px-8 pt-14 pb-10 text-center overflow-hidden">
      {/* Breathing glow */}
      <div className="absolute w-[700px] h-[350px] top-[10%] left-1/2 -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(204,255,0,0.06)_0%,transparent_70%)] blur-[80px] pointer-events-none animate-[breathe_5s_ease-in-out_infinite]" />

      {/* Blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(204,255,0,0.015) 59px, rgba(204,255,0,0.015) 60px),
            repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(204,255,0,0.015) 59px, rgba(204,255,0,0.015) 60px)
          `,
        }}
      />

      {/* N mark */}
      <div className="relative mb-5 inline-block">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-[0_0_20px_rgba(204,255,0,0.3)]"
        >
          <path
            d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z"
            fill="#ccff00"
            stroke="rgba(204,255,0,0.3)"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Eyebrow */}
      <div className="relative text-[11px] font-semibold tracking-[4px] uppercase text-[#71717a] mb-4">
        Construction Estimate
      </div>

      {/* Total price */}
      <div className="relative">
        <span className="font-mono text-[80px] font-extrabold leading-none tracking-[-3px] bg-gradient-to-b from-white/100 via-white/90 to-[#888] bg-clip-text text-transparent">
          <span className="text-[36px] font-medium !text-[#ccff00] tracking-normal mr-1.5 align-top leading-[80px] bg-none bg-clip-border [-webkit-text-fill-color:#ccff00]">
            ARS
          </span>
          <AnimatedCounter value={estimate.totalPrice} format={formatARS} />
        </span>
      </div>

      {/* USD */}
      <div className="relative font-mono text-[20px] font-medium text-[#3f3f46] mt-2.5">
        ≈ USD <AnimatedCounter value={estimate.totalPriceUsd} format={formatUSD} />
      </div>

      {/* Metadata chips */}
      <div className="relative flex items-center justify-center gap-1.5 mt-5 flex-wrap">
        {[
          `${estimate.floorAreaM2} m²`,
          ZONE_LABELS[estimate.locationZone],
        ]
          .filter(Boolean)
          .map((label, i) => (
            <span
              key={label}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[#18181b] text-[#a1a1aa] border border-white/[0.06]"
              style={{ animationDelay: `${0.6 + i * 0.05}s` }}
            >
              {label}
            </span>
          ))}
      </div>

      {/* Confidence bar */}
      <div className="max-w-[380px] mx-auto mt-6 relative">
        <div className="h-[3px] bg-[#222225] rounded-full relative">
          <div
            className="absolute h-full bg-gradient-to-r from-[rgba(204,255,0,0.2)] via-[#ccff00] to-[rgba(204,255,0,0.2)] rounded-full"
            style={{ left: "20%", right: "20%" }}
          />
          <div
            className="absolute w-2.5 h-2.5 bg-[#ccff00] rounded-full top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(204,255,0,0.5)]"
            style={{
              left: `${Math.min(Math.max(confidencePosition, 10), 90)}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
          <span
            className="absolute -top-5 text-[10px] font-bold text-[#ccff00] font-mono tracking-wide"
            style={{
              left: `${Math.min(Math.max(confidencePosition, 10), 90)}%`,
              transform: "translateX(-50%)",
            }}
          >
            {confidencePercent}% confidence
          </span>
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-mono text-[#3f3f46]">
          <span>${formatARS(lowPrice)} (low)</span>
          <span>${formatARS(highPrice)} (high)</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the `breathe` keyframe to globals.css**

Add to `src/app/globals.css` before the reduced-motion media query:

```css
@keyframes breathe {
  0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.06); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/estimate/hero-section.tsx src/app/globals.css
git commit -m "feat(estimate): add HeroSection with animated counter and glow"
```

---

### Task 7: SummaryCards Component

**Files:**
- Create: `src/components/estimate/summary-cards.tsx`

- [ ] **Step 1: Implement SummaryCards**

```tsx
// src/components/estimate/summary-cards.tsx
"use client";

import type { Estimate } from "@/lib/estimate/types";
import { AnimatedCounter } from "./animated-counter";
import { formatARS } from "./format";

interface SummaryCardsProps {
  estimate: Estimate;
}

export function SummaryCards({ estimate }: SummaryCardsProps) {
  const activeCategories = estimate.categories.filter(
    (c) => c.subtotal > 0,
  ).length;

  const confidenceLabel =
    estimate.confidence === "quick"
      ? "Quick"
      : estimate.confidence === "standard"
        ? "Standard"
        : "Detailed";

  const cards = [
    {
      label: "Price / m²",
      value: estimate.pricePerM2,
      format: (n: number) => `$${formatARS(Math.round(n))}`,
      sub: "ARS per square meter",
      accent: true,
    },
    {
      label: "Total Area",
      value: estimate.floorAreaM2,
      format: (n: number) => `${Math.round(n)} m²`,
      sub: null,
    },
    {
      label: "Categories",
      value: activeCategories,
      format: (n: number) => String(Math.round(n)),
      sub: "construction categories",
    },
    {
      label: "Line Items",
      value: estimate.activeLineItems,
      format: (n: number) => String(Math.round(n)),
      sub: "individual cost items",
    },
    {
      label: "Confidence",
      value: null,
      staticText: confidenceLabel,
      sub: `${estimate.inputsProvided} of ${estimate.inputsTotal} inputs`,
      green: true,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-px bg-white/[0.06] mx-8 rounded-xl overflow-hidden border border-white/[0.06]">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#111113] px-5 py-[18px] hover:bg-[#18181b] transition-colors"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#71717a] mb-1.5">
            {card.label}
          </div>
          <div
            className={`font-mono text-xl font-bold ${
              card.accent
                ? "text-[#ccff00]"
                : card.green
                  ? "text-[#22c55e]"
                  : "text-[#fafafa]"
            }`}
          >
            {card.staticText ?? (
              <AnimatedCounter
                value={card.value!}
                format={card.format!}
                duration={800}
              />
            )}
          </div>
          {card.sub && (
            <div className="text-[11px] text-[#3f3f46] mt-0.5">{card.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/estimate/summary-cards.tsx
git commit -m "feat(estimate): add SummaryCards metric strip"
```

---

### Task 8: DonutChart Component

**Files:**
- Create: `src/components/estimate/donut-chart.tsx`

- [ ] **Step 1: Implement DonutChart with interactive SVG segments**

```tsx
// src/components/estimate/donut-chart.tsx
"use client";

import { useState } from "react";
import type { CategoryTotal } from "@/lib/estimate/types";
import { assignCategoryColors } from "./category-colors";
import { formatCompact, formatPercent } from "./format";

interface DonutChartProps {
  categories: CategoryTotal[];
  totalPrice: number;
}

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 26;
const HOVER_STROKE = 32;

export function DonutChart({ categories, totalPrice }: DonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter and sort by cost descending
  const active = categories
    .filter((c) => c.subtotal > 0)
    .sort((a, b) => b.subtotal - a.subtotal);

  const colorMap = assignCategoryColors(active.map((c) => c.id));

  // Build segments: top 9 individual + 1 "rest"
  const top9 = active.slice(0, 9);
  const rest = active.slice(9);
  const restTotal = rest.reduce((sum, c) => sum + c.subtotal, 0);
  const directCost = active.reduce((sum, c) => sum + c.subtotal, 0);

  type Segment = {
    id: string;
    name: string;
    value: number;
    percent: number;
    color: string;
  };

  const segments: Segment[] = top9.map((c) => ({
    id: c.id,
    name: c.name,
    value: c.subtotal,
    percent: directCost > 0 ? (c.subtotal / directCost) * 100 : 0,
    color: colorMap.get(c.id) ?? "#52525b",
  }));

  if (restTotal > 0) {
    segments.push({
      id: "__rest__",
      name: `+ ${rest.length} more`,
      value: restTotal,
      percent: directCost > 0 ? (restTotal / directCost) * 100 : 0,
      color: "#52525b",
    });
  }

  // Calculate dash offsets
  let offset = 0;
  const segmentData = segments.map((seg) => {
    const dashLen = (seg.percent / 100) * CIRCUMFERENCE;
    const gapLen = CIRCUMFERENCE - dashLen;
    const currentOffset = -offset;
    offset += dashLen;
    return { ...seg, dashLen, gapLen, offset: currentOffset };
  });

  return (
    <div className="bg-[#111113] p-8 flex flex-col items-center justify-center gap-6">
      {/* SVG Chart */}
      <div className="w-[260px] h-[260px] relative">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {segmentData.map((seg) => (
            <circle
              key={seg.id}
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredId === seg.id ? HOVER_STROKE : STROKE_WIDTH}
              strokeDasharray={`${seg.dashLen} ${seg.gapLen}`}
              strokeDashoffset={seg.offset}
              className="transition-all duration-200 cursor-pointer"
              style={{
                filter:
                  hoveredId === seg.id
                    ? `brightness(1.3) drop-shadow(0 0 6px ${seg.color})`
                    : "none",
              }}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[22px] font-bold text-[#fafafa]">
            {formatCompact(totalPrice)}
          </span>
          <span className="text-[11px] text-[#71717a] mt-0.5">
            {active.length} categories
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
              hoveredId === seg.id ? "bg-white/[0.03]" : ""
            }`}
            onMouseEnter={() => setHoveredId(seg.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span
              className="w-2 h-2 rounded-[3px] flex-shrink-0"
              style={{ background: seg.color }}
            />
            <span className="text-xs text-[#a1a1aa] flex-1 truncate">
              {seg.name}
            </span>
            <span className="font-mono text-[11px] text-[#71717a] flex-shrink-0">
              {formatPercent(seg.percent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/estimate/donut-chart.tsx
git commit -m "feat(estimate): add interactive DonutChart with SVG segments"
```

---

### Task 9: CategoryBreakdown Component

**Files:**
- Create: `src/components/estimate/category-breakdown.tsx`

- [ ] **Step 1: Implement CategoryBreakdown with animated bars and expandable rows**

Create `src/components/estimate/category-breakdown.tsx` with:
- Sorted list of all non-zero categories
- Rank number, name, animated bar fill, value
- Filter tabs: "By Cost" | "By %" | "Grouped"
- Click a row to expand and show its `lineItems` as sub-rows
- Bar colors from `categoryColors`
- English name shown on hover via `title` attribute (join against `CATEGORIES` from categories-config by `id`)

The component should import `CATEGORIES` from `@/lib/pricing/categories-config` to resolve English names. Use a `useState` for the active filter tab and a `Set<string>` for expanded category IDs.

- [ ] **Step 2: Commit**

```bash
git add src/components/estimate/category-breakdown.tsx
git commit -m "feat(estimate): add CategoryBreakdown with bars and expand"
```

---

### Task 10: CostBuildUp + AssumptionsPanel Components

**Files:**
- Create: `src/components/estimate/cost-buildup.tsx`
- Create: `src/components/estimate/assumptions-panel.tsx`

- [ ] **Step 1: Implement CostBuildUp waterfall**

Create `src/components/estimate/cost-buildup.tsx` showing:
- Direct Cost bar (largest, gray)
- Overhead bar (blue-tinted) with percentage label
- Profit bar (orange-tinted) with percentage label
- Divider with subtotal
- IVA bar (purple-tinted) with percentage label
- Divider
- Total bar (full width, brand green border + fill)
- All values from `estimate.directCost`, `estimate.overheadAmount`, etc.

- [ ] **Step 2: Implement AssumptionsPanel**

Create `src/components/estimate/assumptions-panel.tsx` showing:
- `estimate.assumptions` as pill tags
- Project inputs grid (2 cols) from the `inputs` prop: structureType, roofType, finishLevel, locationZone, bedroomCount, bathroomCount
- Description text: "Nelo assumed these values where not specified."

- [ ] **Step 3: Commit**

```bash
git add src/components/estimate/cost-buildup.tsx src/components/estimate/assumptions-panel.tsx
git commit -m "feat(estimate): add CostBuildUp waterfall and AssumptionsPanel"
```

---

### Task 11: NeloFooter Component

**Files:**
- Create: `src/components/estimate/nelo-footer.tsx`

- [ ] **Step 1: Implement NeloFooter with big branding**

Create `src/components/estimate/nelo-footer.tsx` with:
- Large N mark SVG (72px, 25% opacity, glow drop-shadow)
- "NELO" wordmark (80px, 12% opacity, letter-spacing 20px)
- "AI Construction Cost Estimation" tagline
- "nelo.archi" in mono
- CTA buttons: "Start New Estimate" (links to `/`) and "Back to Chat →" (links to `/chat/[chatId]`)
- Subtle radial glow behind section
- "Powered by Nelo" strip at bottom

- [ ] **Step 2: Commit**

```bash
git add src/components/estimate/nelo-footer.tsx
git commit -m "feat(estimate): add NeloFooter branding zone"
```

---

### Task 12: Assemble EstimateDashboard — Full Layout

**Files:**
- Modify: `src/app/estimate/[id]/estimate-dashboard.tsx` — replace placeholder

- [ ] **Step 1: Wire all components into the dashboard**

Replace the placeholder `EstimateDashboard` with the full layout:

```tsx
// src/app/estimate/[id]/estimate-dashboard.tsx
"use client";

import type { Estimate, ProjectInputs, LocationZone } from "@/lib/estimate/types";
import { EstimateTopbar } from "@/components/estimate/estimate-topbar";
import { HeroSection } from "@/components/estimate/hero-section";
import { SummaryCards } from "@/components/estimate/summary-cards";
import { DonutChart } from "@/components/estimate/donut-chart";
import { CategoryBreakdown } from "@/components/estimate/category-breakdown";
import { CostBuildUp } from "@/components/estimate/cost-buildup";
import { AssumptionsPanel } from "@/components/estimate/assumptions-panel";
import { NeloFooter } from "@/components/estimate/nelo-footer";

const ZONE_LABELS: Record<LocationZone, string> = {
  caba: "CABA",
  gba_norte: "GBA Norte",
  gba_sur: "GBA Sur",
  gba_oeste: "GBA Oeste",
};

interface EstimateDashboardProps {
  estimate: Estimate;
  inputs: ProjectInputs;
  projectName: string;
  chatId: string;
}

export function EstimateDashboard({
  estimate,
  inputs,
  projectName,
  chatId,
}: EstimateDashboardProps) {
  const locationLabel = ZONE_LABELS[estimate.locationZone] ?? "";

  return (
    <div className="min-h-screen bg-[#08080a] text-[#fafafa] relative">
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px",
        }}
      />

      <EstimateTopbar
        projectName={projectName}
        chatId={chatId}
        locationLabel={locationLabel}
      />

      <HeroSection estimate={estimate} />

      <SummaryCards estimate={estimate} />

      {/* Main two-panel grid */}
      <div className="grid grid-cols-[1fr_1.3fr] gap-px bg-white/[0.06] mx-8 my-5 rounded-xl overflow-hidden border border-white/[0.06] min-h-[480px]">
        <DonutChart
          categories={estimate.categories}
          totalPrice={estimate.totalPrice}
        />
        <CategoryBreakdown categories={estimate.categories} />
      </div>

      {/* Bottom two-panel grid */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.06] mx-8 mb-5 rounded-xl overflow-hidden border border-white/[0.06]">
        <CostBuildUp estimate={estimate} />
        <AssumptionsPanel estimate={estimate} inputs={inputs} />
      </div>

      <NeloFooter chatId={chatId} />
    </div>
  );
}
```

- [ ] **Step 2: Verify the full dashboard renders in the browser**

Navigate to `/estimate/[id]` with a conversation that has an estimate. Verify all sections render.

- [ ] **Step 3: Commit**

```bash
git add src/app/estimate/[id]/estimate-dashboard.tsx
git commit -m "feat(estimate): assemble full dashboard layout"
```

---

### Task 13: EstimatePreview — Compact In-Chat Component

**Files:**
- Create: `src/components/estimate-preview.tsx`
- Modify: `src/app/chat/[id]/chat-content.tsx` — swap CostBreakdown for EstimatePreview

- [ ] **Step 1: Implement EstimatePreview**

Create `src/components/estimate-preview.tsx`:
- Dark card (matching existing CostBreakdown dark theme)
- Shows total price (large, mono), price/m² in accent green
- Confidence level badge
- Top 5 categories as mini horizontal bars
- "View Full Estimate →" link to `/estimate/[chatId]` — prominent, brand green
- Much more compact than CostBreakdown (aim for ~200px height vs current ~400px+)

The component receives `estimate: Estimate` and `chatId: string` as props.

- [ ] **Step 2: Update chat-content.tsx to use EstimatePreview**

In `src/app/chat/[id]/chat-content.tsx`, modify the `renderToolResult` function:

Change:
```tsx
import { CostBreakdown } from "@/components/cost-breakdown";
```
To:
```tsx
import { EstimatePreview } from "@/components/estimate-preview";
```

And update the `runEstimate` case:
```tsx
if (toolName === "runEstimate" && result) {
  return <EstimatePreview estimate={result as Estimate} chatId={id} />;
}
```

Where `id` is the chat ID already available in the component scope.

- [ ] **Step 3: Verify in browser — estimate tool result in chat shows preview with link**

- [ ] **Step 4: Commit**

```bash
git add src/components/estimate-preview.tsx src/app/chat/[id]/chat-content.tsx
git commit -m "feat(estimate): add compact EstimatePreview in chat with dashboard link"
```

---

### Task 14: i18n Translations

**Files:**
- Modify: `src/lib/i18n/translations.ts` — add estimate dashboard strings

- [ ] **Step 1: Add EN and ES translations for the estimate dashboard**

Add to both the `en` and `es` translation objects in `src/lib/i18n/translations.ts`:

```typescript
// EN
"estimate.title": "Construction Estimate",
"estimate.pricePerM2": "Price / m²",
"estimate.totalArea": "Total Area",
"estimate.categories": "Categories",
"estimate.lineItems": "Line Items",
"estimate.confidence": "Confidence",
"estimate.confidenceQuick": "Quick",
"estimate.confidenceStandard": "Standard",
"estimate.confidenceDetailed": "Detailed",
"estimate.categoryBreakdown": "Category Breakdown",
"estimate.byCost": "By Cost",
"estimate.byPercent": "By %",
"estimate.grouped": "Grouped",
"estimate.costBuildup": "Cost Build-up",
"estimate.directCost": "Direct Cost",
"estimate.overhead": "Overhead",
"estimate.profit": "Profit",
"estimate.total": "Total",
"estimate.assumptions": "Assumptions",
"estimate.assumptionsDesc": "Nelo assumed these values where not specified. Refine in chat for a more accurate estimate.",
"estimate.viewFull": "View Full Estimate →",
"estimate.backToChat": "← Back to Chat",
"estimate.share": "Share",
"estimate.export": "Export",
"estimate.comingSoon": "Coming soon",
"estimate.noEstimate": "No estimate found",
"estimate.noEstimateDesc": "This conversation doesn't have a completed estimate yet.",
"estimate.newEstimate": "Start New Estimate",
"estimate.poweredBy": "Powered by Nelo",
```

Add matching Spanish translations for the `es` object.

- [ ] **Step 2: Commit**

```bash
git add src/lib/i18n/translations.ts
git commit -m "feat(estimate): add i18n strings for estimate dashboard"
```

---

### Task 15: CSS Animations + Polish

**Files:**
- Modify: `src/app/globals.css` — add estimate-specific keyframes

- [ ] **Step 1: Add animation keyframes to globals.css**

Add before the `prefers-reduced-motion` media query (note: `breathe` keyframe was already added in Task 6):

```css
/* Estimate dashboard animations */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-up {
  animation: fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

- [ ] **Step 2: Add stagger delay utility classes**

Add after the fade-up animation:

```css
.delay-1 { animation-delay: 0.05s; }
.delay-2 { animation-delay: 0.15s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.45s; }
.delay-5 { animation-delay: 0.6s; }
.delay-6 { animation-delay: 0.75s; }
```

- [ ] **Step 3: Apply animation classes to EstimateDashboard sections**

In `estimate-dashboard.tsx`, wrap each major section with `animate-fade-up` and appropriate delay class:
- Topbar: no animation (sticky, always visible)
- Hero: `animate-fade-up delay-1`
- Summary: `animate-fade-up delay-2`
- Main grid: `animate-fade-up delay-3`
- Bottom grid: `animate-fade-up delay-4`
- Footer: `animate-fade-up delay-5`

- [ ] **Step 4: Verify animations in browser with normal and reduced-motion settings**

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/estimate/[id]/estimate-dashboard.tsx
git commit -m "feat(estimate): add staggered reveal animations"
```

---

### Task 16: Visual QA + Final Polish

**Files:**
- Various — fix any visual issues found during review

- [ ] **Step 1: Open /estimate/[id] in browser and verify all sections**

Checklist:
- [ ] Top bar renders with N mark, NELO, project name, all buttons
- [ ] Share button copies URL to clipboard
- [ ] Hero shows animated counter, glow breathe, confidence bar
- [ ] Summary cards show all 5 metrics
- [ ] Donut chart renders with correct proportions, hover expands segments
- [ ] Legend hover highlights corresponding segment
- [ ] Category breakdown shows ranked bars, click expands to line items
- [ ] Cost build-up waterfall shows correct math
- [ ] Assumptions panel shows tags and project inputs
- [ ] Footer shows large NELO branding, CTAs work
- [ ] Stagger animations play on load
- [ ] Page looks correct on mobile (may need responsive adjustments)
- [ ] No console errors

- [ ] **Step 2: Use @vercel:react-best-practices to review the components**

- [ ] **Step 3: Fix any issues found and commit**

```bash
git add -A
git commit -m "fix(estimate): visual QA polish pass"
```
