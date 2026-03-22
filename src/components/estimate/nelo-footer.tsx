"use client";

interface NeloFooterProps {
  chatId: string;
}

export function NeloFooter({ chatId }: NeloFooterProps) {
  return (
    <>
      <div className="relative px-8 pt-16 pb-12 text-center overflow-hidden border-t border-white/[0.06] mx-8">
        {/* Subtle glow */}
        <div className="absolute w-[500px] h-[200px] bottom-0 left-1/2 -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(204,255,0,0.04)_0%,transparent_70%)] blur-[60px] pointer-events-none" />

        {/* N mark */}
        <div className="relative mb-4 inline-block">
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            className="opacity-25 drop-shadow-[0_0_30px_rgba(204,255,0,0.2)]"
          >
            <path
              d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z"
              fill="#ccff00"
              stroke="rgba(204,255,0,0.3)"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="relative text-[80px] font-black tracking-[20px] text-[#ccff00] opacity-[0.12] leading-none select-none">
          NELO
        </div>

        {/* Tagline */}
        <div className="relative text-sm text-[#71717a] mt-3 font-medium">
          AI Construction Cost Estimation
        </div>
        <div className="relative font-mono text-[13px] text-[#3f3f46] mt-1.5 tracking-wider">
          nelo.archi
        </div>

        {/* CTAs */}
        <div className="relative mt-6 flex gap-2.5 justify-center">
          <a
            href="/"
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium border border-white/[0.06] text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-all"
          >
            Start New Estimate
          </a>
          <a
            href={`/chat/${chatId}`}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium border border-white/[0.06] text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-all"
          >
            Back to Chat →
          </a>
        </div>
      </div>

      {/* Powered by strip */}
      <div className="text-center py-6 text-[11px] text-[#3f3f46] flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-40">
          <path d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z" fill="currentColor" />
        </svg>
        Powered by Nelo — nelo.archi
      </div>
    </>
  );
}
