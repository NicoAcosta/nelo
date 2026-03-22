import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { chatModel } from "@/lib/ai/models";
import { createChatTools } from "@/lib/ai/tools";
import { fixDataUrlFileParts } from "@/lib/ai/fix-data-url-file-parts";
import { buildSystemPrompt } from "@/lib/pricing/system-prompt-builder";
import type { Locale } from "@/lib/i18n/types";
import { createClient } from "@/lib/supabase/server";
import { saveConversation } from "@/lib/db/conversations";
import { saveEstimate, getConversationId } from "@/lib/db/estimates";

export const maxDuration = 60;

const MAX_MESSAGES = 100;
const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  // Auth guard — must have a valid user session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Guard against oversized payloads
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return Response.json(
      { error: "Request too large", maxBytes: MAX_BODY_BYTES },
      { status: 413 },
    );
  }

  let messages: UIMessage[];
  let projectId: string | undefined;
  const headerLocale = req.headers.get("x-locale");
  const locale: Locale = headerLocale === "es" ? "es" : "en";
  try {
    const body = await req.json();
    messages = body.messages;
    projectId = body.projectId; // passed by chat-content.tsx transport
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

  // Resolve conversation ID for estimate persistence (per D-01)
  let conversationId: string | undefined;
  if (projectId) {
    try {
      conversationId =
        (await getConversationId(projectId, supabase)) ?? undefined;
    } catch {
      // Non-critical — estimates won't be persisted for this request
    }
  }

  const userMode = detectUserMode(messages);
  const modelMessages = await convertToModelMessages(messages);
  fixDataUrlFileParts(modelMessages);

  try {
    const result = streamText({
      model: chatModel,
      system: buildSystemPrompt(userMode, locale),
      messages: modelMessages,
      tools: createChatTools(locale, {
        conversationId,
        saveEstimate: conversationId
          ? (params) => saveEstimate(params, supabase)
          : undefined,
      }),
      stopWhen: stepCountIs(5),
    });

    // CRITICAL: consumeStream() BEFORE return — ensures onFinish fires even on tab close
    result.consumeStream(); // do NOT await

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: allMessages }) => {
        try {
          if (projectId && user) {
            await saveConversation(projectId, user.id, allMessages, supabase);
          }
        } catch (err) {
          console.error("Failed to persist conversation:", err);
        }
      },
    });
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
