import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-only use.
 * Bypasses RLS — use only in server code where user auth is not available
 * (e.g., share page fetching estimates anonymously via service role).
 *
 * Never import from client components.
 * Each call creates a fresh client (avoids stale state in serverless).
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
