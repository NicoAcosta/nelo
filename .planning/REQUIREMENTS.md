# Requirements: ArquiCost

**Defined:** 2026-03-20
**Core Value:** Accurate, transparent construction cost estimation through natural conversation — the user gets a detailed price breakdown they can trust.

## v1 Requirements

### Chat & Data Collection

- [ ] **CHAT-01**: User can describe their construction project through natural conversation with an AI chatbot
- [ ] **CHAT-02**: Chatbot identifies user type (consumer vs professional) and adapts question depth accordingly
- [ ] **CHAT-03**: Chatbot collects structured data via AI SDK tools with Zod-validated schemas
- [ ] **CHAT-04**: Express mode: chatbot asks 5-8 key questions (area, stories, structure type, roof type, finish level, location zone) and produces a quick estimate
- [ ] **CHAT-05**: Chatbot presents transparent assumptions when data is missing (e.g., "I'm assuming 2.60m ceiling height")
- [ ] **CHAT-06**: User can correct any assumed or extracted value through conversation
- [ ] **CHAT-07**: System prompt is dynamically built from categories config so LLM always knows what to ask

### Floor Plan Analysis

- [ ] **PLAN-01**: User can upload floor plan images (PNG, JPG, PDF) as chat attachments
- [ ] **PLAN-02**: AI vision model analyzes floor plan and extracts approximate data: room count, room types, estimated total area, door count, window count
- [ ] **PLAN-03**: Chatbot presents extracted data to user for confirmation/correction before using it in calculations
- [ ] **PLAN-04**: Extracted floor plan data merges with conversational inputs to feed the calculation engine

### Calculation Engine

- [ ] **CALC-01**: Engine accepts structured project inputs and outputs price/m² and total price
- [ ] **CALC-02**: Engine uses coefficient-based quantity derivation (e.g., plaster m² = 2.5 × floor area) calibrated for Argentine construction
- [ ] **CALC-03**: Engine applies conditional logic / exclusion tree (e.g., steel frame disables concrete structure items)
- [ ] **CALC-04**: Engine computes full cost structure: direct cost → overhead (8-12%) → profit (10-15%) → IVA (21%) → final price
- [ ] **CALC-05**: Engine outputs 26-category cost breakdown with incidence percentages
- [ ] **CALC-06**: Engine calculates confidence level (quick ±40-50% / standard ±20-25% / detailed ±10-15%) based on number of inputs collected
- [ ] **CALC-07**: Engine is a pure TypeScript module with no side effects, fully unit-testable

### Pricing Data

- [ ] **DATA-01**: Pricing data structured as typed TypeScript config with material cost, labor cost, and total cost per unit for each line item
- [ ] **DATA-02**: AMBA region pricing reference table with real market data (sources: CAC/ICC index, UOCRA labor rates, market research)
- [ ] **DATA-03**: Price update mechanism: `price_updated = price_base × (ICC_current / ICC_base)` with last-updated date
- [ ] **DATA-04**: Categories config file serves as single source of truth for both calculation engine AND chatbot system prompt

### Infrastructure

- [ ] **INFRA-01**: Next.js 16 App Router project deployed on Vercel
- [ ] **INFRA-02**: AI SDK v6 with Claude Sonnet via AI Gateway (OIDC auth)
- [ ] **INFRA-03**: Shared TypeScript types defined in first 2 hours, all modules import from types.ts
- [ ] **INFRA-04**: Deploy to Vercel at hour 2 (before features) to verify pipeline works

## v2 Requirements

### Detailed Mode
- **DET-01**: Full 56-question questionnaire flow from cotizador design
- **DET-02**: Conditional question branching (e.g., "Do you have a basement?" → enables vertical waterproofing questions)
- **DET-03**: Material + labor cost split per line item

### Professional Mode
- **PRO-01**: CAD file upload (DXF/DWG) with accurate dimension extraction
- **PRO-02**: Professional can override any calculated quantity or unit price
- **PRO-03**: Export estimate as professional presupuesto de obra document (PDF)

### Data & Pricing
- **DPRC-01**: Automated monthly price updates via CAC/ICC index scraping
- **DPRC-02**: Regional pricing for all Argentine provinces (not just AMBA)
- **DPRC-03**: Historical price trend visualization

### Features
- **FEAT-01**: User accounts with saved estimates
- **FEAT-02**: Shareable estimate URLs
- **FEAT-03**: Comparison between estimate versions
- **FEAT-04**: Multi-language (Spanish + English)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time material pricing APIs | No reliable Argentine API exists; hardcoded data for MVP |
| CAD/DXF/DWG file parsing | Too complex for 24h; vision-only for hackathon |
| 3D visualization | Not needed for cost estimation |
| User accounts / authentication | In-memory sessions sufficient for MVP |
| Native mobile app | Web-first, responsive design handles mobile |
| Subcontractor marketplace integration | Separate product, not estimation |
| ML model trained on historical estimates | No training data yet |
| Bid document generation | Professional feature, defer to v2+ |
| Database persistence | In-memory for hackathon; add Neon/Postgres later |
| Multi-region beyond AMBA | Single region for MVP, architecture supports expansion |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| *(populated during roadmap creation)* | | |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 22

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
