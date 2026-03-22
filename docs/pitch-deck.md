# Nelo — Pitch Deck

## Part 1: Project Description

### What is Nelo?

Nelo is an AI-powered construction cost estimator for Buenos Aires (AMBA region). Instead of spending weeks calling architects, researching prices, and filling spreadsheets, users describe their project through a conversation with an AI assistant and get a detailed cost breakdown in minutes.

Nelo handles two critical stages of construction estimation:

1. **Early-stage ballpark** — "How much would it roughly cost to build a 100m2 house?" Even this simple question traditionally requires calling around, waiting days, and sometimes paying for a preliminary study. Clients need this number before they can decide to move forward at all.

2. **Detailed budget** — Getting real numbers involves multiple people: suppliers, subcontractors, price research, spreadsheets. It consumes weeks of an architect's time on every single project. Nelo automates this with a 26-category calculation engine using real Argentine market data.

### Who is it for?

- **Consumers** who want to know what their construction project will cost before committing — without dealing with opaque pricing, confusing terminology, or weeks of waiting.
- **Architects and engineers** who spend hours on repetitive estimation work and want a fast first pass they can refine.

### How it works

1. **Chat** — Describe your project in natural language. Nelo asks smart follow-up questions about structure type, finishes, zone, and fills gaps with reasonable defaults.
2. **Upload** — Drop your floor plan (image, PDF, DXF, or DWG). AI vision extracts rooms, dimensions, doors, and windows — then asks you to confirm before calculating.
3. **Estimate** — Get a 26-category cost breakdown with price per m2, total price in ARS and USD (blue rate), confidence level, and transparent assumptions.

### What makes it real

- **400+ line items** across 26 Argentine construction budget categories (the same structure architects actually use).
- **Real pricing data**: UOCRA labor rates, MercadoLibre material costs, blue-rate USD conversion, inflation-adjusted via INDEC ICC index. Updated daily.
- **Document processing**: Accepts images, PDFs, DXF, and DWG files. Extracts structured data and renders visual previews for AI vision analysis.
- **Bilingual**: English and Spanish, auto-detected from browser with manual toggle.
- **Built by an architect** who uses this kind of estimate in his daily work.

### The team

- **Juan Cruz Feres** — Architect. Spent the last year dealing with this exact problem. Knows the 26-category budget because he uses it daily.
- **Sebastian Maldonado** — Designer. Responsible for the product design and visual identity.
- **Nicolas Acosta** — Software Engineer. Built the AI pipeline, calculation engine, document processing, and infrastructure.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| AI | Claude via AI Gateway, AI SDK v6, vision analysis |
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Validation | Zod v4 |
| Documents | DXF parser, DWG-to-DXF converter (WASM), PDF.js |
| Pricing | UOCRA, MercadoLibre, DolarAPI, INDEC ICC |
| Deployment | Vercel |

### Validation

- Juan Cruz has personally dealt with this problem for the past year as a practicing architect.
- Conversations with other architects confirmed strong interest — there is already a waitlist of professionals who want to try it.
- The problem is universal across the Argentine construction industry and likely beyond.

---

## Part 2: Pitch Structure

### Format

- 3-minute video pitch
- General hackathon with AI track
- Judges value real, practical AI use cases
- English language
- Mix of slides and embedded demo clips

### Slide-by-Slide Breakdown

---

#### Slide 1: The Problem
**Duration:** 25 seconds

**Title:** Getting a construction estimate shouldn't take weeks

**Layout:** Dark background. Large contrasting stat in the center. Minimal text.

**Content on slide:**
- Large text: **"2-3 weeks and $500+"**
- Subtitle: "That's what it takes to get a construction cost estimate in Argentina"
- Two bullet points below:
  - Early stage: Even a ballpark costs days of calls and waiting
  - Detailed stage: Weeks of research, suppliers, spreadsheets — for every project

**Visual direction:** Clean, stark. The stat should hit hard. Consider a simple before/after: "2-3 weeks → 5 minutes" with the left side crossed out or faded.

---

#### Slide 2: Meet Nelo
**Duration:** 15 seconds

**Title:** Meet Nelo — your AI construction estimator

**Layout:** Product screenshot taking up most of the slide. Tagline above or below.

**Content on slide:**
- Tagline: "Describe your project. Upload your plan. Get a detailed estimate in minutes."
- Screenshot of the Nelo landing page ("HI, I'M NELO.")

**Visual direction:** Let the product speak. The green-on-black landing page is visually distinctive. Full-width screenshot with the tagline overlaid or adjacent.

---

#### Slide 3: How It Works
**Duration:** 20 seconds

**Title:** Chat. Upload. Estimate.

**Layout:** Three columns, each with a small screenshot/icon and 1-2 lines of text.

**Content on slide:**

| Column 1 | Column 2 | Column 3 |
|-----------|----------|----------|
| **Chat** | **Upload** | **Estimate** |
| Describe your project naturally. Nelo asks the right questions. | Drop a floor plan (image, PDF, CAD). AI extracts rooms, dimensions, doors. | 26-category cost breakdown. Price/m2 in ARS and USD. Confidence level. |

