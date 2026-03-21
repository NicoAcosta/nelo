# Phase 3: Chat UI Shell

## Status: Complete

## One Liner
Built the full frontend with dark-mode design system from Stitch "nelo v2" designs — landing page, chat page with useChat, shared layout components, 24 component tests.

## What Was Built

### Design System
- `src/app/globals.css` — Full token system: surface hierarchy (6 levels), primary/secondary/tertiary colors, glass effects, blueprint grid, ghost borders, gradient-primary
- `src/app/layout.tsx` — Spanish lang, metadata, font setup
- Fonts: Space Grotesk (headlines), Inter (body) via Google Fonts

### Components (6 files, all tested)
- `src/components/sidebar.tsx` — Desktop sidebar with nav items, active state, branding
- `src/components/header.tsx` — Glass header with brand + "Nueva Estimación" CTA
- `src/components/mobile-nav.tsx` — Bottom tab bar for mobile
- `src/components/chat-message.tsx` — Dual-style messages (glass-card for assistant, gradient-primary for user)
- `src/components/chat-input.tsx` — Textarea with attach/send buttons, keyboard submit, disabled states
- `src/components/prompt-card.tsx` — Quick-start prompt buttons with icons
- `src/components/icons.tsx` — 15 SVG icon components (no Material Symbols dependency)

### Pages
- `src/app/page.tsx` — Landing with hero, prompt cards grid, chat input, routes to /chat
- `src/app/chat/page.tsx` — Chat with useChat (AI SDK v6 transport pattern), streaming indicator, auto-scroll, initial query from URL params

### Tests
- 6 test files, 24 tests covering: Sidebar, Header, MobileNav, ChatMessage, ChatInput, PromptCard
- All rendering, interaction, accessibility, and responsive behavior tested

## Success Criteria Met
1. ✅ Chat page renders message thread and input with no console errors
2. ✅ useChat sends POST to /api/chat with DefaultChatTransport (AI SDK v6 pattern)
3. ✅ UI is functional on mobile viewport (responsive layout with MobileNav)
4. ✅ Design matches Stitch "nelo v2" dark theme (verified via Playwright screenshots)

## Test Results
- 10 test files, 62 tests total (38 backend + 24 frontend), all passing
- Build passes (next build clean with Turbopack)

## Design Reference
Stitch project "nelo v2" (ID: 16019953234318479213), dark mode, construction orange #F59E0B
