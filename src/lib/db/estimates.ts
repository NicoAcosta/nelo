import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectInputs, Estimate } from "@/lib/estimate/types";

export interface EstimateSummary {
  id: string;
  version: number;
  label: string | null;
  total_price: number;
  price_per_m2: number;
  created_at: string;
}

export interface EstimateRow {
  id: string;
  version: number;
  label: string | null;
  project_inputs: ProjectInputs;
  result: Estimate;
  created_at: string;
}

export interface SaveEstimateParams {
  conversationId: string;
  projectInputs: ProjectInputs;
  result: Estimate;
}

/**
 * Save a new estimate snapshot for a conversation.
 * Auto-increments version by querying MAX(version) for the conversation.
 * Handles the first estimate (MAX returns null) via (maxRow?.version ?? 0) + 1.
 */
export async function saveEstimate(
  params: SaveEstimateParams,
  client?: SupabaseServerClient,
): Promise<{ id: string; version: number }> {
  const supabase = client ?? (await createClient());
  const { conversationId, projectInputs, result } = params;

  // Query MAX(version) for this conversation to determine next version
  const { data: maxRow } = await supabase
    .from("estimates")
    .select("version")
    .eq("conversation_id", conversationId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (maxRow?.version ?? 0) + 1;

  const { data, error } = await supabase
    .from("estimates")
    .insert({
      conversation_id: conversationId,
      version: nextVersion,
      label: null,
      project_inputs: projectInputs,
      result,
    })
    .select("id, version")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { id: data.id, version: data.version };
}

/**
 * List all estimates for a conversation, ordered newest-first (version DESC).
 * Returns [] when no estimates exist.
 */
export async function listEstimates(
  conversationId: string,
  client?: SupabaseServerClient,
): Promise<EstimateSummary[]> {
  const supabase = client ?? (await createClient());

  const { data } = await supabase
    .from("estimates")
    .select("id, version, label, result, created_at")
    .eq("conversation_id", conversationId)
    .order("version", { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const resultObj = row.result as Estimate;
    return {
      id: row.id,
      version: row.version,
      label: row.label,
      total_price: resultObj.totalPrice,
      price_per_m2: resultObj.pricePerM2,
      created_at: row.created_at,
    };
  });
}

/**
 * Fetch a single estimate by ID.
 * Returns null if not found.
 */
export async function getEstimate(
  estimateId: string,
  client?: SupabaseServerClient,
): Promise<EstimateRow | null> {
  const supabase = client ?? (await createClient());

  const { data, error } = await supabase
    .from("estimates")
    .select("id, version, label, project_inputs, result, created_at")
    .eq("id", estimateId)
    .single();

  if (error?.code === "PGRST116") return null;
  if (!data) return null;

  return data as EstimateRow;
}

/**
 * Update the label for an estimate.
 * Throws on update failure.
 */
export async function updateEstimateLabel(
  estimateId: string,
  label: string,
  client?: SupabaseServerClient,
): Promise<void> {
  const supabase = client ?? (await createClient());

  const { error } = await supabase
    .from("estimates")
    .update({ label })
    .eq("id", estimateId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the conversation UUID for a project.
 * Returns null if no conversation exists.
 */
export async function getConversationId(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<string | null> {
  const supabase = client ?? (await createClient());

  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("project_id", projectId)
    .single();

  return data?.id ?? null;
}
