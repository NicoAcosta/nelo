"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ChatOptions } from "@/components/chat-options";
import { CostBreakdown } from "@/components/cost-breakdown";
import { EstimatePreview } from "@/components/estimate-preview";
import { FloorPlanPanel } from "@/components/floor-plan-panel";
import { IconNelo } from "@/components/icons";
import { buildPreamble } from "@/lib/documents/preamble";
import { filterClaudeCompatible } from "@/lib/documents/filter-compatible";
import { retrievePendingFiles } from "@/lib/pending-files";
import type { DocumentAnalysis } from "@/lib/documents/types";
import { getSelectedValue } from "./get-selected-value";
import { useLocale } from "@/lib/i18n/use-locale";
import type { Estimate, FloorPlanExtraction } from "@/lib/estimate/types";

interface FloorPlanResult {
  extraction: FloorPlanExtraction;
  message: string;
}

function renderToolResult(
  toolName: string,
  result: unknown,
  id: string,
  renderedImageUrl?: string,
) {
  if (toolName === "runEstimate" && result) {
    const estimate = result as Estimate & {
      _persistedId?: string;
      _version?: number;
    };
    return (
      <CostBreakdown
        estimate={estimate}
        persistedId={estimate._persistedId}
        version={estimate._version}
        totalVersions={estimate._version}
        projectId={id}
      />
    );
  }
  if (toolName === "analyzeFloorPlan" && result) {
    const data = result as FloorPlanResult;
    return (
      <FloorPlanPanel
        extraction={data.extraction}
        imageUrl={renderedImageUrl}
        onConfirm={() => {}}
      />
    );
  }
  return null;
}

interface ChatContentProps {
  id: string;
  initialMessages: UIMessage[];
}

