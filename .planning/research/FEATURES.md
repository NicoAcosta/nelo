# ArquiCost — Feature Research: Construction Cost Estimation Products

*Research date: 2026-03-20. Context: 24-hour hackathon, AMBA region, AI chatbot estimator.*

---

## 1. Table Stakes — Must-Have or Users Leave

These are features that every credible construction cost estimator provides. Users trained by RSMeans, ProEst, Clear Estimates, or Handoff AI will expect them and will distrust or abandon an app that lacks them.

### 1.1 Cost Output (the absolute minimum)

| Feature | Why it's required | Competitive evidence |
|---|---|---|
| Price per m2 (or sqft) | Primary mental model for construction buyers; first thing an architect or homeowner asks | Every product from RSMeans to ConstruCalc surfaces this |
| Total project cost | The actual number a budget decision hinges on | Universal across all products |
| Category-by-category breakdown | Validates the total; lets users spot-check or challenge line items | RSMeans: 85k+ unit prices by division. ProEst: 23k+ line items. Clear Estimates: 12k parts |
| Itemized line items within each category | Supports "why does this cost that?" questions | ProEst, RSMeans both expose material + labor + equipment splits |

Without a breakdown, the output is a black box. Users in the construction industry — even consumers — know roughly what structure, finishes, and MEP should cost as a share of total. A single number with no breakdown earns no trust.

### 1.2 Input Collection

| Feature | Why it's required | Notes |
|---|---|---|
| Area (m2) collection | The single most important input; drives 60-70% of all quantities | Without it, no calculation is possible |
| Room/space type identification | Bathrooms and kitchens are cost multipliers (plumbing, tile, fixtures) | Clear Estimates uses templates per space type |
| Basic specification selection | Standard vs. premium finishes changes cost 40-60% | All tools offer quality tiers |
| Transparent assumptions | When data is missing, state the assumed value | Builds trust; users can correct assumptions |

### 1.3 Calculation Integrity

| Feature | Why it's required | Notes |
|---|---|---|
| Localized pricing | National averages are useless; users know local market | Clear Estimates covers 400+ US areas. AMBA needs its own table |
| Quantity derivation from base measurements | Users don't know how many m2 of paint or ml of baseboard they need | The core algorithm: ~14 inputs → ~80 line items |
| Recalculation when inputs change | Real-time updates as the conversation collects more data | Users expect immediate feedback; static outputs feel broken |

### 1.4 What Professional Users (RSMeans / ProEst Users) Expect

Professional estimators (architects, engineers, contractors) using ProEst or RSMeans expect:
- MasterFormat or equivalent category structure (familiar taxonomy)
- Material + labor split per line item
- Ability to override any value
- A result that matches what a quantity surveyor would produce within ±20%

ArquiCost serves this via the 21-category presupuesto de obra structure, which maps directly to Argentine professional conventions. The professional mode (15+ questions) targets this persona.

### 1.5 What Consumer Users (Handoff AI / Clear Estimates Users) Expect

Consumers (homeowners, small developers) expect:
- Fast time-to-estimate (Handoff: "within a minute")
- Plain language — no construction jargon required
- A single "ballpark" number they can use to get a bank loan or decide whether to proceed
- Guidance on what questions to answer, not an empty form to fill

This is the consumer mode (8 questions) persona.

---

## 2. Differentiators — Competitive Advantage

These are features that ArquiCost can use to differentiate from existing products in the Argentine/LatAm market.

### 2.1 AI Chatbot Interface (Conversational Data Collection)

**Competitive gap:** No AI-first conversational estimator exists for the Argentine/LatAm market. DATAOBRA and Foco en Obra are form-based, desktop-era tools.

**Why it matters:** Shifting tedious form-filling into conversation increases completion rates significantly (documented in financial services; same dynamic applies here). Users who don't know construction terminology can describe their project in natural language and let the AI map it to structured fields.

