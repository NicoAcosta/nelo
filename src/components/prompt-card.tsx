"use client";

import {
  IconCottage,
  IconLocation,
  IconUpload,
  IconArchitect,
} from "./icons";

const iconMap = {
  cottage: IconCottage,
  location: IconLocation,
  upload: IconUpload,
  architect: IconArchitect,
} as const;

interface PromptCardProps {
  icon: keyof typeof iconMap;
  text: string;
  onClick: () => void;
}

export function PromptCard({ icon, text, onClick }: PromptCardProps) {
  const Icon = iconMap[icon];

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 glass-card hover:bg-surface-container-high rounded-xl transition-all duration-200 group flex items-start gap-4"
    >
      <Icon className="text-on-surface group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
      <span className="text-sm font-semibold text-on-surface/80 group-hover:text-on-surface leading-snug">
        {text}
      </span>
    </button>
  );
}
