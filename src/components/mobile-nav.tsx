"use client";

import Link from "next/link";
import {
  IconChat,
  IconEstimates,
  IconBlueprints,
  IconProfile,
} from "./icons";

type Tab = "chat" | "estimates" | "blueprints" | "profile";

const tabs: { id: Tab; label: string; icon: typeof IconChat; href: string }[] = [
  { id: "chat", label: "Chat", icon: IconChat, href: "/chat" },
  { id: "estimates", label: "Estimates", icon: IconEstimates, href: "#" },
  { id: "blueprints", label: "Blueprints", icon: IconBlueprints, href: "#" },
  { id: "profile", label: "Profile", icon: IconProfile, href: "#" },
];

export function MobileNav({ activeTab = "chat" }: { activeTab?: Tab }) {
  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-outline/10 z-50 flex justify-around items-center py-4 px-2">
      {tabs.map(({ id, label, icon: Icon, href }) => {
        const isActive = id === activeTab;
        const isDisabled = href === "#";
        return isDisabled ? (
          <span
            key={id}
            aria-disabled="true"
            className="flex flex-col items-center gap-1 text-on-surface/20 cursor-not-allowed"
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
            className={`flex flex-col items-center gap-1 ${
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
