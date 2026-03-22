"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconPlus, NeloLogo } from "./icons";
import { useLocale } from "@/lib/i18n/use-locale";
import { useAuth } from "@/lib/auth/context";

export function Header({ projectName }: { projectName?: string }) {
  const { locale, setLocale, t } = useLocale();
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
          className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full border border-outline/20 text-[10px] font-bold uppercase tracking-widest text-on-surface/60 hover:text-on-surface hover:border-outline/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={locale === "en" ? "Switch to Spanish" : "Cambiar a ingles"}
        >
          <span className={locale === "en" ? "text-on-surface" : "text-on-surface/40"}>EN</span>
          <span className="text-on-surface/20">/</span>
          <span className={locale === "es" ? "text-on-surface" : "text-on-surface/40"}>ES</span>
        </button>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-outline/20 animate-pulse" />
        ) : user ? (
          <>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-full shadow-sm hover:brightness-95 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <IconPlus />
              {t("header.newEstimate")}
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center hover:brightness-95 transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="User menu"
              >
                {(user.email?.[0] ?? "?").toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-outline/10 p-2 min-w-[200px] z-50">
                  <p className="px-2 py-1 text-xs text-on-surface/50 truncate">
                    {user.email}
                  </p>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs font-bold text-on-surface/70 hover:text-on-surface hover:bg-outline/5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t("auth.signOut")}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/auth/sign-in"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface/60 hover:text-on-surface border border-outline/20 rounded-full transition-colors"
          >
            {t("auth.signInButton")}
          </Link>
        )}
      </div>
    </header>
  );
}
