/**
 * Nelo — Cache Manager
 *
 * Generic read/write/staleness management for JSON cache files.
 *
 * Cache files are committed to git as seed data (with lastFetched: 1970-01-01).
 * At runtime, fresh data is written to:
 *   - /tmp/pricing-cache on Vercel (read-only filesystem; only /tmp is writable)
 *   - src/lib/pricing/cache locally (development)
 *
 * Read logic: tries getCacheDir() first, falls back to committed src/ path for seed reads.
 */

import * as fs from "fs";
import * as path from "path";

/** Wrapper for any cached data value */
export interface CacheEnvelope<T> {
  data: T;
  lastFetched: string; // ISO timestamp
  source: string;
}

/**
 * Returns the directory to write cache files to.
 *
 * CRITICAL: Vercel's serverless filesystem is read-only in production.
 * src/ cannot be written to at runtime. /tmp is the only writable directory on Vercel.
 */
export function getCacheDir(): string {
  if (process.env.VERCEL) {
    return "/tmp/pricing-cache";
  }
  return path.join(process.cwd(), "src/lib/pricing/cache");
}

/**
 * Reads a cache file by name.
 *
 * Tries getCacheDir() first (runtime writes), then falls back to the committed
 * src/lib/pricing/cache path (seed files). Returns null on any error.
 */
export function readCache<T>(
  name: string,
  cacheDir?: string,
): CacheEnvelope<T> | null {
  const dirs = cacheDir
    ? [cacheDir]
    : [getCacheDir(), path.join(process.cwd(), "src/lib/pricing/cache")];

  for (const dir of dirs) {
    const filePath = path.join(dir, `${name}.json`);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      if (!raw || raw.trim() === "") continue;
      const parsed = JSON.parse(raw) as CacheEnvelope<T>;
      return parsed;
    } catch {
      // File missing, empty, or invalid JSON — try next dir
      continue;
    }
  }

  return null;
}

/**
 * Writes data wrapped in a CacheEnvelope to a JSON file.
 *
 * Creates the directory if it does not exist.
 * Always writes to getCacheDir() (or the provided cacheDir).
 */
export function writeCache<T>(
  name: string,
  data: T,
  source: string,
  cacheDir?: string,
): void {
  const dir = cacheDir ?? getCacheDir();
  fs.mkdirSync(dir, { recursive: true });

  const envelope: CacheEnvelope<T> = {
    data,
    lastFetched: new Date().toISOString(),
    source,
  };

  const filePath = path.join(dir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(envelope, null, 2), "utf-8");
}

/**
 * Returns true if the cache entry is older than maxAgeMs milliseconds.
 */
export function isCacheStale(
  envelope: CacheEnvelope<unknown>,
  maxAgeMs: number,
): boolean {
  const lastFetched = new Date(envelope.lastFetched).getTime();
  return Date.now() - lastFetched > maxAgeMs;
}
