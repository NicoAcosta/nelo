"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { ChatInput } from "@/components/chat-input";
import { PromptCard } from "@/components/prompt-card";
import { IconNelo } from "@/components/icons";

const quickPrompts = [
  {
    icon: "cottage" as const,
    text: "How much does it cost to build a 100m² house?",
  },
  {
    icon: "location" as const,
    text: "I want to know the price per m² in AMBA.",
  },
];

const proPrompts = [
  {
    icon: "upload" as const,
    text: "Upload a floor plan for a detailed estimate",
  },
  {
    icon: "architect" as const,
    text: "Full estimate with plaster, insulation and finishes.",
  },
];

export default function LandingPage() {
  const router = useRouter();

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

          <h1 className="text-5xl md:text-6xl font-black font-headline tracking-tight text-on-surface mb-4 uppercase italic text-center">
            Hi, I&apos;m <span className="bg-primary px-2">Nelo</span>.
          </h1>
          <p className="text-lg md:text-xl font-bold text-on-surface/50 font-headline uppercase tracking-tight mb-16 text-center">
            What do you want to build today?
          </p>

          {/* Prompt cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40 font-black px-1">
                Quick Queries
              </h3>
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
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40 font-black px-1">
                Pro Tools
              </h3>
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