**What makes it good vs. gimmicky:**
- The conversation must have a clear goal state (all required inputs collected)
- Quick-reply buttons / structured options should supplement free text — pure open chat is slow for known-answer questions ("how many floors?" should offer 1/2/3/4+ buttons)
- The AI should explain *why* it's asking each question ("I need the perimeter to calculate wall area")
- Progress should be visible — users get anxious in an unbounded conversation

**Complexity: Medium.** AI SDK tools with Zod schemas handle structured extraction. The hard part is the system prompt design and conversation flow, not the plumbing.

### 2.2 Floor Plan Vision Analysis

**Competitive gap:** Handoff AI accepts "blueprints, photos, videos" but its extraction quality is opaque. No Argentine product does this at all.

**Why it matters:** Eliminates the most tedious part of input collection. A floor plan upload can auto-populate 60-70% of required inputs (area, room counts, door/window counts, perimeter estimate).

**Known limitation:** General LLMs achieve ~12% accuracy on precise measurements. Vision extracts *approximate* values, not survey-grade dimensions. This is a feature, not a bug — the user confirmation flow turns it into a trust-building moment.

**What makes it good vs. gimmicky:**
- Always show extracted values to the user before using them in the calculation
- Frame it as "I found these values — do they look right?" not "I analyzed your floor plan precisely"
- Allow field-by-field correction inline
- If confidence is low on a value, ask rather than assume

**Complexity: Medium-High.** Vision call + extraction prompt + confirmation UI is 3 pieces. The confirmation flow is the most complex UX piece.

### 2.3 Spanish/English Multi-Language Support

**Competitive gap:** RSMeans, ProEst, Clear Estimates, Handoff are English-only. Zero competition in Spanish.

**Why it matters:** Primary persona is an Argentine user. A product in Spanish with Argentine construction terminology (presupuesto de obra, azotea, contrapisos, revoques) immediately signals local expertise.

**What makes it good vs. gimmicky:**
- Spanish must use Argentine conventions (vos, not tú; peso amounts, not dollar amounts)
- Construction terms should be Argentine standard (carpinterias, not ventanas/puertas separately)
- English mode is a differentiator for international architects or consultants comparing options

**Complexity: Low.** Claude is excellent in Spanish. System prompt in Spanish, UI strings in both languages. No translation layer needed — the LLM handles natural language in both.

### 2.4 Real-Time Calculation Updates

**Competitive gap:** Most tools require "submit" and show a static result. ArquiCost can update the estimate live as each conversation turn adds more data.

**Why it matters:** Users see the estimate improving in real time, which makes the conversation feel purposeful and demonstrates how each input affects cost. This is a UX advantage over form-based tools.

**What makes it good vs. gimmicky:**
- Only update when a meaningful new input is collected (not on every message)
- Show a "with current info" qualifier on partial estimates
- Animate the update so users notice the change

**Complexity: Medium.** Requires keeping a running state of collected inputs and re-running the calculation engine whenever that state changes. The engine is deterministic so recalculation is cheap.

### 2.5 Confidence / Accuracy Indicators

**Competitive gap:** Professional tools (InEight, RSMeans) acknowledge estimate classes (ASPE Class 1-5, ranging from ±5% to ±75%) but don't surface this clearly to consumers. No consumer tool shows confidence explicitly.

**Why it matters:** A single number without context is dangerous. An estimate based on only area + room count has ±40% accuracy. An estimate with full measurements + specification choices has ±15%. Users need to know which they're getting. This builds trust and incentivizes completing the conversation.

**What to show:**
- Three tiers: Quick (few inputs, ±40-50%), Standard (most inputs, ±20-25%), Detailed (all inputs, ±10-15%)
- Show which inputs are still missing and how they would affect accuracy
- Label prominently: "This is a conceptual estimate. A professional quantity surveyor will produce a precise figure."

**Complexity: Low.** This is a display feature. Count collected inputs → determine tier → show label + range. No ML needed.

### 2.6 Professional vs. Consumer Modes

**Competitive gap:** Tools are either consumer-simple (Handoff) or professional-complex (RSMeans/ProEst). No product adapts to both within a single session.

