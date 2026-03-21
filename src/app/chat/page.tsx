"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { IconNelo } from "@/components/icons";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  const { messages, status, sendMessage } = useChat({ transport });

  const isStreaming = status === "streaming" || status === "submitted";

  // Send initial query from landing page prompt cards
  useEffect(() => {
    if (initialQuery && !hasSentInitial && messages.length === 0) {
      setHasSentInitial(true);
      sendMessage({ text: decodeURIComponent(initialQuery) });
    }
  }, [initialQuery, hasSentInitial, messages.length, sendMessage]);

  // Auto-scroll when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend(text: string) {
    sendMessage({ text });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar activeItem="estimates" />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#eeeeee]">
        <Header projectName={messages.length > 0 ? "New Estimate" : undefined} />

        {/* Messages area */}
        <section className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 max-w-5xl mx-auto w-full">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 glass-card rounded-xl flex items-center justify-center mb-6">
                <IconNelo className="w-7 h-7 text-on-surface" />
              </div>
              <p className="text-on-surface/40 text-sm font-medium">
                Tell me about your construction project...
              </p>
            </div>
          )}

          {messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((message) => {
              const textContent = message.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("");

              if (!textContent) return null;

              return (
                <ChatMessage
                  key={message.id}
                  role={message.role as "user" | "assistant"}
                  content={textContent}
                />
              );
            })}

          {isStreaming && messages.length > 0 && (
            <div className="flex gap-6 max-w-3xl">
              <div className="w-10 h-10 rounded-lg bg-outline/30 flex items-center justify-center flex-shrink-0">
                <IconNelo className="w-5 h-5 text-on-surface animate-pulse" />
              </div>
              <div className="glass-card rounded-2xl p-6 border border-white/40">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* Input */}
        <div className="p-6 bg-transparent relative z-10">
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </div>
      </main>

      <MobileNav activeTab="chat" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <IconNelo className="w-10 h-10 text-on-surface animate-pulse" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
