"use client";

import Link from "next/link";
import {
  IconChat,
  IconProjects,
  IconBlueprints,
  IconProfile,
} from "./icons";
import { useLocale } from "@/lib/i18n/use-locale";

type Tab = "chat" | "projects" | "blueprints" | "profile";

const tabs: { id: Tab; labelKey: string; icon: typeof IconChat; href: string }[] = [
  { id: "chat", labelKey: "mobileNav.chat", icon: IconChat, href: "/chat" },
  { id: "projects", labelKey: "mobileNav.projects", icon: IconProjects, href: "/projects" },
  { id: "blueprints", labelKey: "mobileNav.blueprints", icon: IconBlueprints, href: "#" },
  { id: "profile", labelKey: "mobileNav.profile", icon: IconProfile, href: "#" },
];

export function MobileNav({ activeTab = "chat" }: { activeTab?: Tab }) {
  const { t } = useLocale();

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-outline/10 z-50 flex justify-around items-center py-4 px-2">
      {tabs.map(({ id, labelKey, icon: Icon, href }) => {
        const isActive = id === activeTab;
        const isDisabled = href === "#";
        const label = t(labelKey);
        return isDisabled ? (
          <span
            key={id}
            aria-disabled="true"
            className="flex flex-col items-center gap-1 text-on-surface/20 cursor-not-allowed min-w-[44px] min-h-[44px] justify-center"
          >
            <Icon aria-hidden="true" />
            <span className="text-[9px] font-black uppercase tracking-tighter">
              {label}
            </span>
          </span>
        ) : (
          <Link
            key={id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center ${
              isActive ? "text-on-surface" : "text-on-surface/40"
            }`}
          >
            <Icon aria-hidden="true" />
            <span className="text-[9px] font-black uppercase tracking-tighter">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