export function ChatContent({ id, initialMessages }: ChatContentProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const hasSentInitialRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const renderedImagesRef = useRef<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);
  const { locale, t } = useLocale();

  // Use a ref so the transport reads the latest locale without being recreated
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { projectId: id },
        headers: () => ({ "x-locale": localeRef.current }),
      }),
  );

  const { messages, status, error, sendMessage } = useChat({
    id,
    messages: initialMessages,
    transport,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Send initial query from landing page (with optional pending files)
  useEffect(() => {
    if (!initialQuery || hasSentInitialRef.current || messages.length > 0) return;
    hasSentInitialRef.current = true;

    const hasPendingFiles = searchParams.get("files") === "pending";
    if (hasPendingFiles) {
      retrievePendingFiles()
        .then((files) => {
          if (files && files.length > 0) {
            const dt = new DataTransfer();
            for (const f of files) dt.items.add(f);
            handleSend(initialQuery, dt.files);
          } else {
            sendMessage({ text: initialQuery });
          }
        })
        .catch(() => {
          sendMessage({ text: initialQuery });
        });
    } else {
      sendMessage({ text: initialQuery });
    }
  }, [initialQuery, messages.length, sendMessage]);

  // Track scroll position to avoid fighting user scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 80;
      isNearBottomRef.current =
        el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll only when user is near bottom
  const lastMessagePartsCount = messages.at(-1)?.parts?.length ?? 0;
  const lastMessageContent =
    messages
      .at(-1)
      ?.parts?.filter(
        (p): p is { type: "text"; text: string } => p.type === "text",
      )
      .map((p) => p.text)
      .join("") ?? "";

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages.length, lastMessageContent, lastMessagePartsCount]);

  async function handleSend(text: string, files?: FileList) {
    // Always scroll to bottom when user sends a message
    isNearBottomRef.current = true;
    if (files && files.length > 0) {
      setIsProcessing(true);
      try {
        // Upload to document processing route
        const formData = new FormData();
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }
        const response = await fetch("/api/documents/process", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          // Fall back to sending only Claude-compatible files (images/PDFs)
          const compatible = filterClaudeCompatible(Array.from(files));
          if (compatible.length > 0) {
            const dt = new DataTransfer();
            for (const f of compatible) dt.items.add(f);
            sendMessage({ text, files: dt.files });
          } else {
            sendMessage({ text });
          }
          return;
        }

        const { results } = await response.json();

        // Build preamble from all results with structured data
        const PREAMBLE_MARKER = "<!-- doc-analysis -->";
        const preambles = results
          .map((r: DocumentAnalysis) => buildPreamble(r))
          .filter(Boolean);
        const preambleText =
          preambles.length > 0
            ? `${PREAMBLE_MARKER}\n${preambles.join("\n\n")}\n${PREAMBLE_MARKER}\n\n${text}`
            : text;

        // Convert rendered images from base64 data URLs to File objects
        // so useChat sends the RENDERED PNGs to Claude (not the original DWG/DXF)
        const renderedFiles: File[] = results
          .filter((r: DocumentAnalysis) => r.renderedImage)
          .map((r: DocumentAnalysis, i: number) => {
            const base64 = r.renderedImage.split(",")[1];
            if (!base64) return null;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let j = 0; j < binary.length; j++)
              bytes[j] = binary.charCodeAt(j);
            return new File([bytes], `rendered-${i}.png`, {
              type: "image/png",
            });
          })
          .filter(Boolean) as File[];

        // Store first rendered image for FloorPlanPanel preview
        const firstImage = results.find(
          (r: DocumentAnalysis) => r.renderedImage,
        );
        if (firstImage) {
          renderedImagesRef.current = firstImage.renderedImage;
        }

        if (renderedFiles.length > 0) {
          const dt = new DataTransfer();
          for (const f of renderedFiles) dt.items.add(f);
          sendMessage({ text: preambleText, files: dt.files });
        } else {
          sendMessage({ text: preambleText });
        }
      } catch {
        // Fallback: send only Claude-compatible files (images/PDFs)
        const compatible = filterClaudeCompatible(Array.from(files));
        if (compatible.length > 0) {
          const dt = new DataTransfer();
          for (const f of compatible) dt.items.add(f);
          sendMessage({ text, files: dt.files });
        } else {
          sendMessage({ text });
        }
      } finally {
        setIsProcessing(false);
      }
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

    const toolNames = [
      "runEstimate",
      "analyzeFloorPlan",
      "collectProjectData",
      "presentOptions",
    ] as const;

    for (const part of message.parts) {
      if (part.type === "text") {
        textParts.push(part.text);
      } else {
        // AI SDK v6: tool parts use tool-<toolName> pattern
        for (const toolName of toolNames) {
          if (
            part.type === `tool-${toolName}` &&
            "state" in part &&
            part.state === "output-available"
          ) {
            if (toolName === "presentOptions") {
              const data = (
                part as {
                  output: {
                    questionId: string;
                    options: Array<{ value: string; label: string }>;
                  };
                }
              ).output;
              const selected = getSelectedValue(message, messages);
              const isLastAssistantMsg =
                message ===
                [...messages].reverse().find((m) => m.role === "assistant");
              toolResults.push(
                <div
                  key={`${message.id}-options-${toolResults.length}`}
                  className="mt-4"
                >
                  <ChatOptions
                    questionId={data.questionId}
                    options={data.options}
                    onSelect={(label) => handleSend(label)}
                    disabled={isStreaming || selected !== null}
                    selectedValue={selected}
                    isLatest={isLastAssistantMsg && selected === null}
                  />
                </div>,
              );
            } else {
              const rendered = renderToolResult(
                toolName,
                (part as { output: unknown }).output,
                id,
                renderedImagesRef.current,
              );
              if (rendered) {
                toolResults.push(
                  <div
                    key={`${message.id}-${toolName}-${toolResults.length}`}
                    className="mt-4"
                  >
                    {rendered}
                  </div>,
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
      <>
        {textContent && (
          <ChatMessage
            role={message.role as "user" | "assistant"}
            content={textContent}
          />
        )}
        {toolResults}
      </>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar activeItem="projects" />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
        <h1 className="sr-only">Nelo Chat — Construction Cost Estimator</h1>
        <Header
          projectName={
            messages.length > 0 ? t("header.newEstimate") : undefined
          }
        />

        {/* Messages area */}
        <div className="flex-1 min-h-0 relative">
          <section
            ref={scrollContainerRef}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="absolute inset-0 overflow-y-auto p-6 md:p-12 pb-20 md:pb-12 space-y-12 max-w-5xl mx-auto w-full"
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
                      className="px-4 py-2 glass-card rounded-xl text-xs font-semibold text-on-surface/60 hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-center gap-3 p-4 bg-error/10 rounded-xl border border-error/20 max-w-3xl mx-auto"
              >
                <p className="text-sm text-error font-medium flex-1">
                  {t("chat.errorMessage")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const lastUserMsg = [...messages]
                      .reverse()
                      .find((m) => m.role === "user");
                    const text =
                      lastUserMsg?.parts
                        ?.filter(
                          (p): p is { type: "text"; text: string } =>
                            p.type === "text",
                        )
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
              .map((message, i) => {
                const node = renderMessage(message);
                if (!node) return null;
                // Ensure a stable key even if message.id is empty
                return (
                  <div key={message.id || `msg-${i}`}>
                    {node}
                  </div>
                );
              })}

            {isProcessing && (
              <div className="flex gap-6 max-w-3xl">
                <div className="w-10 h-10 rounded-lg bg-outline/30 flex items-center justify-center flex-shrink-0">
                  <IconNelo className="w-5 h-5 text-on-surface animate-pulse" />
                </div>
                <div className="glass-card rounded-2xl p-6 border border-white/40">
                  <p className="text-sm text-on-surface/60 font-medium animate-pulse">
                    {t("chat.processingDocument")}
                  </p>
                </div>
              </div>
            )}

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
        </div>

        {/* Input */}
        <div className="p-6 pb-24 md:pb-6 bg-transparent relative z-10">
          <ChatInput onSend={handleSend} disabled={isStreaming || isProcessing} />
        </div>
      </main>

      <MobileNav activeTab="chat" />
    </div>
  );
}
