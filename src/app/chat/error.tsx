"use client";

import { useLocale } from "@/lib/i18n/use-locale";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-black font-headline tracking-tight text-on-surface uppercase mb-4 text-balance">
          {t("chatError.title")}
        </h1>
        <p className="text-on-surface/60 mb-8 text-sm">
          {t("chatError.description")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-8 py-3 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider rounded-full hover:brightness-95 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("chatError.restart")}
        </button>
      </div>
    </div>
  );
}
