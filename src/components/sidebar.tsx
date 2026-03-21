"use client";

import Link from "next/link";
import {
  IconDashboard,
  IconEstimates,
  IconBlueprints,
  IconSettings,
  IconHelp,
} from "./icons";

type NavItem = "dashboard" | "estimates" | "blueprints" | "settings";

const navItems: { id: NavItem; label: string; icon: typeof IconDashboard; href: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: IconDashboard, href: "/" },
  { id: "estimates", label: "Estimates", icon: IconEstimates, href: "/chat" },
  { id: "blueprints", label: "Blueprints", icon: IconBlueprints, href: "#" },
  { id: "settings", label: "Settings", icon: IconSettings, href: "#" },
];

export function Sidebar({ activeItem = "dashboard" }: { activeItem?: NavItem }) {
  return (
    <aside className="h-screen w-64 hidden md:flex flex-col border-r border-outline/20 bg-white sticky top-0 overflow-y-auto">
      <div className="flex flex-col h-full py-6">
        {/* Branding */}
        <div className="px-6 mb-8">
          <h1 className="text-xl font-bold text-on-surface font-headline tracking-tight uppercase">
            Nelo AI
          </h1>
          <p className="text-[10px] text-secondary/60 font-bold uppercase tracking-widest">
            Project Architect
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ id, label, icon: Icon, href }) => {
            const isActive = id === activeItem;
            return (
              <Link
                key={id}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-on-primary font-bold"
                    : "text-on-surface/60 hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <Icon />
                <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-4 pt-6">
          <div className="p-4 glass-card rounded-xl mb-4">
            <p className="text-[9px] uppercase tracking-widest text-secondary/60 mb-2 font-bold">
              Current Plan
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase">Pro Architect</span>
            </div>
          </div>
          <Link
            href="#"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-on-surface/60 hover:text-on-surface hover:bg-surface-container rounded-lg transition-all text-xs font-bold uppercase"
          >
            <IconHelp />
            Support
          </Link>
        </div>
      </div>
    </aside>
  );
}
