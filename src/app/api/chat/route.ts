import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { chatModel } from "@/lib/ai/models";
import { createChatTools } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/pricing/system-prompt-builder";
import type { Locale } from "@/lib/i18n/types";

export const maxDuration = 60;

const MAX_MESSAGES = 100;
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  // Guard against oversized payloads
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return Response.json(
      { error: "Request too large", maxBytes: MAX_BODY_BYTES },
      { status: 413 },
    );
  }

  let messages: UIMessage[];
  const headerLocale = req.headers.get("x-locale");
  const locale: Locale = headerLocale === "es" ? "es" : "en";
  try {
    const body = await req.json();
    messages = body.messages;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages must be a non-empty array" },
      { status: 400 },
    );
  }

  if (messages.length > MAX_MESSAGES) {
    return Response.json(
      { error: `Too many messages (max ${MAX_MESSAGES})` },
      { status: 400 },
    );
  }

  const userMode = detectUserMode(messages);
  const modelMessages = await convertToModelMessages(messages);

  try {
    const result = streamText({
      model: chatModel,
      system: buildSystemPrompt(userMode, locale),
      messages: modelMessages,
      tools: createChatTools(locale),
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { error: "Failed to process chat request", detail: message },
      { status: 500 },
    );
  }
}

/**
 * Simple heuristic to detect if the user is a professional.
 * Looks for technical construction terms in recent messages.
 */
function detectUserMode(messages: UIMessage[]): "consumer" | "professional" {
  const technicalTerms = [
    "platea", "vigueta", "encadenado", "h°a°", "hormigón armado",
    "steel frame", "fenólico", "replanteo", "contrapiso", "revoque",
    "capa aisladora", "hidrófugo", "dinteles", "carpeta", "mampostería",
    "azotado", "presupuesto de obra", "cómputo", "incidencia",
    "arquitecto", "ingeniero", "profesional", "estudio de arquitectura",
  ];

  const recentText = messages
    .slice(-5)
    .filter((m) => m.role === "user")
    .map((m) => {
      return m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ");
    })
    .join(" ")
    .toLowerCase();

  const matchCount = technicalTerms.filter((term) =>
    recentText.includes(term),
  ).length;

  return matchCount >= 2 ? "professional" : "consumer";
}
