# Nelo Design Tokens (from Stitch export)

## Colors
- Primary: `#ccff00` / `#E2FF00` / `#DFFF00` (Fluorescent Yellow)
- On Primary: `#000000`
- Background Light: `#F5F5F5` / `#F2F2F2`
- Surface Light: `#FFFFFF`
- Background Dark: `#121212`
- Surface Dark: `#1a1a1a`
- On Surface: `#333333` (light) / `#f2f2f2` (dark)
- Outline: `#CCCCCC` / `#4d4d4d` (dark)
- Secondary: `#333333` / `#999999` (dark)

## Typography
- Font: Helvetica, Arial, sans-serif
- Style: Bold/Black, UPPERCASE, wide tracking
- Headlines: font-black, tracking-tight/tighter
- Labels: text-[10px], font-black, uppercase, tracking-[0.2em]
- Body: font-medium/bold, text-sm/lg

## Effects
- Glass: `backdrop-filter: blur(12px); background: rgba(204,204,204,0.15); border: 1px solid rgba(204,204,204,0.3)`
- Glass Primary: `background: rgba(204,255,0,0.85)`
- Dark Glass: `background: rgba(43,43,43,0.6); backdrop-filter: blur(20px)`
- Grid background: radial-gradient dots or SVG grid pattern

## Border Radius
- Default: 0.5rem
- Cards: rounded-2xl / rounded-3xl
- Buttons: rounded-lg / rounded-full (pills)
- Inputs: rounded-2xl

## Screens
1. Landing (light) — sidebar + hero + suggestion bento grid + chat input
2. Chat (light) — sidebar + conversation + right stats panel + inline option cards
3. Estimate (dark) — full breakdown table + confidence bar + assumptions bar
4. Floor Plan (light) — blueprint with AI overlay + editable values form

## Key Patterns
- AI messages: glass-effect rounded-2xl with robot icon
- User messages: glass-primary (fluo yellow) with person icon
- Option cards: white/60 bg, hover:bg-primary transition
- Assumption badges: dark cards with primary icon + EDIT button
- Category breakdown: table with incidence % progress bars
- Mobile: bottom nav bar (md:hidden)
