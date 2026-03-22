import type { UIMessage } from "ai";

/**
 * Determines if the user has already answered a question presented via ChatOptions.
 * Checks if the message immediately following the assistant's message is a user message,
 * and returns its text content (which matches the selected option label via auto-send).
 */
export function getSelectedValue(
  currentMessage: UIMessage,
  allMessages: UIMessage[],
): string | null {
  const msgIndex = allMessages.indexOf(currentMessage);
  const nextMessage = allMessages[msgIndex + 1];
  if (!nextMessage || nextMessage.role !== "user") return null;

  const userText = nextMessage.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();

  return userText || null;
}
