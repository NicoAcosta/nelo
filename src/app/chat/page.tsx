"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ChatOptions } from "@/components/chat-options";
import { CostBreakdown } from "@/components/cost-breakdown";
import { FloorPlanPanel } from "@/components/floor-plan-panel";
import { IconNelo } from "@/components/icons";
import { getSelectedValue } from "./get-selected-value";
import { useLocale } from "@/lib/i18n/use-locale";
import type { Estimate, FloorPlanExtraction } from "@/lib/estimate/types";

interface FloorPlanResult {
  extraction: FloorPlanExtraction;
  message: string;
}

function renderToolResult(toolName: string, result: unknown) {
  if (toolName === "runEstimate" && result) {
    return <CostBreakdown estimate={result as Estimate} />;
  }
  if (toolName === "analyzeFloorPlan" && result) {
    const data = result as FloorPlanResult;
    return (
      <FloorPlanPanel
        extraction={data.extraction}
        onConfirm={() => {}}
      />
    );
  }
  return null;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { locale, t } = useLocale();

  // Use a ref so the transport reads the latest locale without being recreated
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const [transport] = useState(
    () => new DefaultChatTransport({
      api: "/api/chat",
      headers: () => ({ "x-locale": localeRef.current }),
    }),
  );

  const { messages, status, error, sendMessage } = useChat({ transport });

  const isStreaming = status === "streaming" || status === "submitted";

  // Send initial query from landing page prompt cards
  useEffect(() => {
    if (initialQuery && !hasSentInitial && messages.length === 0) {
      setHasSentInitial(true);
      sendMessage({ text: initialQuery });
    }
  }, [initialQuery, hasSentInitial, messages.length, sendMessage]);

  // Auto-scroll on new messages and during streaming
  const lastMessageContent = messages.at(-1)?.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("") ?? "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMessageContent]);

  function handleSend(text: string, files?: FileList) {
    if (files && files.length > 0) {
      sendMessage({ text, files });
    } else {
      sendMessage({ text });
    }
  }

  const promptSuggestions = [
    t("chat.promptSuggestion1"),
    t("chat.promptSuggestion2"),
  ];

  function renderMessage(message: UIMessage) {
    const textParts: string[] = [];
    const toolResults: React.ReactNode[] = [];

    const toolNames = ["runEstimate", "analyzeFloorPlan", "collectProjectData", "presentOptions"] as const;

    for (const part of message.parts) {
      if (part.type === "text") {
        textParts.push(part.text);
      } else {
        // AI SDK v6: tool parts use tool-<toolName> pattern
        for (const toolName of toolNames) {
          if (part.type === `tool-${toolName}` && "state" in part && part.state === "output-available") {
            if (toolName === "presentOptions") {
              const data = (part as { output: { questionId: string; options: Array<{ value: string; label: string }> } }).output;
              const selected = getSelectedValue(message, messages);
              const isLastAssistantMsg = message === [...messages].reverse().find((m) => m.role === "assistant");
              toolResults.push(
                <div key={`${message.id}-options-${toolResults.length}`} className="mt-4">
                  <ChatOptions
                    questionId={data.questionId}
                    options={data.options}
                    onSelect={(label) => handleSend(label)}
                    disabled={isStreaming || selected !== null}
                    selectedValue={selected}
                    isLatest={isLastAssistantMsg && selected === null}
                  />
                </div>
              );
            } else {
              const rendered = renderToolResult(toolName, (part as { output: unknown }).output);
              if (rendered) {
                toolResults.push(
                  <div key={`${message.id}-${toolName}-${toolResults.length}`} className="mt-4">
                    {rendered}
                  </div>
                );
              }
            }
          }
        }
      }
    }

    const textContent = textParts.join("");

    if (!textContent && toolResults.length === 0) return null;

    return (
      <div key={message.id}>
        {textContent && (
          <ChatMessage
            role={message.role as "user" | "assistant"}
            content={textContent}
          />
        )}
        {toolResults}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar activeItem="estimates" />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
        <h1 className="sr-only">Nelo Chat — Construction Cost Estimator</h1>
        <Header projectName={messages.length > 0 ? t("header.newEstimate") : undefined} />

        {/* Messages area */}
        <section
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className="flex-1 overflow-y-auto p-6 md:p-12 pb-20 md:pb-12 space-y-12 max-w-5xl mx-auto w-full"
        >
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 glass-card rounded-xl flex items-center justify-center mb-6">
                <IconNelo className="w-7 h-7 text-on-surface" />
              </div>
              <p className="text-on-surface/40 text-sm font-medium mb-8">
                {t("chat.emptySubtitle")}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {promptSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => handleSend(s)}
                    className="px-4 py-2 glass-card rounded-xl text-xs font-semibold text-on-surface/60 hover:text-on-surface hover:bg-surface-container-high transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-center gap-3 p-4 bg-error/10 rounded-xl border border-error/20 max-w-3xl mx-auto">
              <p className="text-sm text-error font-medium flex-1">
                {t("chat.errorMessage")}
              </p>
              <button
                type="button"
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                  const text = lastUserMsg?.parts
                    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                    .map((p) => p.text)
                    .join("") ?? "";
                  if (text) handleSend(text);
                }}
                className="px-3 py-1.5 bg-error/10 hover:bg-error/20 rounded-lg text-xs font-bold text-error transition-colors whitespace-nowrap"
              >
                {t("chat.retry")}
              </button>
            </div>
          )}

          {messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((message) => renderMessage(message))}

          {isStreaming && messages.length > 0 && !lastMessageContent && (
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
                <span className="sr-only">{t("chat.typing")}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* Input */}
        <div className="p-6 pb-24 md:pb-6 bg-transparent relative z-10">
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
