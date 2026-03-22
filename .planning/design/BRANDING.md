# Nelo Brand Guidelines

## Name

**NELO** — named after founder Juan Cruz's nickname "Nelo." Uppercase in UI and branding to match the app's bold typographic style. Use "Nelo" (title case) in prose and documentation.

## Logo

### N Mark

A bold, geometric letter "N" — two vertical bars connected by a diagonal, evoking architectural walls meeting at a corner. Solid filled shape (not stroke-based).

- SVG path: `M3 2h6v10l6-10h6v20h-6V12L9 22H3z` (24x24 viewBox)
- Filled with `currentColor`, no stroke
- Scales cleanly from 16px (favicon) to 120px (marketing)
- Generated reference image available — the SVG is a simplified version for UI use

### Wordmark

- Text: "NELO" (uppercase)
- Font: Geist Sans, weight 900 (black)
- Tracking: tight
- Matches the app's bold uppercase typographic style

### Combined Logo

N mark + "NELO" wordmark side by side. Used in headers and sidebars.

### Standalone Uses

- **N mark alone**: Chat avatars, favicons, loading spinners, app icons
- **Wordmark alone**: Not recommended — always pair with the N mark

## Color

| Element | Light background | Dark background |
|---------|-----------------|-----------------|
| N mark | `#ccff00` (primary) | `#ccff00` (primary) |
| Wordmark | `#333333` (on-surface) | `#f2f2f2` (on-surface) |
| Favicon bg | `#000000` circle | — |

Rules:
- Never render the N mark in gray — always primary green (`#ccff00`) or white
- Never place the logo on a background that doesn't provide sufficient contrast
- The fluorescent green is the signature — it differentiates Nelo from typical blue/gray construction tools

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headlines | Geist Sans | 900 (black) | Page titles, section headers, uppercase |
| Body | Geist Sans | 400-500 | Paragraphs, descriptions, chat messages |
| Labels | Geist Sans | 700-800 (bold/extra-bold) | Navigation, buttons, tags, uppercase |
| Numbers | Geist Mono | 500-700 | Prices, percentages, m2, table data |
| Wordmark | Geist Sans | 800 (extra-bold) | Logo only, lowercase |

### UI Style

- Headlines: `uppercase`, `font-black`, `tracking-tight`
- Labels: `uppercase`, `font-bold`, `tracking-wider`, often `text-[10px]`
- Logo wordmark: `lowercase`, `font-extrabold`, `tracking-tighter`

## Favicon

The N mark in `#ccff00` centered on a `#000000` circle. 32x32px. Matches the chat avatar pattern used throughout the app.

## Do / Don't

### Do
- Use the combined logo (mark + wordmark) in headers and navigation
- Use the N mark alone for compact contexts (avatars, favicons, mobile nav)
- Keep the N mark in primary green or white only
- Maintain the lowercase wordmark style

### Don't
- Stretch, rotate, or skew the N mark
- Recolor the N mark outside the defined palette (no gray, no arbitrary colors)
- Write "nelo" in lowercase in the UI (brand name is always uppercase NELO)
- Use the old stacked-layers icon (deprecated)
- Add drop shadows, glows, or gradients to the logo

## Origin

The name "Nelo" comes from Juan Cruz, one of the founders. It's a personal touch that makes the AI estimator feel approachable — like getting help from someone you know, not a faceless tool.
