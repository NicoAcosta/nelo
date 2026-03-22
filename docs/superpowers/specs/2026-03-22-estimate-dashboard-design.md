# Estimate Dashboard — Full-Screen Interactive Results Page

## Overview

A full-screen, cinematic dashboard page at `/estimate/[id]` that displays construction cost estimates with premium data visualization, interactive charts, and strong Nelo branding. Accessed via a "View Full Estimate" button from the compact in-chat preview.

## Two-Surface Architecture

**In-chat preview (compact):** A redesigned `CostBreakdown` component rendered inline when the `runEstimate` tool returns. Shows the total price, price/m², confidence level, and top 5 categories as a mini bar chart. Contains a prominent "View Full Estimate →" button linking to the full-screen page.

**Full-screen page (`/estimate/[id]`):** A dedicated route that loads the full `Estimate` object and renders the cinematic dashboard. Shareable URL, screenshot-friendly, with Nelo branding throughout. Dark-mode-only regardless of app theme — this is a special presentation surface.

## Page Structure

### 1. Sticky Top Bar
- Nelo N mark SVG + "NELO" wordmark (left)
- Project name: "Casa Familiar — Palermo, CABA" (left, after divider)
- Actions (right): Share button, Export button, "← Back to Chat" primary button
- Frosted glass background with blur, border-bottom

