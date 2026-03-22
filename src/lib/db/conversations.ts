import { createClient } from "@/lib/supabase/server";
import type { UIMessage } from "ai";

export type ProjectSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

/**
 * List all projects for the authenticated user, sorted by most recently updated.
 * RLS enforces user scoping — no userId param needed.
 */
export async function listProjects(): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`listProjects failed: ${error.message}`);
  return data ?? [];
}

/**
 * Load all messages for a conversation.
 * Returns [] for new projects (no conversation row yet).
 * Returns null if the project doesn't exist or belongs to another user (RLS blocks it).
 */
export async function loadConversation(
  projectId: string,
  _userId: string, // userId implicit via RLS — kept for readability
): Promise<UIMessage[] | null> {
  const supabase = await createClient();

  // First check the project exists (RLS will block if wrong user)
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (!project) return null;

  // Load the conversation row
  const { data: conversation } = await supabase
    .from("conversations")
    .select("messages")
    .eq("project_id", projectId)
    .single();

  if (!conversation) return []; // New project, no conversation yet
  return (conversation.messages as UIMessage[]) ?? [];
}

/**
 * Upsert the full UIMessage[] array for a conversation.
 * Called from onFinish — runs after stream completes.
 * Strips base64 data URLs before storing to prevent large JSONB rows.
 */
export async function saveConversation(
  projectId: string,
  _userId: string,
  messages: UIMessage[],
): Promise<void> {
  const supabase = await createClient();

  // Strip base64 data URLs before storing — prevents multi-MB rows
  const sanitizedMessages = stripBase64Attachments(messages);

  // Auto-title from first user message if project title is still the default
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (firstUserMsg) {
    const titleText = getTextFromMessage(firstUserMsg).slice(0, 60);
    if (titleText) {
      // updated_at handled by DB trigger (BEFORE UPDATE)
      const { error: titleError } = await supabase
        .from("projects")
        .update({ title: titleText })
        .eq("id", projectId)
        .eq("title", "New Project"); // Only update if still the default
      if (titleError) {
        console.error(`Failed to update project title for ${projectId}:`, titleError.message);
      }
    }
  }

  // Upsert conversations row (one row per project)
  // updated_at included for INSERT case; DB trigger overwrites on UPDATE
  const { error: upsertError } = await supabase
    .from("conversations")
    .upsert(
      {
        project_id: projectId,
        messages: sanitizedMessages as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" },
    );
  if (upsertError) {
    console.error(`saveConversation upsert failed for project ${projectId}:`, upsertError.message);
    throw new Error(`saveConversation failed: ${upsertError.message}`);
  }
}

/**
 * Strip base64 data URLs from experimental_attachments.
 * Replaces data: URLs with "[image-stripped]" placeholder.
 * Non-base64 URLs (https://, etc.) are preserved unchanged.
 */
export function stripBase64Attachments(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => {
    if (!msg.experimental_attachments?.length) return msg;
    return {
      ...msg,
      experimental_attachments: msg.experimental_attachments.map((att) => {
        if (att.url?.startsWith("data:")) {
          return { ...att, url: "[image-stripped]" };
        }
        return att;
      }),
    };
  });
}

/**
 * Extract all text content from a UIMessage's parts array.
 * Concatenates all text parts and trims whitespace.
 */
export function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}
