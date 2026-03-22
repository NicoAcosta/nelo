"use client";

import { useLocale } from "@/lib/i18n/use-locale";

interface NoEstimateFallbackProps {
  chatId: string;
}

export function NoEstimateFallback({ chatId }: NoEstimateFallbackProps) {
  const { t } = useLocale();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#08080a] text-[#fafafa]">
      <div className="text-center">
        <p className="text-lg font-medium mb-2">{t("estimate.noEstimate")}</p>
        <p className="text-sm text-[#71717a] mb-6">
          {t("estimate.noEstimateDesc")}
        </p>
        <a
          href={`/chat/${chatId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ccff00] text-black font-semibold text-sm hover:brightness-95 transition focus-visible:ring-2 focus-visible:ring-[#ccff00] focus-visible:ring-offset-2"
        >
          {t("estimate.backToChat")}
        </a>
      </div>
    </div>
  );
}