**Visual direction:** Three app screenshots cropped to show (1) the chat with option buttons, (2) a floor plan being analyzed, (3) the cost breakdown component. Consistent sizing, subtle borders.

---

#### Slide 4: Demo
**Duration:** 60-70 seconds

**Layout:** Full-screen app recording. No slide overlay — just the product.

**Demo script:**

| Timestamp | What to show | What to say |
|-----------|-------------|-------------|
| 0:00-0:10 | Landing page. Click "How much does it cost to build a 100m2 house?" | "Let's see it in action. We'll start from the landing page with a simple question." |
| 0:10-0:25 | Chat opens. Nelo asks about structure type. User clicks "Reinforced concrete." Nelo asks about finishes. User clicks "Standard." | "Nelo asks the right questions one at a time — structure, finishes, location. No forms, no jargon." |
| 0:25-0:35 | User drags and drops a floor plan image/PDF. Upload indicator appears. | "Now we upload a real floor plan. Nelo accepts images, PDFs, and even CAD files." |
| 0:35-0:45 | AI analyzes the floor plan. Extracted data appears — rooms, area, door/window counts. | "AI vision analyzes the plan — it identifies rooms, counts doors and windows, and estimates dimensions. Then it asks you to confirm." |
| 0:45-1:00 | Cost breakdown renders. Zoom in on total price, price/m2, category table, confidence bar. | "And here's the result — a full 26-category cost breakdown. Total price in pesos and dollars. Price per square meter. Every assumption is transparent." |
| 1:00-1:05 | Toggle language to Spanish. UI switches. | "And it works in both English and Spanish." |

**Recording tips:**
- Use quick-start prompts — don't type live
- Speed up AI streaming in post-production (1.5-2x)
- Clean browser: no bookmarks bar, no other tabs, 1920x1080
- Add subtle zoom on key moments (total price, floor plan analysis)
- Consider a subtle annotation/callout on the confidence indicator

---

#### Slide 5: AI Innovation
**Duration:** 25 seconds

**Title:** AI that actually saves professionals time

**Layout:** Three rows or three panels, each with a bold label and one sentence. No paragraphs.

**Content on slide:**

| Capability | Description |
|-----------|------------|
| **Conversational reasoning** | Collects data through dialogue. Fills gaps with smart defaults. Shows what it assumed. |
| **Vision understanding** | Reads floor plans in any format. Extracts rooms, dimensions, openings. Asks to confirm. |
| **Domain-expert computation** | 400+ line items. 26 categories. Real Argentine pricing. Daily-updated data sources. |

**Visual direction:** Could use icons for each row (chat bubble, eye, calculator). Keep it scannable — judges should get this in 3 seconds of looking at the slide.

---

#### Slide 6: The Team
**Duration:** 10 seconds

**Title:** Built by people who know the problem

**Layout:** Three headshots/avatars in a row with name, role, and one line underneath each.

**Content on slide:**

| Juan Cruz Feres | Sebastian Maldonado | Nicolas Acosta |
|----------------|--------------------|--------------------|
| Architect | Designer | Software Engineer |
| Uses this budget structure daily. Built Nelo to solve his own problem. | Made it look like a product, not a hackathon project. | Built the AI pipeline, engine, and document processing. |

**Visual direction:** Professional photos or clean avatars. Consistent framing. The architect being first (leftmost) is intentional — he's the domain credibility.

---

#### Slide 7: Traction & Close
**Duration:** 20 seconds

**Title:** Already validated

**Layout:** Left side: three bullet points. Right side: large QR code or URL.

**Content on slide:**
- **Built from real pain** — Our architect co-founder has spent his career dealing with this problem
- **Waitlist ready** — Architects we've talked to want to use it
- **Shipped in 24h** — Full estimation engine, vision analysis, bilingual UI, real pricing data

Right side: QR code to try it live, or the app URL.

**Visual direction:** The QR code should be large enough to scan from a projector. URL in text underneath as fallback.

---

### Timing Budget

| Slide | Section | Duration |
|-------|---------|----------|
| 1 | The Problem | 0:25 |
| 2 | Meet Nelo | 0:15 |
| 3 | How It Works | 0:20 |
| 4 | Demo | 1:05 |
| 5 | AI Innovation | 0:25 |
| 6 | Team | 0:10 |
| 7 | Traction + Close | 0:20 |
| | **Total** | **3:00** |

---

## Part 3: Full Narration Script

*Total runtime: ~3 minutes. Read at a natural pace — not rushed, not slow. Each section is timed.*

---

### [SLIDE 1 — THE PROBLEM] (0:00 - 0:25)

