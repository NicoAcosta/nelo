import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

export interface ShareLinkRow {
  id: string;
  estimate_id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
}

export interface CheckTokenResult {
  token_exists: boolean;
  token_expired: boolean;
}

/**
 * Look up a share link by token using the get_share_link security-definer RPC.
 * Returns null if not found or expired.
 */
export async function getShareLink(
  token: string,
  client?: SupabaseServerClient,
): Promise<ShareLinkRow | null> {
  const supabase = client ?? (await createClient());

  const { data, error } = await supabase.rpc("get_share_link", {
    share_token: token,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as ShareLinkRow;
}

/**
 * Find the existing share link for an estimate (if any).
 * Used to implement D-04: no-duplicates per estimate_id.
 * Returns null if none exists.
 */
export async function getShareLinkByEstimateId(
  estimateId: string,
  client?: SupabaseServerClient,
): Promise<ShareLinkRow | null> {
  const supabase = client ?? (await createClient());

  const { data, error } = await supabase
    .from("share_links")
    .select("id, estimate_id, token, expires_at, created_at")
    .eq("estimate_id", estimateId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ShareLinkRow;
}

/**
 * Create a new share link for an estimate.
 * Generates a 12-character nanoid token.
 * Pass expiresInDays=null for no expiration.
 */
export async function createShareLink(
  estimateId: string,
  expiresInDays: number | null,
  client?: SupabaseServerClient,
): Promise<ShareLinkRow> {
  const supabase = client ?? (await createClient());
  const token = nanoid(12);
  const expires_at =
    expiresInDays != null
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null;

  const { data, error } = await supabase
    .from("share_links")
    .insert({ estimate_id: estimateId, token, expires_at })
    .select("id, estimate_id, token, expires_at, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as ShareLinkRow;
}

/**
 * Delete a share link by its ID.
 * Throws on failure.
 */
export async function deleteShareLink(
  shareLinkId: string,
  client?: SupabaseServerClient,
): Promise<void> {
  const supabase = client ?? (await createClient());

  const { error } = await supabase
    .from("share_links")
    .delete()
    .eq("id", shareLinkId);

  if (error) throw new Error(error.message);
}

/**
 * Check whether a share token exists and/or is expired.
 * Uses the check_share_token security-definer RPC (migration 0006).
 * Enables D-12: share page can show "expired" vs "not found" messages.
 */
export async function checkShareToken(
  token: string,
  client?: SupabaseServerClient,
): Promise<CheckTokenResult> {
  const supabase = client ?? (await createClient());

  const { data, error } = await supabase.rpc("check_share_token", {
    share_token: token,
  });

  if (error || !data || data.length === 0) {
    return { token_exists: false, token_expired: false };
  }

  return data[0] as CheckTokenResult;
}
