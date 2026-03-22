"use client";

import { useState, useEffect, useCallback } from "react";
import { IconNelo } from "@/components/icons";

const TOTAL_SLIDES = 7;

export default function PitchPage() {
  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  const next = useCallback(() => {
    setCurrent((s) => {
      const n = Math.min(s + 1, TOTAL_SLIDES - 1);
      setVisited((v) => new Set(v).add(n));
      return n;
    });
  }, []);
  const prev = useCallback(() => setCurrent((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape") setCurrent(0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <main
      className="h-screen w-screen overflow-hidden relative"
      style={{ fontFamily: "var(--font-geist-sans, 'Helvetica', sans-serif)" }}
      aria-label="Nelo pitch presentation"
    >
      {/* Slide track */}
      <div
        className="flex h-full transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${current * 100}vw)`, width: `${TOTAL_SLIDES * 100}vw` }}
      >
        <SlideWrap index={0} active={visited.has(0)}><Slide1 /></SlideWrap>
        <SlideWrap index={1} active={visited.has(1)}><Slide2 /></SlideWrap>
        <SlideWrap index={2} active={visited.has(2)}><Slide3 /></SlideWrap>
        <SlideWrap index={3} active={visited.has(3)}><Slide4 /></SlideWrap>
        <SlideWrap index={4} active={visited.has(4)}><Slide5 /></SlideWrap>
        <SlideWrap index={5} active={visited.has(5)}><Slide6 /></SlideWrap>
        <SlideWrap index={6} active={visited.has(6)}><Slide7 /></SlideWrap>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.06]">
        <div
          className="h-full bg-[#ccff00] transition-[width] duration-500"
          style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }}
        />
      </div>

      {/* Counter */}
      <div className="absolute bottom-6 right-8 text-[11px] text-white/40 tracking-[0.15em]" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
        {String(current + 1).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
      </div>

      {/* Navigation */}
      <nav className="absolute bottom-4 left-8 flex gap-2" aria-label="Slide navigation">
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white/90 hover:border-white/40 hover:bg-white/[0.06] disabled:opacity-15 disabled:cursor-default transition-colors duration-200"
          aria-label="Previous slide"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button
          onClick={next}
          disabled={current === TOTAL_SLIDES - 1}
          className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white/90 hover:border-white/40 hover:bg-white/[0.06] disabled:opacity-15 disabled:cursor-default transition-colors duration-200"
          aria-label="Next slide"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </nav>
    </main>
  );
}

/* ─── Slide entrance animation wrapper ─── */

function SlideWrap({ children, index, active }: { children: React.ReactNode; index: number; active: boolean }) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${index + 1} of ${TOTAL_SLIDES}`}
      className={`w-screen h-screen flex-shrink-0 transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
}


/* ─── Slide 1: The Problem — LEFT-ALIGNED, tension ─── */

function Slide1() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#08080a] flex items-center">
      <div className="w-full max-w-6xl mx-auto px-10 md:px-20 grid md:grid-cols-[1.4fr_1fr] gap-16 items-center">
        {/* Left — statement */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-8">The problem</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.92] mb-8">
            Getting a construction
            <br />
            estimate shouldn&apos;t
            <br />
            <span className="text-white/25">take weeks.</span>
          </h1>
          <p className="text-base md:text-lg text-white/55 leading-relaxed max-w-xl">
            Our co-founder Juan Cruz is an architect. He spent the last year burning time and money on estimates for every project. This isn&apos;t a hypothetical &mdash; this is his daily frustration.
          </p>
        </div>

        {/* Right — two pain points stacked */}
        <div className="flex flex-col gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35 font-bold mb-3">Early stage</p>
            <p className="text-[15px] text-white/60 leading-relaxed">
              &ldquo;How much would this roughly cost?&rdquo; Even a ballpark requires days of calls, waiting, and often paying for a preliminary study.
            </p>
          </div>
          <div className="h-px bg-white/[0.08]" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35 font-bold mb-3">Detailed stage</p>
            <p className="text-[15px] text-white/60 leading-relaxed">
              Real numbers mean suppliers, subcontractors, price research, spreadsheets. Weeks of work &mdash; on every single project.
            </p>
          </div>
          <div className="h-px bg-white/[0.08]" />
          <div className="flex items-baseline gap-4">
            <span className="text-2xl md:text-3xl font-black text-white/20 line-through decoration-2 decoration-[#ccff00]/50">2-3 weeks</span>
            <span className="text-white/30 text-lg">&rarr;</span>
            <span className="text-2xl md:text-3xl font-black text-[#ccff00]">5 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 2: Meet Nelo — centered reveal ─── */

function Slide2() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8">
      <div className="w-24 h-24 bg-[#111] rounded-2xl flex items-center justify-center mb-10 relative">
        <IconNelo className="w-14 h-14" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ccff00] rounded-full border-[3px] border-[#0a0a0a]" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-white/35 font-semibold mb-5">Meet</p>
      <h1 className="text-7xl md:text-[10rem] font-black tracking-[-0.04em] leading-none mb-8">
        <span className="bg-[#ccff00] text-[#0a0a0a] px-5 md:px-8 py-1 md:py-2 inline-block">NELO</span>
      </h1>
      <p className="text-lg md:text-xl text-white/55 text-center max-w-lg leading-relaxed">
        Your AI construction cost estimator.
      </p>
      <p className="text-sm text-white/35 text-center max-w-md mt-3 leading-relaxed">
        Describe your project. Upload your plan. Get a detailed estimate in minutes.
      </p>
      <p className="mt-12 text-[10px] text-white/25 uppercase tracking-[0.25em]">
        Named after our architect co-founder
      </p>
    </div>
  );
}

