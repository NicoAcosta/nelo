import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import type { UIMessage } from "ai";
import type { Estimate, ProjectInputs } from "@/lib/estimate/types";

/**
 * Extended UIMessage type that includes runtime-only fields.
 * The AI SDK v6 UIMessage type uses a generic `metadata` field, but at runtime
 * messages can carry additional fields (experimental_attachments from v5 era,
 * floor-plan-ref data in metadata).
 */
type ExtUIMessage = UIMessage & {
  experimental_attachments?: Array<{ name?: string; url: string; contentType?: string }>;
};

/** Metadata shape for messages that carry floor plan storage references. */
export type FloorPlanRefMetadata = {
  floorPlanRefs?: Array<{ name: string; storagePath: string }>;
};

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

  // Single query: fetch project with its conversation via FK relationship
  const { data: project } = await supabase
    .from("projects")
    .select("id, conversations(messages)")
    .eq("id", projectId)
    .single();

  if (!project) return null; // RLS blocked or doesn't exist

  const conversations = project.conversations as
    | { messages: UIMessage[] }[]
    | undefined;
  const messages = (conversations?.[0]?.messages as UIMessage[]) ?? [];
  return injectSignedUrls(messages, supabase);
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
  client?: SupabaseServerClient,
): Promise<void> {
  const supabase = client ?? await createClient();

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
  }
}

/**
 * Strip base64 data URLs from experimental_attachments.
 * Replaces data: URLs with "[image-stripped]" placeholder.
 * Non-base64 URLs (https://, etc.) are preserved unchanged.
 */
export function stripBase64Attachments(messages: UIMessage[]): UIMessage[] {
  return (messages as ExtUIMessage[]).map((msg) => {
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
  }) as UIMessage[];
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

// ---------------------------------------------------------------------------
// Floor plan Storage utilities
// ---------------------------------------------------------------------------

/**
 * Build a Supabase Storage path for a floor plan file.
 * Format: floor-plans/{userId}/{projectId}/{nanoid}.{ext}
 * Extension is always lowercase.
 */
export function buildStoragePath(
  userId: string,
  projectId: string,
  fileName: string,
): string {
  const ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
  return `floor-plans/${userId}/${projectId}/${nanoid()}.${ext}`;
}

/**
 * Inject signed URLs into messages that have floor-plan-ref annotations.
 * Replaces "[image-stripped]" attachment URLs with 1-hour signed URLs from Supabase Storage.
 * Messages without floor-plan-ref annotations are returned unchanged.
 */
export async function injectSignedUrls(
  messages: UIMessage[],
  client?: SupabaseServerClient,
): Promise<UIMessage[]> {
  const supabase = client ?? (await createClient());

  return Promise.all(
    (messages as ExtUIMessage[]).map(async (msg) => {
      // Check metadata for floor-plan-ref entries with storagePath (D-18)
      const meta = msg.metadata as FloorPlanRefMetadata | undefined;
      const refs = meta?.floorPlanRefs?.filter((r) => r.storagePath);

      if (!refs?.length) return msg;

      // Build a map of fileName -> signedUrl
      const urlMap = new Map<string, string>();
      await Promise.all(
        refs.map(async (ref) => {
          const { data } = await supabase.storage
            .from("floor-plans")
            .createSignedUrl(ref.storagePath, 3600); // 1 hour
          if (data?.signedUrl) urlMap.set(ref.name, data.signedUrl);
        }),
      );

      if (!urlMap.size) return msg;
      if (!msg.experimental_attachments?.length) return msg;

      // Replace only "[image-stripped]" URLs — leave all other URLs intact
      return {
        ...msg,
        experimental_attachments: msg.experimental_attachments.map((att) => {
          if (
            att.url === "[image-stripped]" &&
            att.name &&
            urlMap.has(att.name)
          ) {
            return { ...att, url: urlMap.get(att.name)! };
          }
          return att;
        }),
      };
    }),
  ) as Promise<UIMessage[]>;
}

export interface EstimateData {
  estimate: Estimate;
  inputs: ProjectInputs;
}

/**
 * Extract the most recent runEstimate tool result from conversation messages.
 * Returns both the Estimate output and the ProjectInputs that were passed as args.
 * Returns null if no runEstimate tool call exists.
 */
export function extractEstimateFromMessages(
  messages: UIMessage[],
): EstimateData | null {
  let lastResult: EstimateData | null = null;

  for (const message of messages) {
    if (message.role !== "assistant" || !message.parts) continue;
    for (const part of message.parts) {
      if (
        part.type === "tool-runEstimate" &&
        "state" in part &&
        part.state === "output-available" &&
        "output" in part &&
        part.output
      ) {
        lastResult = {
          estimate: part.output as Estimate,
          inputs: ("args" in part ? part.args : {}) as ProjectInputs,
        };
      }
    }
  }

  return lastResult;
}
