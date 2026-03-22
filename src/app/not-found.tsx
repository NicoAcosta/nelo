"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/use-locale";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black font-headline tracking-tight text-on-surface uppercase mb-4">
          {t("notFound.title")}
        </h1>
        <p className="text-on-surface/60 mb-8 text-sm">
          {t("notFound.description")}
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider rounded-full hover:brightness-95 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("notFound.backHome")}
        </Link>
      </div>
    </div>
  );
}