### 2. Hero Section — The Big Number
- Large N mark SVG (48px) with glow drop-shadow, centered above the number
- "Construction Estimate" eyebrow label in small caps
- Total price: ARS formatted in monospace, 80-84px, gradient text (white → gray)
- Currency prefix "ARS" in brand green (#ccff00)
- USD conversion underneath in muted text
- Project metadata as pill chips: area, stories, zone, finish level, structure type
- Confidence range bar: track with gradient fill showing low-high range, glowing dot at the estimate point, percentage badge
- Background: breathing radial glow animation (brand green, 5s cycle) + subtle blueprint grid lines (matching app's `.grid-lines` pattern)

**Animations on load:**
- Total price counts up from 0 using an odometer/slot-machine effect — each digit rolls independently with stagger (~1.2s total, ease-out)
- USD conversion fades in after counter settles
- Metadata chips stagger in left-to-right (50ms delay each)
- Confidence bar fill animates from 0 to position (0.8s)

### 3. Summary Cards Strip
Five cards in a single row, separated by 1px borders:
1. **Price/m²** — in brand green, monospace
2. **Total Area** — with sub-text showing floor breakdown
3. **Categories** — count (26)
4. **Line Items** — count (84)
5. **Confidence** — level label (Quick/Standard/Detailed) + inputs provided ratio

Each card has hover state (slightly brighter background). Values animate with counter effect on load.

### 4. Main Two-Panel Grid

**Left panel: Donut Chart**
- SVG-based radial donut (260-280px diameter, 26px stroke width)
- 9 visible segments for top 9 categories + 1 "rest" segment
- Category color palette: greens (derived from #ccff00), blues, oranges, purples, grays for tail
- Segments expand on hover (stroke-width increases to 32, brightness filter + drop-shadow)
- Center: total price + "26 categories" label
- Below chart: 2-column legend with colored dots, category names, and percentages
- Hover a legend item → corresponding donut segment highlights

**Right panel: Category Breakdown List**
- Header with title + filter tabs: "By Cost" | "By %" | "Grouped"
- Scrollable list of all 26 categories, each row showing:
  - Rank number (monospace)
  - Category name (Spanish, with English name available on hover/tooltip)
  - Horizontal bar fill (color-coded, proportional to cost)
  - Cost value (monospace, right-aligned)
- Bars animate from 0 to full width on load (1.2s, staggered 30ms per row, cubic-bezier ease-out)
- Hover row → subtle background highlight
- Click row → expands to show subcategories and individual line items (progressive disclosure)

**Color assignment:** Top 9 categories get distinct colors from the palette. Remaining 17 share a muted gray. Colors are consistent between donut and bars.

### 5. Bottom Two-Panel Grid

**Left panel: Cost Build-up Waterfall**
- Visual breakdown of how the total is composed:
  - Direct Cost → largest bar (surface gray)
  - Overhead (15%) → blue-tinted bar
  - Profit (10%) → orange-tinted bar
  - Divider line with subtotal label
  - IVA (21%) → purple-tinted bar
  - Divider line
  - **Total** → full-width bar with brand green border and fill
- Each bar shows the formatted value inside
- Bars animate width on load

**Right panel: Assumptions + Project Inputs**
- Title + description explaining assumptions can be refined in chat
- Assumption tags as pill badges (rounded, surface background, border)
- Project inputs grid (2 columns): Structure, Roof, Finish, Zone, Bedrooms, Bathrooms
- Each input shows label + monospace value

### 6. Nelo Footer — Branding Zone
- N mark SVG (72px, 25% opacity, glow drop-shadow)
- "NELO" wordmark (80px, 12% opacity, wide letter-spacing)
- "AI Construction Cost Estimation" tagline
- "nelo.archi" domain in monospace
- CTA buttons: "Start New Estimate" and "Back to Chat →"
- Subtle radial glow behind the section
- "Powered by Nelo — nelo.archi" strip at very bottom

This section is designed to appear prominently in screenshots — if someone scrolls to the bottom and screenshots, the Nelo brand is front and center.

## Design System

### Dark Mode Override
The estimate page uses a dedicated dark palette, independent of the app's light theme:
- Background: `#08080a`
- Surfaces: `#111113` → `#18181b` → `#222225`
- Text: `#fafafa` (primary) → `#a1a1aa` → `#71717a` → `#3f3f46`
- Borders: `rgba(255,255,255,0.06)`
- All existing Nelo brand colors apply: primary `#ccff00`, on-primary `#000000`

### Typography
- All number/monetary values: `font-mono` (Geist Mono) with `tabular-nums`
- Labels: Geist Sans, uppercase, letter-spacing, small size (10-12px)
- Body text: Geist Sans, 13-14px
- Hero total: Geist Mono, 80-84px, font-weight 800

### Animations
- Respect `prefers-reduced-motion` — all animations disabled when user prefers reduced motion
- Load sequence: topbar → hero (counter + glow) → summary cards → main panels (chart + bars) → bottom panels → footer
- Stagger delay: ~150ms between major sections
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for reveals (ease-out-expo feel)
- Donut segments draw in clockwise with `stroke-dashoffset` animation
- Bar fills animate width from 0
- Glow breathe: continuous 5s cycle on hero background

### Noise Texture
Subtle SVG fractal noise overlay at 2.5% opacity across entire page (premium feel, consistent with modern dark dashboard aesthetics).

## Data Flow

1. Chat produces an estimate via `runEstimate` tool → `Estimate` object stored in conversation messages
2. In-chat `EstimatePreview` component renders compact preview + "View Full Estimate" link
3. Link navigates to `/estimate/[id]` where `[id]` is the conversation ID
4. Page (Server Component) loads the conversation from Supabase, scans messages for the most recent `runEstimate` tool result, and extracts the `Estimate` object. If multiple estimates exist in the conversation, use the last one. If none exist, show a "No estimate found" state with a link back to chat.
5. **Project name:** Derived from the conversation title (stored in `conversations.title`). If the title is auto-generated or empty, falls back to "Construction Estimate". Location is derived from `Estimate.locationZone` mapped to display names (CABA, GBA Norte, etc.).
6. **Project inputs for the Assumptions panel:** The `runEstimate` tool call includes `ProjectInputs` as its input arguments. The Server Component extracts both the tool input (ProjectInputs) and tool output (Estimate) from the same tool call message.
7. Renders `EstimateDashboard` (Client Component) with both `Estimate` data and `ProjectInputs`
8. All chart rendering and animations happen client-side
9. Share URL is simply the page URL — no auth required to view (public by default)

### Category name resolution
The `Estimate.categories` array contains `CategoryTotal` objects with `id` and `name` (Spanish). English names are resolved at render time by joining against `categoriesConfig` (from `src/lib/pricing/categories-config.ts`) using the category `id`. No changes to the `Estimate` type are needed.

### Zero-cost categories
Categories with zero total cost are hidden from both the donut chart and the category breakdown list. The summary card shows the count of non-zero categories (e.g., "22 categories" if 4 have zero cost).

## Route Structure

```
src/app/estimate/[id]/
  page.tsx        — Server Component: load conversation, extract estimate, render dashboard
  estimate-dashboard.tsx  — Client Component: the full interactive dashboard
```

## Component Breakdown

| Component | Type | Purpose |
|-----------|------|---------|
| `EstimateDashboard` | Client | Root dashboard component, orchestrates layout and animations |
| `HeroSection` | Client | Big number with counter animation, confidence bar, metadata |
| `SummaryCards` | Client | 5-card metric strip |
| `DonutChart` | Client | SVG radial chart with interactive segments |
| `CategoryBreakdown` | Client | Scrollable list with animated bars, expandable rows |
| `CostBuildUp` | Client | Waterfall visualization of cost composition |
| `AssumptionsPanel` | Client | Assumption tags + project inputs grid |
| `NeloFooter` | Client | Branding section with N mark, wordmark, CTAs |
| `AnimatedCounter` | Client | Reusable odometer component for number animation |
| `EstimatePreview` | Client | Compact in-chat preview (replaces current CostBreakdown) |

## Interactions

- **Donut hover:** Segment expands, legend item highlights, tooltip shows category name + cost + %
- **Legend hover:** Corresponding donut segment highlights
- **Bar row click:** Expands to show subcategories with their own mini-bars
- **Filter tabs:** Switch between "By Cost" (absolute), "By %" (percentage), "Grouped" (structural/MEP/finishes grouping)
- **Share button:** Copies page URL to clipboard with toast notification
- **Export button:** Future — PDF export (out of scope for MVP, button present but disabled with "Coming soon" tooltip)
- **Back to Chat:** Navigates to `/chat/[id]`

## i18n

All text on the page respects the locale context (EN/ES). Category names display in Spanish with English available on hover. Number formatting uses `Intl.NumberFormat("es-AR")` for ARS values.

## Accessibility

- Donut chart includes `role="img"` with `aria-label` describing the cost distribution
- All interactive elements are keyboard-navigable
- Color is never the only differentiator — bars have rank numbers, chart has legend text
- Animations respect `prefers-reduced-motion`
- Sufficient color contrast on dark background (WCAG AA minimum)

## Dependencies

No new npm dependencies required. Implementation uses:
- SVG for donut chart (no charting library)
- CSS animations + Tailwind for transitions
- `requestAnimationFrame` for counter animation
- Existing design tokens from `globals.css`
- Existing `Estimate` type from `src/lib/estimate/types.ts`

## Out of Scope

- PDF export (button placeholder only)
- Print stylesheet
- Embeddable iframe version
- Historical estimate comparison
- Real-time price updates on the estimate page
