/**
 * Cache Manager Tests
 *
 * Tests for readCache, writeCache, isCacheStale, getCacheDir
 * Uses a temporary directory for test isolation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// We import after setting up any env to ensure module picks up env
import {
  readCache,
  writeCache,
  isCacheStale,
  getCacheDir,
  type CacheEnvelope,
} from "../cache-manager";

describe("getCacheDir", () => {
  const originalVercel = process.env.VERCEL;

  afterEach(() => {
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
    vi.resetModules();
  });

  it("returns /tmp/pricing-cache when VERCEL env is set", () => {
    process.env.VERCEL = "1";
    // Re-import to pick up env change
    const result = getCacheDir();
    expect(result).toBe("/tmp/pricing-cache");
  });

  it("returns src/lib/pricing/cache path when VERCEL is NOT set", () => {
    delete process.env.VERCEL;
    const result = getCacheDir();
    expect(result).toBe(
      path.join(process.cwd(), "src/lib/pricing/cache"),
    );
  });
});

describe("readCache", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nelo-cache-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null when file does not exist", () => {
    const result = readCache("nonexistent", tmpDir);
    expect(result).toBeNull();
  });

  it("returns null when file is empty", () => {
    fs.writeFileSync(path.join(tmpDir, "empty.json"), "");
    const result = readCache("empty", tmpDir);
    expect(result).toBeNull();
  });

  it("returns null when file contains invalid JSON", () => {
    fs.writeFileSync(path.join(tmpDir, "bad.json"), "not-valid-json");
    const result = readCache("bad", tmpDir);
    expect(result).toBeNull();
  });

  it("returns parsed CacheEnvelope when file exists and is valid", () => {
    const envelope: CacheEnvelope<{ value: number }> = {
      data: { value: 42 },
      lastFetched: "2026-03-21T00:00:00.000Z",
      source: "test",
    };
    fs.writeFileSync(
      path.join(tmpDir, "my-cache.json"),
      JSON.stringify(envelope),
    );

    const result = readCache<{ value: number }>("my-cache", tmpDir);
    expect(result).not.toBeNull();
    expect(result!.data.value).toBe(42);
    expect(result!.lastFetched).toBe("2026-03-21T00:00:00.000Z");
    expect(result!.source).toBe("test");
  });
});

describe("writeCache", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nelo-cache-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes data wrapped in CacheEnvelope with lastFetched timestamp", () => {
    const data = { rate: 1425 };
    writeCache("blue-rate", data, "test-source", tmpDir);

    const filePath = path.join(tmpDir, "blue-rate.json");
    expect(fs.existsSync(filePath)).toBe(true);

    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(raw.data).toEqual(data);
    expect(raw.source).toBe("test-source");
    expect(raw.lastFetched).toBeDefined();
    expect(() => new Date(raw.lastFetched)).not.toThrow();
  });

  it("after writeCache, readCache returns the data", () => {
    const data = { rate: 1425, currency: "ARS" };
    writeCache("blue-rate", data, "dolar-api", tmpDir);

    const result = readCache<typeof data>("blue-rate", tmpDir);
    expect(result).not.toBeNull();
    expect(result!.data.rate).toBe(1425);
    expect(result!.data.currency).toBe("ARS");
    expect(result!.source).toBe("dolar-api");
  });

  it("creates the cache directory if it does not exist", () => {
    const nestedDir = path.join(tmpDir, "nested", "deep");
    expect(fs.existsSync(nestedDir)).toBe(false);

    writeCache("test-key", { x: 1 }, "test", nestedDir);

    expect(fs.existsSync(nestedDir)).toBe(true);
    expect(fs.existsSync(path.join(nestedDir, "test-key.json"))).toBe(true);
  });
});

describe("isCacheStale", () => {
  it("returns true when lastFetched is older than maxAgeMs (24 hours)", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const envelope: CacheEnvelope<unknown> = {
      data: null,
      lastFetched: twoDaysAgo,
      source: "test",
    };

    expect(isCacheStale(envelope, 86400000)).toBe(true);
  });

  it("returns false when lastFetched is within maxAgeMs (24 hours)", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const envelope: CacheEnvelope<unknown> = {
      data: null,
      lastFetched: oneHourAgo,
      source: "test",
    };

    expect(isCacheStale(envelope, 86400000)).toBe(false);
  });

  it("returns true when lastFetched is exactly at the epoch (seed file)", () => {
    const envelope: CacheEnvelope<unknown> = {
      data: null,
      lastFetched: "1970-01-01T00:00:00.000Z",
      source: "seed",
    };

    expect(isCacheStale(envelope, 86400000)).toBe(true);
  });

  it("returns false when lastFetched is just now", () => {
    const now = new Date().toISOString();
    const envelope: CacheEnvelope<unknown> = {
      data: null,
      lastFetched: now,
      source: "test",
    };

    expect(isCacheStale(envelope, 86400000)).toBe(false);
  });
});
