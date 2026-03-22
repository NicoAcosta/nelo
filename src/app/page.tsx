"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { ChatInput } from "@/components/chat-input";
import { PromptCard } from "@/components/prompt-card";
import { IconNelo } from "@/components/icons";
import { useLocale } from "@/lib/i18n/use-locale";

export default function LandingPage() {
  const router = useRouter();
  const { t } = useLocale();

  const quickPrompts = [
    {
      icon: "cottage" as const,
      text: t("landing.quickPrompt1"),
    },
    {
      icon: "location" as const,
      text: t("landing.quickPrompt2"),
    },
  ];

  const proPrompts = [
    {
      icon: "upload" as const,
      text: t("landing.proPrompt1"),
    },
    {
      icon: "architect" as const,
      text: t("landing.proPrompt2"),
    },
  ];

  function handleSend(message: string) {
    const encoded = encodeURIComponent(message);
    router.push(`/chat?q=${encoded}`);
  }

  function handlePromptClick(text: string) {
    handleSend(text);
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar activeItem="dashboard" />

      <main className="flex-1 flex flex-col relative min-h-screen overflow-hidden bg-background">
        <Header />

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full relative grid-lines">
          {/* Nelo avatar */}
          <div className="w-24 h-24 glass-card rounded-3xl flex items-center justify-center mb-8 relative border-2 border-white/50">
            <IconNelo className="w-12 h-12 text-on-surface" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full border-4 border-background" />
          </div>

          <h1 className="text-5xl md:text-6xl font-black font-headline tracking-tight text-on-surface mb-4 uppercase italic text-center text-balance">
            {t("landing.greeting").replace("Nelo", "")}<span className="bg-primary px-2">Nelo</span>.
          </h1>
          <p className="text-lg md:text-xl font-bold text-on-surface/50 font-headline uppercase tracking-tight mb-16 text-center">
            {t("landing.subtitle")}
          </p>

          {/* Prompt cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-4">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40 font-black px-1">
                {t("landing.sectionQuick")}
              </h2>
              {quickPrompts.map((p) => (
                <PromptCard
                  key={p.text}
                  icon={p.icon}
                  text={p.text}
                  onClick={() => handlePromptClick(p.text)}
                />
              ))}
            </div>
            <div className="space-y-4">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40 font-black px-1">
                {t("landing.sectionPro")}
              </h2>
              {proPrompts.map((p) => (
                <PromptCard
                  key={p.text}
                  icon={p.icon}
                  text={p.text}
                  onClick={() => handlePromptClick(p.text)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Chat input footer */}
        <footer className="p-6 pb-24 md:p-10 w-full max-w-5xl mx-auto">
          <ChatInput onSend={handleSend} />
        </footer>
      </main>

      <MobileNav activeTab="chat" />
    </div>
  );
}
