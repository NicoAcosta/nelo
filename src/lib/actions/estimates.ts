"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  listEstimates,
  getEstimate,
  updateEstimateLabel,
} from "@/lib/db/estimates";
import type { EstimateSummary, EstimateRow } from "@/lib/db/estimates";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listEstimatesAction(
  conversationId: string,
): Promise<EstimateSummary[] | { error: string }> {
  if (!UUID_RE.test(conversationId)) return { error: "Invalid conversation ID" };
  const supabase = await createClient();
  return listEstimates(conversationId, supabase);
}

export async function getEstimateAction(
  estimateId: string,
): Promise<EstimateRow | { error: string } | null> {
  if (!UUID_RE.test(estimateId)) return { error: "Invalid estimate ID" };
  const supabase = await createClient();
  return getEstimate(estimateId, supabase);
}

export async function updateEstimateLabelAction(
  estimateId: string,
  label: string,
): Promise<{ error?: string }> {
  if (!UUID_RE.test(estimateId)) return { error: "Invalid estimate ID" };
  const trimmed = label.trim();
  if (!trimmed) return { error: "Label cannot be empty" };
  if (trimmed.length > 100) return { error: "Label too long" };
  const supabase = await createClient();
  try {
    await updateEstimateLabel(estimateId, trimmed, supabase);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update label",
    };
  }
  revalidatePath("/chat");
  return {};
}
