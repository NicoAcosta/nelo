import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { chatModel } from "@/lib/ai/models";
import { chatTools } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/pricing/system-prompt-builder";

export const maxDuration = 60;

export async function POST(req: Request) {
  let messages: UIMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages must be a non-empty array", { status: 400 });
  }

  const userMode = detectUserMode(messages);
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: chatModel,
    system: buildSystemPrompt(userMode),
    messages: modelMessages,
    tools: chatTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
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