/* ─── Slide 3: How It Works — horizontal sequence, NOT cards ─── */

function Slide3() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#08080a] flex flex-col items-center justify-center px-8 md:px-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-6">How it works</p>
      <h2 className="text-4xl md:text-6xl font-black tracking-tight text-center text-white/90 mb-20">
        Chat. Upload. Estimate.
      </h2>

      {/* Horizontal sequence with connectors */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0 max-w-5xl w-full">
        {/* Step 1 */}
        <div className="flex-1 md:text-center">
          <div className="text-[#ccff00] text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>01</div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-white/90">Chat</h3>
          <p className="text-sm text-white/50 leading-relaxed max-w-[240px] md:mx-auto">
            Describe your project naturally. Nelo asks smart follow-ups about structure, finishes, location.
          </p>
        </div>

        {/* Connector */}
        <div className="hidden md:flex items-center px-4 text-white/15 self-start mt-8">
          <div className="w-12 h-px bg-white/15" />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        </div>

        {/* Step 2 */}
        <div className="flex-1 md:text-center">
          <div className="text-[#ccff00]/60 text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>02</div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-white/90">Upload</h3>
          <p className="text-sm text-white/50 leading-relaxed max-w-[240px] md:mx-auto">
            Drop a floor plan &mdash; image, PDF, or CAD file. AI vision extracts rooms, dimensions, doors.
          </p>
        </div>

        {/* Connector */}
        <div className="hidden md:flex items-center px-4 text-white/15 self-start mt-8">
          <div className="w-12 h-px bg-white/15" />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        </div>

        {/* Step 3 */}
        <div className="flex-1 md:text-center">
          <div className="text-[#ccff00]/30 text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>03</div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-white/90">Estimate</h3>
          <p className="text-sm text-white/50 leading-relaxed max-w-[240px] md:mx-auto">
            26-category cost breakdown. Price per m&sup2; in ARS and USD. Confidence level. Every assumption shown.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 4: Demo — full-bleed container ─── */

function Slide4() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#060608] flex flex-col items-center justify-center px-6 md:px-12 relative">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #ccff00 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />

      <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-6 z-10">Live demo</p>
      <h2 className="text-3xl md:text-5xl font-black tracking-tight text-center text-white/90 mb-3 z-10">
        See it in action
      </h2>
      <p className="text-sm text-white/45 text-center mb-10 z-10">
        From first question to full cost breakdown in under 5 minutes
      </p>

      {/* Full-bleed video container */}
      <div className="w-full max-w-5xl aspect-video bg-[#0e0e10] rounded-xl border border-white/[0.08] flex items-center justify-center relative overflow-hidden z-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border border-white/15 flex items-center justify-center mx-auto mb-5 hover:border-[#ccff00]/40 hover:bg-[#ccff00]/[0.04] transition-colors duration-300 cursor-pointer">
            <svg className="w-6 h-6 text-white/60 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
            Replace with demo recording
          </p>
        </div>
      </div>

      {/* Tags below */}
      <div className="flex flex-wrap justify-center gap-3 mt-8 z-10">
        {["Chat flow", "Floor plan vision", "Cost breakdown", "Bilingual"].map((tag) => (
          <span key={tag} className="text-[10px] uppercase tracking-[0.15em] text-white/30 border border-white/[0.08] rounded-full px-4 py-1.5">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide 5: AI Innovation — staggered, asymmetric ─── */

function Slide5() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#0a0a0a] flex items-center">
      <div className="w-full max-w-6xl mx-auto px-10 md:px-20 grid md:grid-cols-[1fr_1.2fr] gap-16 items-center">
        {/* Left — headline */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-8">Why this matters</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.92] mb-6">
            AI that actually
            <br />
            saves professionals
            <br />
            time.
          </h2>
          <p className="text-sm text-white/45 leading-relaxed max-w-sm">
            Not a ChatGPT wrapper. A tool that replaces hours of professional work with a 5-minute conversation.
          </p>
        </div>

        {/* Right — capabilities, varied sizing */}
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#ccff00]" />
              <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Conversational Reasoning</h3>
            </div>
            <p className="text-[15px] text-white/50 leading-relaxed pl-5">
              Collects data through dialogue. Fills gaps with smart defaults. Shows every assumption transparently. No forms, no jargon.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#ccff00]/60" />
              <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Vision Understanding</h3>
            </div>
            <p className="text-[15px] text-white/50 leading-relaxed pl-5">
              Reads floor plans in any format &mdash; image, PDF, DXF, DWG. Extracts rooms, doors, windows, dimensions. Asks you to confirm.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#ccff00]/30" />
              <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Domain-Expert Computation</h3>
            </div>
            <p className="text-[15px] text-white/50 leading-relaxed pl-5">
              400+ line items. 26 categories. Real Argentine pricing &mdash; UOCRA labor rates, material costs, blue-rate USD, inflation-adjusted daily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 6: The Team — JC dominant, asymmetric ─── */

function Slide6() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#08080a] flex items-center">
      <div className="w-full max-w-5xl mx-auto px-10 md:px-20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-8">The team</p>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[0.92] mb-16">
          Built by people who<br />know the problem.
        </h2>

        <div className="grid md:grid-cols-[1.5fr_1fr_1fr] gap-10 md:gap-8 items-start">
          {/* Juan Cruz — dominant */}
          <div>
            <div className="w-28 h-28 rounded-2xl bg-[#ccff00] flex items-center justify-center mb-5">
              <span className="text-3xl font-black text-[#0a0a0a]">JC</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white/90">Juan Cruz Feres</h3>
            <p className="text-xs text-[#ccff00] uppercase tracking-[0.2em] font-bold mt-1 mb-3">Architect</p>
            <p className="text-[15px] text-white/50 leading-relaxed">
              Uses this budget structure every day. Spent the last year dealing with this exact problem. Named the app after himself.
            </p>
          </div>

          {/* Sebastian */}
          <div className="md:mt-8">
            <div className="w-16 h-16 rounded-xl bg-[#151517] border border-white/[0.08] flex items-center justify-center mb-5">
              <span className="text-lg font-black text-white/60">SM</span>
            </div>
            <h3 className="text-base font-black uppercase tracking-tight text-white/90">Sebastian Maldonado</h3>
            <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] font-bold mt-1 mb-3">Designer</p>
            <p className="text-sm text-white/45 leading-relaxed">
              Made it look like a product, not a hackathon project.
            </p>
          </div>

          {/* Nicolas */}
          <div className="md:mt-8">
            <div className="w-16 h-16 rounded-xl bg-[#151517] border border-white/[0.08] flex items-center justify-center mb-5">
              <span className="text-lg font-black text-white/60">NA</span>
            </div>
            <h3 className="text-base font-black uppercase tracking-tight text-white/90">Nicolas Acosta</h3>
            <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] font-bold mt-1 mb-3">Software Engineer</p>
            <p className="text-sm text-white/45 leading-relaxed">
              Built the AI pipeline, calculation engine, and document processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 7: Traction & Close — CTA dominant ─── */

function Slide7() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 md:px-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-6">Already validated</p>
      <h2 className="text-4xl md:text-6xl font-black tracking-tight text-center text-white/90 mb-14 leading-[0.92]">
        From weeks to minutes.
      </h2>

      {/* Stats — asymmetric: one big, two small */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12 mb-16 max-w-3xl">
        {/* Primary stat */}
        <div className="text-center md:text-left">
          <div className="text-6xl md:text-7xl font-black text-[#ccff00] leading-none mb-2" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
            24h
          </div>
          <p className="text-xs text-white/45 uppercase tracking-[0.15em] font-bold">shipped</p>
          <p className="text-sm text-white/40 mt-2 leading-relaxed max-w-[200px]">
            Full estimation engine, vision, bilingual UI, real pricing
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-24 bg-white/[0.08]" />

        {/* Secondary stats */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="text-2xl font-black text-white/70 mb-1" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>1 year</div>
            <p className="text-xs text-white/40">of real pain &mdash; our architect co-founder lived this problem</p>
          </div>
          <div>
            <div className="text-2xl font-black text-white/70 mb-1" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>Waitlist</div>
            <p className="text-xs text-white/40">of architects ready to use it before we even launched</p>
          </div>
        </div>
      </div>

      {/* CTA — dominant */}
      <a
        href="/"
        className="group inline-flex items-center gap-3 bg-[#ccff00] text-[#0a0a0a] font-black text-lg md:text-xl uppercase tracking-[0.08em] px-12 py-5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200"
      >
        Try it live
        <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </a>
      <p className="text-[10px] text-white/25 uppercase tracking-[0.25em] mt-4" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
        nelo.vercel.app
      </p>
    </div>
  );
}