**Why it matters:** An architect wants to specify ceiling height, story count, finish quality per room, azotea type, and window sizes. A homeowner wants to say "3-bedroom house, mid-range finishes" and get a number. Forcing the architect through a simplified flow loses precision; forcing the homeowner through 15+ questions loses them.

**What makes it good vs. gimmicky:**
- Mode should be auto-detected or asked once at the start, not buried in settings
- Professional mode unlocks additional question branches, not a completely different app
- Consumer mode uses sensible defaults for all professional inputs (stated explicitly in the output)

**Complexity: Low-Medium.** Implemented as a flag in the system prompt that controls which question branches the AI pursues and how deeply it probes each input.

---

## 3. Anti-Features — Deliberately NOT Building

These are features that look appealing but should be excluded from the hackathon MVP. Each one carries implementation cost that exceeds its value within the 24-hour window.

### 3.1 Real-Time Pricing APIs

**Why it looks good:** Live peso/m2 data from INDEC, UOCRA, or materials suppliers would make the estimate current.

**Why to skip:** API integration, auth, error handling, rate limits, and Argentine API reliability add 4-6 hours of risk for zero UX improvement in a demo. A hardcoded reference table updated at a known date is more honest and more reliable. Build the swap-in seam; don't build the integration.

### 3.2 CAD File Parsing (DXF/DWG)

**Why it looks good:** Architects use DXF/DWG. Supporting them signals professional credibility.

**Why to skip:** Parsing binary CAD formats requires specialized libraries, coordinate transformation, and layer interpretation. This is a full engineering project, not a hackathon feature. Vision analysis of exported images (PNG/JPG/PDF) achieves 80% of the value.

### 3.3 User Accounts and Project Persistence

**Why it looks good:** Saves estimates for later, supports multiple projects, enables email delivery.

**Why to skip:** Auth + database + session management adds 6-8 hours of plumbing. A hackathon demo lives in a single session. Persistence can be added in V2 when the core calculation engine is validated.

### 3.4 Multi-Region Support (Beyond AMBA)

**Why it looks good:** "Latin America" is a bigger market than Buenos Aires.

**Why to skip:** Each region needs its own pricing table, construction norms, and category conventions. AMBA is a well-defined, single-source market. Expanding before the model is validated wastes effort on data problems, not product problems.

### 3.5 3D Visualization / Building Renders

**Why it looks good:** Wow factor in a demo.

**Why to skip:** Zero relationship to cost estimation accuracy. Adds complexity with no feedback signal. Users evaluating an estimator care about number accuracy, not visuals.

### 3.6 Subcontractor / Supplier Integration

**Why it looks good:** "Get quotes from local contractors" closes the loop from estimate to procurement.

**Why to skip:** Requires a supplier directory, quote request flow, and response handling. This is a marketplace product, not an estimator. Scope creep of the highest order.

### 3.7 Historical Project Comparisons / ML Learning

**Why it looks good:** "Learn from past projects to improve accuracy" is a compelling narrative.

**Why to skip:** Requires a dataset of completed Argentine projects with actual costs. That data doesn't exist for V1. The hardcoded AMBA reference table is already the best available data.

### 3.8 Bid Document / Contract Generation

**Why it looks good:** Handoff AI does this; it looks like a complete workflow.

**Why to skip:** Legal document generation in Argentina requires compliance review. Well outside scope for a 24-hour product. The estimate output is the product — stop there.

### 3.9 Mobile App (Native iOS/Android)

**Why it looks good:** Construction professionals work on-site on phones.

**Why to skip:** Next.js is mobile-responsive. A native app build adds platform-specific deployment complexity. The web app running on a phone is sufficient for a hackathon demo.

---

## 4. Feature Complexity Estimates (Hackathon Context)

Estimates assume 4 developers with TypeScript/React experience, AI SDK familiarity, and 24 hours total. Complexity is in dev-hours.

