/**
 * Nelo — Daily Price Refresh Cron Endpoint
 *
 * Called by Vercel Cron at 8:00 UTC daily (5:00 AM Argentina time).
 * Refreshes blue dollar rate and MercadoLibre material prices.
 *
 * Per D-07: daily automated refresh for API-sourced data.
 * Per D-21: auto-refresh NEVER touches manual-overrides.json.
 *
 * Vercel Cron sends Authorization: Bearer <CRON_SECRET> header.
 * Set CRON_SECRET in Vercel environment variables.
 */

import { refreshDynamicSources } from "@/lib/data-sources/refresh-all";

export async function GET(req: Request) {
  // Verify cron secret — Vercel sends this header automatically
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await refreshDynamicSources();

  return Response.json(result);
}
