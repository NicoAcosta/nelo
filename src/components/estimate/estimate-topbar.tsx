"use client";

import { useCallback, useState } from "react";
import { useLocale } from "@/lib/i18n/use-locale";
import { SharePopover } from "@/components/estimate/share-popover";

interface EstimateTopbarProps {
  projectName: string;
  chatId: string;
  locationLabel: string;
  estimateId?: string;
}

export function EstimateTopbar({
  projectName,
  chatId,
  locationLabel,
  estimateId,
}: EstimateTopbarProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed; silently ignore
    }
  }, []);

  const displayName = locationLabel
    ? `${projectName} — ${locationLabel}`
    : projectName;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-2.5 bg-[#08080a]/85 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-3.5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 2h6l6 10V2h6v20h-6L9 12v10H3z" fill="#ccff00" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span className="text-[15px] font-black tracking-[2px] text-[#ccff00]">NELO</span>
        <span className="w-px h-4 bg-[#3f3f46]" />
        <span className="text-[13px] text-[#71717a] font-medium truncate max-w-[300px] hidden md:inline">{displayName}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {estimateId ? (
          <SharePopover estimateId={estimateId} />
        ) : (
          <button
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#ccff00]"
          >
            {copied ? t("estimate.copied") : `↗ ${t("estimate.share")}`}
          </button>
        )}
        <button
          disabled
          title={t("estimate.comingSoon")}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] text-[#52525b] cursor-not-allowed flex items-center gap-1.5"
        >
          ⬇ {t("estimate.export")}
        </button>
        <a
          href={`/chat/${chatId}`}
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#ccff00] text-black border border-[#ccff00] hover:bg-[#E2FF00] transition-colors focus-visible:ring-2 focus-visible:ring-[#ccff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
        >
          {t("estimate.backToChat")}
        </a>
      </div>
    </div>
  );
}