| Feature | Complexity | Hours | Risk |
|---|---|---|---|
| Calculation engine (21 categories, ~80 line items) | High | 6-8h | Medium — math is deterministic but 80 line items need careful testing |
| AI chatbot conversation flow + tools | High | 4-6h | Medium — system prompt iteration is time-consuming |
| Cost breakdown display UI | Medium | 2-3h | Low — table/card layout with totals |
| Consumer / professional mode flag | Low | 1h | Low |
| Price per m2 + total output | Low | 0.5h | Low — derived from engine output |
| Confidence tier indicator | Low | 1h | Low — input count → label |
| Real-time recalculation on input update | Medium | 2h | Low — engine is pure function, re-run on state change |
| Floor plan upload + vision call | Medium | 2-3h | Medium — vision prompt tuning |
| Floor plan confirmation/correction UI | Medium | 2-3h | Medium — inline editing UX |
| Spanish / English language support | Low | 1h | Low — system prompt + UI strings |
| Hardcoded AMBA pricing table | Low | 1-2h | Low — data entry, not engineering |
| PDF export (nice-to-have) | Medium | 2-3h | Low — react-pdf or browser print |
| **Total (core)** | | **~20-24h** | |

Note: Core = chatbot + engine + breakdown display + mode + confidence + basic floor plan. PDF export is stretch.

---

## 5. Feature Dependencies

```
AMBA pricing table
    └── Calculation engine
            ├── Price per m2 output
            ├── Total price output
            ├── Category breakdown display
            ├── Real-time recalculation
            └── Confidence tier indicator

AI chatbot (conversation flow + AI SDK tools)
    ├── Consumer / professional mode
    ├── Structured input state (Zod schemas)
    │       ├── Calculation engine (feeds into)
    │       └── Confidence tier indicator (input completeness check)
    └── Floor plan vision call
            └── Floor plan confirmation/correction UI
                    └── Structured input state (merges extracted values)

Calculation engine
    └── PDF export (renders engine output)
```

### Critical Path

The calculation engine is the hardest dependency. Everything else is presentation or input collection. If the engine isn't working, there is nothing to show.

**Recommended build order:**
1. AMBA pricing table + calculation engine (testable in isolation, no UI needed)
2. Hardcode a single example input → verify engine outputs correct breakdown
3. AI chatbot conversation flow with tools (collects structured inputs)
4. Cost breakdown display UI (connects engine output to screen)
5. Confidence tier indicator (trivial once input state exists)
6. Consumer/professional mode (single flag in system prompt)
7. Real-time recalculation (connect state changes to engine re-run)
8. Floor plan upload + vision call (parallel track if bandwidth allows)
9. Floor plan confirmation UI (depends on vision call)
10. PDF export (if time remains)

### Risk Notes

- **Engine risk:** The 21-category structure requires quantity derivation formulas (e.g., wall area = perimeter × height × stories − openings). These must be correct or all outputs are wrong. Prioritize unit tests on the engine.
- **Vision risk:** Floor plan extraction quality is unpredictable. Build the manual input path first; treat vision as an enhancement, not a dependency.
- **Conversation flow risk:** Getting the AI to reliably call the right tools in the right order requires prompt iteration. Budget time for this; it cannot be rushed.

---

## 6. Summary: What Wins the Hackathon

The combination of features that no competitor offers in the Argentine market, and that can be built in 24 hours:

1. **Conversational input collection** — zero-friction, no form, no jargon
2. **21-category Argentine presupuesto de obra output** — domain-specific, professional-grade
3. **Floor plan upload → auto-populate inputs** — the demo moment
4. **Confidence indicator** — honest about uncertainty, builds trust
5. **Spanish-first** — speaks the user's language, literally

The engine + conversation + breakdown display is the irreducible core. Everything else is a multiplier.

---

*Sources consulted: RSMeans Data Online, ProEst (Autodesk), Clear Estimates, Handoff AI (YC), DATAOBRA, Foco en Obra, iBeam AI, InEight Estimate, Zebel conceptual estimating, NN/G chatbot UX research, ASPE estimate classification standards.*
