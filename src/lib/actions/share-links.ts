"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createShareLink,
  getShareLinkByEstimateId,
  deleteShareLink,
} from "@/lib/db/share-links";
import type { ShareLinkRow } from "@/lib/db/share-links";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get or create a share link for an estimate.
 * D-04: returns existing link if one already exists (no duplicates per estimate_id).
 */
export async function createShareLinkAction(
  estimateId: string,
  expiresInDays: number | null,
): Promise<ShareLinkRow | { error: string }> {
  if (!UUID_RE.test(estimateId)) return { error: "Invalid estimate ID" };
  try {
    const supabase = await createClient();
    // D-04: check for existing link first
    const existing = await getShareLinkByEstimateId(estimateId, supabase);
    if (existing) return existing;
    const link = await createShareLink(estimateId, expiresInDays, supabase);
    revalidatePath("/chat");
    return link;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create share link",
    };
  }
}

/**
 * Get the existing share link for an estimate (if any).
 * Returns null if none exists.
 */
export async function getShareLinkForEstimateAction(
  estimateId: string,
): Promise<ShareLinkRow | null | { error: string }> {
  if (!UUID_RE.test(estimateId)) return { error: "Invalid estimate ID" };
  try {
    const supabase = await createClient();
    return await getShareLinkByEstimateId(estimateId, supabase);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to get share link",
    };
  }
}

/**
 * Delete a share link by its ID.
 */
export async function deleteShareLinkAction(
  shareLinkId: string,
): Promise<{ error?: string }> {
  if (!UUID_RE.test(shareLinkId)) return { error: "Invalid share link ID" };
  try {
    const supabase = await createClient();
    await deleteShareLink(shareLinkId, supabase);
    revalidatePath("/chat");
    return {};
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to delete share link",
    };
  }
}
