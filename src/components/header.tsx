"use client";

import Link from "next/link";
import { IconPlus, NeloLogo } from "./icons";
import { useLocale } from "@/lib/i18n/use-locale";

export function Header({ projectName }: { projectName?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-outline/10 sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-4">
        <NeloLogo size="md" className="text-on-surface" />
        {projectName && (
          <>
            <div className="h-5 w-px bg-outline/30 mx-1 hidden md:block" />
            <span className="hidden md:inline text-on-surface/50 font-medium text-sm">
              {projectName}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        <span className="hidden md:block text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">
          {t("header.basePrices")}
        </span>
        <button
          onClick={() => setLocale(locale === "en" ? "es" : "en")}
          className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full border border-outline/20 text-[10px] font-bold uppercase tracking-widest text-on-surface/60 hover:text-on-surface hover:border-outline/40 transition-all"
          aria-label={locale === "en" ? "Switch to Spanish" : "Cambiar a ingles"}
        >
          <span className={locale === "en" ? "text-on-surface" : "text-on-surface/40"}>EN</span>
          <span className="text-on-surface/20">/</span>
          <span className={locale === "es" ? "text-on-surface" : "text-on-surface/40"}>ES</span>
        </button>
        <Link
          href="/chat"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-full shadow-sm hover:brightness-95 transition-all active:scale-95"
        >
          <IconPlus />
          {t("header.newEstimate")}
        </Link>
      </div>
    </header>
  );
}
