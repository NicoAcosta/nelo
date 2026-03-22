import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getShareLink, checkShareToken } from "@/lib/db/share-links";
import { createServiceClient } from "@/lib/supabase/service";
import { CostBreakdown } from "@/components/cost-breakdown";
import { SummaryCards } from "@/components/estimate/summary-cards";
import type { Estimate } from "@/lib/estimate/types";

export async function generateMetadata({
  params: _params,
}: {
  params: Promise<{ token: string }>;
}) {
  return {
    title: "Shared Estimate | Nelo",
    description: "Construction cost estimate shared via Nelo",
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Detect language from Accept-Language header for server-side rendering
  const headersList = await headers();
  const acceptLang = headersList.get("accept-language") ?? "";
  const isSpanish = acceptLang.toLowerCase().startsWith("es");

  // Fetch share link using security-definer RPC (excludes expired links)
  const supabase = await createClient();
  const link = await getShareLink(token, supabase);

  if (!link) {
    // Distinguish expired vs not-found
    const tokenStatus = await checkShareToken(token, supabase);
    if (tokenStatus.token_exists && tokenStatus.token_expired) {
      // D-12: expired link — show specific message
      return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="flex items-center gap-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z"
                  fill="#ccff00"
                  stroke="#000"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[18px] font-black tracking-[3px] text-[#ccff00]">NELO</span>
            </div>
            <p className="text-[#a1a1aa] text-sm leading-relaxed">
              {isSpanish
                ? "Este enlace ha expirado. Pedile al propietario un nuevo enlace."
                : "This estimate link has expired. Ask the owner for a new link."}
            </p>
            <a
              href="/"
              className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#18181b] border border-white/[0.08] text-[#a1a1aa] hover:text-white transition-colors"
            >
              {isSpanish ? "Obtene tu propio presupuesto" : "Get your own estimate"}
            </a>
          </div>
        </div>
      );
    }
    // D-13: unknown token — let Next.js handle 404
    notFound();
  }

  // Fetch estimate data using service-role client (bypasses RLS — no user auth on share page)
  const serviceClient = createServiceClient();
  const { data: estimateData } = await serviceClient
    .from("estimates")
    .select("id, version, label, project_inputs, result, created_at")
    .eq("id", link.estimate_id)
    .single();

  if (!estimateData) {
    notFound();
  }

  const estimate = estimateData.result as Estimate;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-2.5 bg-[#08080a]/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z"
              fill="#ccff00"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[15px] font-black tracking-[2px] text-[#ccff00]">NELO</span>
          <span className="w-px h-4 bg-[#3f3f46]" />
          <span className="text-[13px] text-[#71717a] font-medium hidden md:inline">
            {isSpanish ? "Presupuesto compartido via Nelo" : "Estimate shared via Nelo"}
          </span>
        </div>
        <a
          href="/"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#ccff00] text-black hover:bg-[#E2FF00] transition-colors"
        >
          {isSpanish ? "Obtene tu presupuesto" : "Get your estimate"}
        </a>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Version label badge if present */}
        {estimateData.label && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#18181b] border border-white/[0.06] text-[#a1a1aa]">
              {estimateData.label}
            </span>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-5">
          <SummaryCards estimate={estimate} />
        </div>

        {/* Full cost breakdown — no version/history props (D-10: read-only share view) */}
        <CostBreakdown estimate={estimate} />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-white/[0.06] mx-4 md:mx-8 mt-8">
        <p className="text-[11px] text-[#52525b]">
          {isSpanish ? "Creado con Nelo" : "Powered by Nelo"}
          {" — "}
          <a href="/" className="hover:text-[#a1a1aa] transition-colors">
            nelo.archi
          </a>
        </p>
        <a
          href="/"
          className="inline-block mt-3 px-5 py-2.5 rounded-lg text-xs font-medium border border-white/[0.06] text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-colors"
        >
          {isSpanish ? "Obtene tu propio presupuesto" : "Get your own estimate"}
        </a>
      </footer>
    </div>
  );
}
