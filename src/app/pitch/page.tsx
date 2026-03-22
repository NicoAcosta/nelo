"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { IconNelo } from "@/components/icons";

const TOTAL_SLIDES = 7;

/**
 * Which slides use the light theme.
 * Light = problem (tension), team (human), close (resolution).
 * Dark = product world (Nelo's domain).
 */
const LIGHT_SLIDES = new Set([0, 5, 6]);

export default function PitchPage() {
  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  const isLight = LIGHT_SLIDES.has(current);

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

      {/* Progress bar — adapts to theme */}
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] transition-colors duration-500 ${isLight ? "bg-black/[0.06]" : "bg-white/[0.06]"}`}>
        <div
          className="h-full bg-[#ccff00] transition-[width] duration-500"
          style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }}
        />
      </div>

      {/* Counter — adapts to theme */}
      <div
        className={`absolute bottom-6 right-8 text-[11px] tracking-[0.15em] transition-colors duration-500 ${isLight ? "text-black/40" : "text-white/40"}`}
        style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
      >
        {String(current + 1).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
      </div>

      {/* Navigation — adapts to theme */}
      <nav className="absolute bottom-4 left-8 flex gap-2" aria-label="Slide navigation">
        <button
          onClick={prev}
          disabled={current === 0}
          className={`w-11 h-11 rounded-full border flex items-center justify-center disabled:opacity-15 disabled:cursor-default transition-colors duration-200 ${
            isLight
              ? "border-black/15 text-black/40 hover:text-black/80 hover:border-black/30 hover:bg-black/[0.04]"
              : "border-white/15 text-white/50 hover:text-white/90 hover:border-white/40 hover:bg-white/[0.06]"
          }`}
          aria-label="Previous slide"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button
          onClick={next}
          disabled={current === TOTAL_SLIDES - 1}
          className={`w-11 h-11 rounded-full border flex items-center justify-center disabled:opacity-15 disabled:cursor-default transition-colors duration-200 ${
            isLight
              ? "border-black/15 text-black/40 hover:text-black/80 hover:border-black/30 hover:bg-black/[0.04]"
              : "border-white/15 text-white/50 hover:text-white/90 hover:border-white/40 hover:bg-white/[0.06]"
          }`}
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

/* ═══════════════════════════════════════════════
   SLIDE 1: The Problem — LIGHT THEME (tension)
   ═══════════════════════════════════════════════ */

function Slide1() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#f2f2f0] text-[#1a1a1a] flex items-center">
      <div className="w-full max-w-6xl mx-auto px-10 md:px-20 grid md:grid-cols-[1.4fr_1fr] gap-16 items-center">
        {/* Left — statement */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#6b8a00] font-semibold mb-8">The problem</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.92] mb-8 text-[#1a1a1a]">
            Getting a construction
            <br />
            estimate shouldn&apos;t
            <br />
            <span className="text-[#1a1a1a]/25">take weeks.</span>
          </h1>
          <p className="text-base md:text-lg text-[#1a1a1a]/65 leading-relaxed max-w-xl">
            Juan Cruz is an architect. Throughout his career, he&apos;s burned countless hours on cost estimates for every single project. This isn&apos;t a hypothetical &mdash; this is his daily reality.
          </p>
        </div>

        {/* Right — two pain points stacked */}
        <div className="flex flex-col gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#1a1a1a]/50 font-bold mb-3">Early stage</p>
            <p className="text-[15px] text-[#1a1a1a]/65 leading-relaxed">
              &ldquo;How much would this roughly cost?&rdquo; Even a ballpark requires days of calls, waiting, and often paying for a preliminary study.
            </p>
          </div>
          <div className="h-px bg-[#1a1a1a]/[0.08]" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#1a1a1a]/50 font-bold mb-3">Detailed stage</p>
            <p className="text-[15px] text-[#1a1a1a]/65 leading-relaxed">
              Real numbers mean suppliers, subcontractors, price research, spreadsheets. Weeks of work &mdash; on every single project.
            </p>
          </div>
          <div className="h-px bg-[#1a1a1a]/[0.08]" />
          <div className="flex items-baseline gap-4">
            <span className="text-2xl md:text-3xl font-black text-[#1a1a1a]/15 line-through decoration-2 decoration-[#1a1a1a]/20">2-3 weeks</span>
            <span className="text-[#1a1a1a]/25 text-lg">&rarr;</span>
            <span className="text-2xl md:text-3xl font-black text-[#4d7a00]">5 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SLIDE 2: Meet Nelo — DARK (dramatic reveal)
   ═══════════════════════════════════════════════ */

function Slide2() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#0a0a0a] text-[#f2f2f2] flex flex-col items-center justify-center px-8">
      <div className="w-24 h-24 bg-[#111] rounded-2xl flex items-center justify-center mb-10 relative">
        <IconNelo className="w-14 h-14" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ccff00] rounded-full border-[3px] border-[#0a0a0a]" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-white/45 font-semibold mb-5">Meet</p>
      <h1 className="text-7xl md:text-[10rem] font-black tracking-[-0.04em] leading-none mb-8">
        <span className="bg-[#ccff00] text-[#0a0a0a] px-5 md:px-8 py-1 md:py-2 inline-block">NELO</span>
      </h1>
      <p className="text-lg md:text-xl text-white/55 text-center max-w-lg leading-relaxed">
        Your AI construction cost estimator.
      </p>
      <p className="text-sm text-white/55 text-center max-w-md mt-3 leading-relaxed">
        Describe your project. Upload your plan. Get a detailed estimate in minutes.
      </p>
      <p className="mt-12 text-[10px] text-white/25 uppercase tracking-[0.25em]">
        Built by architects, for architects
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SLIDE 3: How It Works — DARK (product world)
   ═══════════════════════════════════════════════ */

function Slide3() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#08080a] text-[#f2f2f2] flex flex-col items-center justify-center px-8 md:px-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-6">How it works</p>
      <h2 className="text-4xl md:text-6xl font-black tracking-tight text-center text-white/90 mb-20">
        Chat. Upload. Estimate.
      </h2>

      {/* Horizontal sequence with connectors */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0 max-w-5xl w-full">
        <div className="flex-1 md:text-center">
          <div className="text-[#ccff00] text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>01</div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-white/90">Chat</h3>
          <p className="text-sm text-white/50 leading-relaxed max-w-[240px] md:mx-auto">
            Describe your project naturally. Nelo asks smart follow-ups about structure, finishes, location.
          </p>
        </div>

        <div className="hidden md:flex items-center px-4 text-white/15 self-start mt-8">
          <div className="w-12 h-px bg-white/15" />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        </div>

        <div className="flex-1 md:text-center">
          <div className="text-[#ccff00]/60 text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>02</div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-white/90">Upload</h3>
          <p className="text-sm text-white/50 leading-relaxed max-w-[240px] md:mx-auto">
            Drop a floor plan &mdash; image, PDF, or CAD file. AI vision extracts rooms, dimensions, doors.
          </p>
        </div>

        <div className="hidden md:flex items-center px-4 text-white/15 self-start mt-8">
          <div className="w-12 h-px bg-white/15" />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        </div>

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

/* ═══════════════════════════════════════════════
   SLIDE 4: Demo — DARK (full-bleed)
   ═══════════════════════════════════════════════ */

function Slide4() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#060608] text-[#f2f2f2] flex flex-col items-center justify-center px-6 md:px-12 relative">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #ccff00 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />

      <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-6 z-10">Live demo</p>
      <h2 className="text-3xl md:text-5xl font-black tracking-tight text-center text-white/90 mb-3 z-10">
        See it in action
      </h2>
      <p className="text-sm text-white/55 text-center mb-10 z-10">
        From first question to full cost breakdown in under 5 minutes
      </p>

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

/* ═══════════════════════════════════════════════
   SLIDE 5: AI Innovation — DARK (technical)
   ═══════════════════════════════════════════════ */

function Slide5() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#0a0a0a] text-[#f2f2f2] flex items-center">
      <div className="w-full max-w-6xl mx-auto px-10 md:px-20 grid md:grid-cols-[1fr_1.2fr] gap-16 items-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccff00]/70 font-semibold mb-8">Why this matters</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.92] mb-6">
            AI that actually
            <br />
            saves professionals
            <br />
            time.
          </h2>
          <p className="text-sm text-white/55 leading-relaxed max-w-sm">
            Not a ChatGPT wrapper. A tool that replaces hours of professional work with a 5-minute conversation.
          </p>
        </div>

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

/* ═══════════════════════════════════════════════
   SLIDE 6: The Team — LIGHT THEME (human, real)
   Equal sizing, photo support
   ═══════════════════════════════════════════════ */

const team = [
  {
    name: "Juan Cruz Feres",
    role: "Architect",
    desc: "Domain expert and product lead. Drove requirements from years of firsthand experience with construction estimation.",
    initial: "JC",
    photo: "/images/team/jc.jpg",
  },
  {
    name: "Sebastian Maldonado",
    role: "Designer",
    desc: "Led product design, user research, and interface strategy. Shaped the experience from user interviews to final UI.",
    initial: "SM",
    photo: "/images/team/sm.jpg",
  },
  {
    name: "Nicolas Acosta",
    role: "Software Engineer",
    desc: "Built the AI pipeline, calculation engine, document processing, and infrastructure. Full-stack development and system architecture.",
    initial: "NA",
    photo: "/images/team/na.jpg",
  },
];

function TeamPhoto({ member }: { member: typeof team[number] }) {
  const [hasPhoto, setHasPhoto] = useState(true);

  if (!hasPhoto) {
    return (
      <div className="w-24 h-24 rounded-2xl bg-[#e8e8e6] flex items-center justify-center">
        <span className="text-2xl font-black text-[#1a1a1a]/40">{member.initial}</span>
      </div>
    );
  }

  return (
    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#e8e8e6] relative">
      <Image
        src={member.photo}
        alt={member.name}
        fill
        className="object-cover"
        onError={() => setHasPhoto(false)}
        sizes="96px"
      />
    </div>
  );
}

function Slide6() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#f2f2f0] text-[#1a1a1a] flex items-center">
      <div className="w-full max-w-5xl mx-auto px-10 md:px-20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#6b8a00] font-semibold mb-8">The team</p>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[0.92] mb-16 text-[#1a1a1a]">
          Built by people who<br />know the problem.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {team.map((member) => (
            <div key={member.name}>
              <TeamPhoto member={member} />
              <h3 className="text-lg font-black uppercase tracking-tight text-[#1a1a1a] mt-5">{member.name}</h3>
              <p className="text-xs text-[#6b8a00] uppercase tracking-[0.2em] font-bold mt-1 mb-3">{member.role}</p>
              <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">{member.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SLIDE 7: Traction & Close — LIGHT (resolution)
   ═══════════════════════════════════════════════ */

function Slide7() {
  return (
    <div className="w-screen h-screen flex-shrink-0 bg-[#f2f2f0] text-[#1a1a1a] flex flex-col items-center justify-center px-8 md:px-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#6b8a00] font-semibold mb-6">Already validated</p>
      <h2 className="text-4xl md:text-6xl font-black tracking-tight text-center text-[#1a1a1a] mb-14 leading-[0.92]">
        From weeks to minutes.
      </h2>

      {/* Stats */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12 mb-16 max-w-3xl">
        <div className="text-center md:text-left">
          <div className="text-6xl md:text-7xl font-black text-[#1a1a1a] leading-none mb-2" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
            400+
          </div>
          <p className="text-xs text-[#1a1a1a]/60 uppercase tracking-[0.15em] font-bold">line items</p>
          <p className="text-sm text-[#1a1a1a]/60 mt-2 leading-relaxed max-w-[200px]">
            Real Argentine pricing across 26 construction categories
          </p>
        </div>

        <div className="hidden md:block w-px h-24 bg-[#1a1a1a]/[0.1]" />

        <div className="flex flex-col gap-6">
          <div>
            <div className="text-2xl font-black text-[#1a1a1a]/70 mb-1" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>Founded on real pain</div>
            <p className="text-xs text-[#1a1a1a]/60">Our architect has dealt with this problem his entire career</p>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1a1a1a]/70 mb-1" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>Waitlist</div>
            <p className="text-xs text-[#1a1a1a]/60">Professionals ready to use it before we even launched</p>
          </div>
        </div>
      </div>

      {/* CTA — dark on light for maximum contrast */}
      <a
        href="/"
        className="group inline-flex items-center gap-3 bg-[#1a1a1a] text-[#f2f2f2] font-black text-lg md:text-xl uppercase tracking-[0.08em] px-12 py-5 rounded-xl hover:bg-[#333] active:scale-[0.98] transition-all duration-200"
      >
        Try it live
        <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </a>
      <p className="text-[10px] text-[#1a1a1a]/25 uppercase tracking-[0.25em] mt-4" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
        nelo.vercel.app
      </p>
    </div>
  );
}
