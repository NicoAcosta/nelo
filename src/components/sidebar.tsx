"use client";

import Link from "next/link";
import {
  IconDashboard,
  IconEstimates,
  IconBlueprints,
  IconSettings,
  IconHelp,
} from "./icons";
import { useLocale } from "@/lib/i18n/use-locale";

type NavItem = "dashboard" | "estimates" | "blueprints" | "settings";

const navItems: { id: NavItem; labelKey: string; icon: typeof IconDashboard; href: string }[] = [
  { id: "dashboard", labelKey: "sidebar.dashboard", icon: IconDashboard, href: "/" },
  { id: "estimates", labelKey: "sidebar.estimates", icon: IconEstimates, href: "/chat" },
  { id: "blueprints", labelKey: "sidebar.blueprints", icon: IconBlueprints, href: "#" },
  { id: "settings", labelKey: "sidebar.settings", icon: IconSettings, href: "#" },
];

export function Sidebar({ activeItem = "dashboard" }: { activeItem?: NavItem }) {
  const { t } = useLocale();

  return (
    <aside className="h-screen w-64 hidden md:flex flex-col border-r border-outline/20 bg-white sticky top-0 overflow-y-auto">
      <div className="flex flex-col h-full py-6">
        {/* Branding */}
        <div className="px-6 mb-8">
          <div className="text-xl font-bold text-on-surface font-headline tracking-tight uppercase">
            Nelo AI
          </div>
          <p className="text-[10px] text-secondary/60 font-bold uppercase tracking-widest">
            {t("sidebar.brandSubtitle")}
          </p>
        </div>

        {/* Navigation */}
        <nav aria-label="Main navigation" className="flex-1 space-y-1">
          {navItems.map(({ id, labelKey, icon: Icon, href }) => {
            const isActive = id === activeItem;
            const isDisabled = href === "#";
            const label = t(labelKey);
            return isDisabled ? (
              <span
                key={id}
                aria-disabled="true"
                className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-on-surface/30 cursor-not-allowed"
              >
                <Icon aria-hidden="true" />
                <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
                <span className="ml-auto text-[8px] uppercase tracking-widest opacity-60">{t("sidebar.soon")}</span>
              </span>
            ) : (
              <Link
                key={id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-on-primary font-bold"
                    : "text-on-surface/60 hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <Icon aria-hidden="true" />
                <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-4 pt-6">
          <span
            aria-disabled="true"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-on-surface/30 cursor-not-allowed rounded-lg text-xs font-bold uppercase"
          >
            <IconHelp aria-hidden="true" />
            {t("sidebar.support")}
          </span>
        </div>
      </div>
    </aside>
  );
}