> You want to build a house in Buenos Aires. Step one: find out how much it's going to cost.
>
> So you call architects. You wait days. Maybe weeks. And when someone finally gets back to you, they charge five hundred dollars or more — just for the estimate. Not the construction. The estimate.
>
> And if you're the architect? You're spending weeks on every project — calling suppliers, researching prices, filling spreadsheets. The same repetitive work, over and over.
>
> Our co-founder Juan Cruz is an architect. He has spent his career dealing with this exact problem. So we built the solution.

---

### [SLIDE 2 — MEET NELO] (0:25 - 0:40)

> This is Nelo — an AI construction cost estimator.
>
> Describe your project, upload your floor plan, and get a detailed cost breakdown in minutes instead of weeks. Built by architects, for architects.

---

### [SLIDE 3 — HOW IT WORKS] (0:40 - 1:00)

> It works in three steps.
>
> First, you chat. Describe your project in plain language — Nelo asks the right follow-up questions. Structure type, finishes, location.
>
> Second, you upload. Drop a floor plan — an image, a PDF, even a CAD file. AI vision extracts the rooms, dimensions, doors, and windows automatically.
>
> Third, you get your estimate. A full 26-category cost breakdown with price per square meter in pesos and dollars, and a confidence level based on how much data Nelo has.
>
> Let me show you.

---

### [SLIDE 4 — DEMO] (1:00 - 2:05)

> *[Screen recording starts — landing page]*
>
> We start on the landing page. I'll click this quick prompt — "How much does it cost to build a 100 square meter house?"
>
> *[Chat opens, Nelo responds with first question]*
>
> Nelo asks about the structure type — I'll pick reinforced concrete. Now it asks about the finish level — I'll go with standard. One question at a time, no forms, no construction jargon.
>
> *[User uploads a floor plan]*
>
> Now I'll upload a real floor plan.
>
> *[AI vision analysis appears]*
>
> Watch this — AI vision analyzes the plan. It identifies the rooms, counts the doors and windows, estimates dimensions. And then it asks me to confirm before it calculates — so you always stay in control.
>
> *[Cost breakdown renders]*
>
> And here's the result. A full cost breakdown — 26 categories, from structural work to electrical and plumbing. Total price in pesos and dollars. Price per square meter. And every assumption is shown transparently — ceiling height, door count, everything Nelo filled in automatically.
>
> *[Toggle to Spanish]*
>
> And it works in both English and Spanish.

---

### [SLIDE 5 — AI INNOVATION] (2:05 - 2:30)

> This isn't a ChatGPT wrapper. Three things make Nelo a real AI use case.
>
> First — conversational reasoning. Nelo doesn't throw a form at you. It collects data through dialogue, fills gaps with smart defaults, and tells you exactly what it assumed.
>
> Second — vision understanding. Upload a floor plan in any format and AI extracts the layout. Rooms, doors, windows, dimensions.
>
> Third — domain-expert computation. Over four hundred line items across twenty-six construction categories, with real Argentine pricing — labor rates, material costs, inflation-adjusted, updated daily. This is the same budget structure architects actually use.

---

### [SLIDE 6 — THE TEAM] (2:30 - 2:40)

> We're three people who know this problem.
>
> Juan Cruz is an architect — he uses this type of estimate every day. Sebastian is our designer — he made it look and feel like a real product. And I'm Nico, the engineer — I built the AI pipeline, the calculation engine, and the document processing.

---

### [SLIDE 7 — TRACTION & CLOSE] (2:40 - 3:00)

> Nelo isn't a hackathon idea. Juan Cruz has spent his career burning time on estimates — this is the tool he needed.
>
> We've already talked to other architects. They want to use it. We have a waitlist of professionals ready to try it the moment we open access.
>
> We shipped this in twenty-four hours — a working AI estimator with vision analysis, a twenty-six-category engine, bilingual UI, and real pricing data from the Argentine market.
>
> Construction cost transparency for everyone — not just those who can afford an architect.
>
> Try it live.
>
> *[QR code / URL on screen]*

---

## Appendix: Production Notes

### Video recording checklist

- [ ] Clean browser: no bookmarks bar, no extensions visible, no other tabs
- [ ] Resolution: 1920x1080
- [ ] Pre-seed a floor plan file on the desktop for easy drag-and-drop
- [ ] Test the full demo flow once before recording
- [ ] Have a backup floor plan that produces good results
- [ ] Record narration and screen separately if possible (cleaner audio)

### Post-production

- [ ] Speed up AI streaming to 1.5-2x (keeps energy up)
- [ ] Add subtle zoom on: total price appearing, floor plan analysis, confidence bar
- [ ] Optional: subtle background music (low volume, upbeat, no lyrics)
- [ ] Add team slide transitions (quick fade or cut, not slow dissolves)
- [ ] Final duration check: must be under 3:00

### Slide design guidelines

- Dark theme to match the app's aesthetic (black background, white text, #ccff00 accent)
- Font: Geist Sans (matches the app), or a clean sans-serif alternative
- Minimal text per slide — the narration carries the story
- Screenshots should be high-res crops from the actual app, not mockups
- QR code on final slide should be at least 200x200px for scanability
