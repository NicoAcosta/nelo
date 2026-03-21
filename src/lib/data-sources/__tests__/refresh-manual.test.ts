/**
 * Tests for manual refresh functions — UOCRA and ICC cache updates.
 *
 * Key invariants:
 * - refreshUOCRA() writes UOCRA_RATES to "uocra-rates" cache
 * - refreshICC() writes ICC_HISTORY to "icc-history" cache
 * - refreshManualSources() runs both and returns a combined result
 * - Per-source errors are captured, not thrown
 *
 * Per D-08: UOCRA and ICC update less frequently (bimonthly / monthly),
 * so they use a manual script rather than automated cron.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock writeCache before importing module under test
vi.mock("@/lib/pricing/cache-manager", () => ({
  writeCache: vi.fn(),
  readCache: vi.fn().mockReturnValue(null), // indec-icc.ts calls readCache internally
}));

import { refreshUOCRA, refreshICC, refreshManualSources } from "../refresh-manual";
import { writeCache } from "@/lib/pricing/cache-manager";
import { UOCRA_RATES } from "../uocra";

const mockWriteCache = vi.mocked(writeCache);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("refreshUOCRA", () => {
  it("calls writeCache with uocra-rates and UOCRA_RATES data", async () => {
    const result = await refreshUOCRA();

    expect(mockWriteCache).toHaveBeenCalledWith(
      "uocra-rates",
      UOCRA_RATES,
      "manual-refresh",
    );
    expect(result.success).toBe(true);
  });

  it("returns updatedAt ISO timestamp", async () => {
    const result = await refreshUOCRA();

    expect(typeof result.updatedAt).toBe("string");
    expect(result.updatedAt.length).toBeGreaterThan(0);
  });

  it("returns success=false with error message when writeCache throws", async () => {
    mockWriteCache.mockImplementationOnce(() => {
      throw new Error("disk full");
    });

    const result = await refreshUOCRA();

    expect(result.success).toBe(false);
    expect(result.error).toContain("disk full");
  });
});

describe("refreshICC", () => {
  it("calls writeCache with icc-history and ICC data", async () => {
    const result = await refreshICC();

    expect(mockWriteCache).toHaveBeenCalledWith(
      "icc-history",
      expect.any(Array),
      "manual-refresh",
    );
    expect(result.success).toBe(true);
  });

  it("returns updatedAt ISO timestamp", async () => {
    const result = await refreshICC();

    expect(typeof result.updatedAt).toBe("string");
    expect(result.updatedAt.length).toBeGreaterThan(0);
  });

  it("returns success=false with error message when writeCache throws", async () => {
    mockWriteCache.mockImplementationOnce(() => {
      throw new Error("permission denied");
    });

    const result = await refreshICC();

    expect(result.success).toBe(false);
    expect(result.error).toContain("permission denied");
  });
});

describe("refreshManualSources", () => {
  it("returns combined result with success=true for both sources", async () => {
    const result = await refreshManualSources();

    expect(result.uocra.success).toBe(true);
    expect(result.icc.success).toBe(true);
    expect(typeof result.refreshedAt).toBe("string");
  });

  it("calls writeCache for both uocra-rates and icc-history", async () => {
    await refreshManualSources();

    const writtenNames = mockWriteCache.mock.calls.map((call) => call[0]);
    expect(writtenNames).toContain("uocra-rates");
    expect(writtenNames).toContain("icc-history");
  });
});
