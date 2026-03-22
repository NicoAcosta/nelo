# Pitch Deck Research

Best practices for general presentations, hackathon pitches, and winning examples. Synthesized from analysis of YC Demo Day patterns, Sequoia/Kawasaki frameworks, TechCrunch teardowns, ConTech pitch data, and winning hackathon presentations.

---

## 1. General Pitch Best Practices

### Frameworks

**Guy Kawasaki 10/20/30 Rule**
- 10 slides, 20 minutes, 30pt minimum font
- Most widely cited. Forces ruthless prioritization.

**Sequoia Capital Template** (gold standard for investors)
1. Company purpose (one sentence)
2. Problem
3. Solution
4. Why now
5. Market size
6. Product (demo/screenshots)
7. Business model
8. Competition
9. Team
10. Traction
11. Financials
12. The ask

**YC Demo Day 8-Line Pitch** (study of 87 YC pitches)
1. Proof/Traction — lead with your strongest number
2. What you do — 8 words or fewer with a benefit
3. The problem — specific, quantified
4. Why now — what changed
5. Your solution — with a concrete metric
6. Team — why you
7. Vision — narrow to wide

67% of winners use "Numbers-First" ordering. If you have traction, lead with it.

**WHAC Method** (Brant Pinvidic's "3-Minute Rule")
1. **W**hat is it?
2. **H**ow does it work?
3. **A**re you sure? (proof/validation)
4. **C**an you do it? (team/capability)

Optimal for short pitches. 3 minutes = ~400 words = ~27 sentences. Overrunning is the single biggest failure signal.

**Pixar Pitch** (Daniel Pink)
- "Once upon a time there was ___."
- "Every day, ___."
- "One day ___."
- "Because of that, ___."
- "Until finally ___."

Maps to: Status quo, Problem, Solution, Impact, Vision.

### Storytelling

**The "Man in a Hole" emotional arc** (Kurt Vonnegut): Start relatable, drop into the problem (the hole), rise through the solution, end higher than you started. The most successful pitch decks follow this shape.

**The customer is the hero, not your company.** Your product is the magic sword. You are the guide (Gandalf, not Frodo). From Donald Miller's StoryBrand framework.

**Concrete > abstract.** "Maria wants to build a house in Buenos Aires. She calls three architects. Two never respond." beats "The construction estimation market is fragmented."

### Design Rules

| Rule | Details |
|------|---------|
| Font size | 24pt minimum body, 36-44pt titles. Kawasaki says 30pt. |
| Font choice | One family, two weights max. Sans-serif (Geist, Helvetica, DM Sans). |
| Colors | 3-5 color palette. One primary, one accent, neutrals. |
| Whitespace | The #1 amateur mistake is overcrowding. One idea per slide. |
| Images | Full-bleed photos > small insets. Real screenshots > mockups > stock. |
| Charts | Annotate the takeaway directly on the chart. Remove gridlines, 3D, gradient fills. |
| Transitions | Simple cuts or fades only. No flying text or spinning transitions. |

**The squint test:** Squint at your slide. Can you still identify the main point? If not, simplify.

**Headlines, not headers:** Slide titles should be statements, not category labels. "Getting a construction estimate shouldn't take weeks" not "The Problem."

### Data Presentation

- **One number per slide** when possible. Make it huge (72pt+).
- **Bottom-up market sizing** ("X architects in AMBA, Y estimates/year at $Z each") beats top-down ("$1.3T construction industry").
- **Never say "we just need 1% of the market."** Most cliched and least convincing argument.
- **Traction metrics:** highlight the growth rate, not just the absolute number.
- **Before/after comparisons** are the most memorable format for value propositions.

### Opening and Closing

**Strong openings:**
1. Surprising statistic — "Every year, $X is wasted on..."
2. Personal story — "Two years ago, I tried to..."
3. Provocative question — "What if you could..."
4. Bold claim — "We've built the first X that actually..."
5. Customer quote — social proof from moment one

**Strong closings:**
1. Vision callback — return to the opening story, show transformation
2. Crisp ask — exactly what you want
3. Memorable one-liner — the last thing they remember
4. Never end with "Questions?" — end with your statement, then invite questions

**Weak openings to avoid:** "Hi, my name is...", "Let me start by thanking...", "Can everyone hear me?"

### Q&A

- Build an appendix deck (10-20 extra slides) for deep dives
- Anticipate top 10 questions. Rehearse 30-60 second answers.
- "I don't know, but here's how I'd find out" > making something up
- Keep answers to 30-60 seconds. They'll follow up if they want more.

### Timing

- 5 min pitch: 8-10 slides
- 10 min pitch: 12-15 slides
- 1-2 minutes per slide for live pitch
- Spend the most time on: demo, traction, differentiation
- Speed through: team (unless it's the killer feature), market size, competition

---

## 2. Hackathon-Specific Practices

### How Hackathon Pitches Differ

| Dimension | Startup Pitch | Hackathon Pitch |
|-----------|--------------|-----------------|
| Time | 5-15 min | 2-5 min |
| Focus | Market, traction, revenue | Problem, solution, execution, demo |
| Audience | Investors (business) | Judges (often engineers, sponsors) |
| TAM/SAM/SOM | Expected | Skip entirely |
| Revenue model | Critical | Mention briefly or skip |
| Demo | Optional | Non-negotiable |
| Technical depth | Light | Expected and rewarded |

**Key insight:** Hackathon judges have seen 20+ pitches. They're tired. Your job is to be memorable and crisp, not comprehensive.

### Judging Criteria (common across MLH, HackMIT, DevPost, Vercel events)

1. **Innovation / Creativity** (25-30%) — Novel approach?
2. **Technical Execution** (25-30%) — Does it work? How much did you build?
3. **Impact / Usefulness** (20-25%) — Real problem, real people?
4. **Presentation / Demo** (15-20%) — Clear, engaging, did the demo work?
5. **Completeness** (10%) — Product or science experiment?

### Recommended Structure: "Hook-Problem-Demo-Tech-Impact"

| Section | Duration | Content |
|---------|----------|---------|
| Hook | 0:30 | Concrete, relatable scenario |
| Problem | 0:30 | Who, why existing solutions fail, specific pain |
| Demo | 2:00 | Show, don't tell. The core of the pitch. |
| Tech depth | 0:45 | Architecture (one slide), clever decisions, challenges overcome |
| Impact + Next | 0:45 | Who benefits, 2-3 next steps, memorable close |

### Demo Best Practices

**Hybrid approach recommended:** Record a backup video, but present live as primary plan.

- Pre-load the demo environment. Never type a URL live.
- Script a "golden path" — know exactly what you'll type and click.
- Pre-test AI prompts 10+ times for consistent quality.
- Increase font/browser size to 150%+ for back-row readability.
- If something breaks, acknowledge quickly and switch to backup video. Never debug on stage.
- Streaming AI responses are visually compelling — use the real-time reveal.

**For AI demos:** LLM responses are non-deterministic. Use carefully crafted prompts that reliably produce impressive output.

### Standing Out in 20+ Pitches

- **The "one thing" rule:** Judges remember ONE thing. Decide what it is and hammer it.
- **Visual polish matters disproportionately.** Clean UI = judges assume clean code.
- **Energy is contagious.** Flat delivery kills good projects.
- **Specificity beats generality.** "Saves architects an average of 3 weeks per estimate" > "helps estimate construction costs."
- **The callback technique:** Reference your opening hook at the end. Creates narrative closure.

### AI Hackathon Tips

1. **"It's just a wrapper" is the kiss of death.** Show what's different about YOUR AI integration.
2. **Show AI doing something non-obvious.** Not just chatting — extracting, computing, judging.
3. **Make invisible work visible.** "We spent significant time engineering the system prompt to understand Argentine construction terminology."
4. **Address accuracy proactively.** "We validated against real construction budgets and matched within X%."
5. **Show structured output, not just chat.** The cost breakdown is more impressive than the conversation.

### Common Mistakes

1. Starting with "Hi, we're Team X and we built..."
2. Spending 2 minutes on slides before showing the product
3. Reading from slides
4. Demoing every feature instead of the 2-3 most impressive
5. No clear problem statement in first 30 seconds
6. Apologizing ("we didn't have time to...", "this is buggy but...")
7. Having all team members speak (1-2 max in 3-5 min)
8. Ending weakly ("So yeah, that's our project")
9. Showing code on slides (unreadable on projectors)
10. Overrunning time (biggest failure signal)

### Delivery

- Rehearse 3-5 times minimum. Time yourself. Cut ruthlessly.
- Stand, don't sit. Project your voice.
- Eye contact with judges, not the screen.
- Use silence after impressive demo moments. Let it land.
- One person drives the demo, one narrates (ideal two-person setup).
- Enthusiasm > polish. Judges forgive rough edges if you're passionate.

---

## 3. Winning Examples & Analysis

### Airbnb ($600K seed, 2008) — 10 slides

**Why it worked:**
- One-line clarity: "Book rooms with locals, rather than hotels." Understood in 3 seconds.
- Visceral problem framing — travelers overpay, homeowners have empty rooms.
- Business model in one line: "We take a 10% commission."
- Working product screenshots, even though design was basic.

**Lesson for Nelo:** Led with pain, not product. The structure mirrors Nelo's: "You want to build a house and it takes weeks to get a price."

### Buffer ($500K seed) — 13 slides

**Why it worked:**
- Four numbers on one slide: 55,000 users / $150K ARR / 97% margins / 40% MoM growth.
- Dark background, bold text. Minimalist — forced focus.
- Radical transparency (publicly shared the deck).
- Pitched 200+ investors to get 18.

**Lesson for Nelo:** When you have impressive depth metrics (400+ line items, 26 categories), present them as proof of substance.

### Square — One Product Photo

A small white square plugged into an iPhone communicated the entire solution without words. "A great product image can be worth more than three explanatory slides."

**Lesson for Nelo:** One crisp screenshot of the cost breakdown rendering could be worth three explanatory slides.

### YouTube — Let Metrics Lead

Upload volume and view counts growing 40% week-over-week. "A chart going up and to the right at 40% WoW growth requires very little explanation."

### OpenSpace ($15M Series A) — ConTech

- Positioned as "the telemedicine of construction" — instant analogy.
- Customer validation: JLL, WeWork, Tishman Speyer, Suffolk Construction were all customers BEFORE funding.
- 24-page deck focused on value proposition and AI-powered analytics.

**ConTech investor behavior:** They spend 5x longer on ROI slides than team pages. They forward pilot results to partners.

**Lesson for Nelo:** Consider an anchoring analogy: "TurboTax for construction budgets" or "Zillow Zestimate for building costs."

### What the Best Decks LEFT OUT

- No walls of text
- No technical deep-dives (no architecture diagrams, no code)
- No multiple business models (one model, clearly explained)
- No vanity metrics (only revenue/growth-tied metrics)
- No apologies ("we're still early", "just a prototype")
- No generic market sizing ("The construction industry is $1.3T")

### Effective Phrases

- Airbnb: "Book rooms with locals, rather than hotels" (8 words = entire business)
- Buffer: four numbers on one slide as the entire traction argument
- YC: "We do X. Y people have problem. We solution. We've traction." (compressed pitch)
- OpenSpace: "The telemedicine of construction" (instant analogy)
- 3-Minute Rule: "There are three things I want you to remember" (signals distillation)

---

## 4. Nelo Deck Review

### Current Structure

| Slide | Theme | Title/Content |
|-------|-------|--------------|
| 1 | Light | The Problem — asymmetric layout, two pain points, before/after stat |
| 2 | Dark | Meet Nelo — big logo reveal, tagline |
| 3 | Dark | How It Works — 3-step sequence with connectors |
| 4 | Dark | Demo — full-bleed video placeholder |
| 5 | Dark | AI Innovation — asymmetric, 3 capabilities |
| 6 | Light | Team — equal sizing, photo support |
| 7 | Light | Traction & Close — stats + CTA |

### What's Working Well

1. **Slide titles are statements, not labels.** "Getting a construction estimate shouldn't take weeks" follows the "headlines not headers" best practice perfectly.

2. **The before/after stat** ("2-3 weeks → 5 minutes") is the single most memorable visual. Research confirms before/after comparisons are the highest-impact format.

3. **Light/dark alternation** creates narrative tension. The light problem slide feeling uncomfortable → dark product world → light resolution mirrors the "Man in a Hole" emotional arc.

4. **"Not a ChatGPT wrapper" framing** on slide 5 directly addresses the #1 AI pitch objection. Research shows proactive skepticism-handling is critical.

5. **Demo gets 60-70 seconds** — research confirms this is the optimal allocation for hackathon pitches. The demo IS the pitch.

6. **One idea per slide.** No slide tries to do two things. Clean and scannable.

7. **Founder-problem fit** (Juan Cruz as architect) is surfaced early. This is the strongest credibility signal and follows the "why you" pattern from Sequoia/YC.

### Suggested Improvements (priority order)

#### P0 — High Impact, Easy to Do

**1. Add an anchoring analogy to Slide 2**
Research (OpenSpace, general best practices) shows analogies give instant context. Consider adding below the tagline:
- "Think TurboTax for construction budgets"
- "The Zillow Zestimate for building costs"
This gives judges a mental model in 3 seconds.

**2. Make the before/after stat more visually dominant on Slide 1**
Research says the quantified before/after should be the single most memorable visual. Currently it's at the bottom-right of the slide in medium-sized text. Consider making it larger or moving it to a more prominent position.

**3. Add a "Why Now" element**
Multiple frameworks (Sequoia, YC) include "why now" as a critical slide. Nelo has a strong answer: AI vision capabilities have only recently become accurate enough to interpret floor plans, and Argentine construction costs are volatile (making real-time pricing data essential). This could be a brief addition to slide 5 or a subtitle on slide 1.

#### P1 — Medium Impact

**4. Consider a demo-first or demo-earlier structure**
YC research shows demo-led openings are effective when the demo is impressive. Nelo's floor-plan-to-budget transformation is a genuine "wow moment." Consider whether the demo could come earlier (slide 3 instead of slide 4) to hook judges faster.

**5. Quantify the ROI more explicitly**
ConTech research shows investors/judges spend 5x longer on ROI slides. The current deck shows "2-3 weeks → 5 minutes" but could also quantify cost: "Saves $500-$2,000 per estimate" or "X hours of professional time per project."

**6. Strengthen the closing**
Research says never end on "Questions?" — end with a vision callback. The current close is "From weeks to minutes" + CTA, which is decent. Consider adding a callback to the opening scenario: "The architect who used to spend weeks on every estimate now gets it in minutes."

#### P2 — Nice to Have

**7. Add a "validated against real budgets" line to slide 5**
Research shows AI hackathon judges worry about accuracy/hallucination. A brief mention like "Validated against real Argentine construction budgets" addresses this proactively.

**8. Consider the one-liner test**
Can you describe Nelo in 8 words? Try: "Upload a floor plan, get a construction budget." If judges can repeat this after the pitch, you've won. Make sure this exact phrasing appears somewhere prominently.

**9. Rehearsal notes**
The 3-minute timing budget is well-calibrated. Rehearse with these checkpoints:
- 0:30 — should be past the problem statement
- 1:00 — should be entering the demo
- 2:05 — should be past the demo
- 2:40 — should be on the closing slide
If you're behind at any checkpoint, cut and move forward.

### What NOT to Change

- The 7-slide count is perfect for 3 minutes
- The problem-first narrative arc is correct (don't switch to demo-first unless the team is very comfortable with it)
- The asymmetric layouts on slides 1, 5, 6 — these break monotony effectively
- The horizontal sequence on slide 3 — cleaner than card grids
- The team descriptions — professional and credibility-building
- The "400+ line items" stat on slide 7 — communicates product depth

---

## Sources

- Guy Kawasaki's 10/20/30 Rule
- Sequoia Capital pitch deck template
- Y Combinator Demo Day guide and 87-pitch study
- Brant Pinvidic, "The 3-Minute Rule"
- Donald Miller, "StoryBrand" framework
- TechCrunch Pitch Deck Teardown series
- Airbnb, Buffer, Square, YouTube, Facebook original pitch decks
- OpenSpace Series A deck (ConTech)
- Slidebean, Upmetrics, Spectup pitch deck analyses
- MLH, HackMIT, DevPost judging criteria patterns
- Qubit Capital AI pitch deck analysis (2025)
- VIP Graphics construction pitch deck examples
- Papermark, Piktochart legendary pitch deck roundups
