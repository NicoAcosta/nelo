/**
 * Tests for refreshDynamicSources() — verifies blue rate and MercadoLibre refresh behavior.
 *
 * Key invariants:
 * - refreshDynamicSources() writes blue-rate and mercadolibre caches
 * - refreshDynamicSources() NEVER writes manual-overrides
 * - Partial failures are reported per-source without throwing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BlueRateData } from "../dolar-api";
import type { MaterialSearchResult } from "../mercadolibre";

// Mock all data sources and cache manager before importing the module under test
vi.mock("../dolar-api", () => ({
  fetchBlueRate: vi.fn(),
}));

vi.mock("../mercadolibre", () => ({
  fetchAllTrackedPrices: vi.fn(),
}));

vi.mock("@/lib/pricing/cache-manager", () => ({
  writeCache: vi.fn(),
}));

import { refreshDynamicSources } from "../refresh-all";
import { fetchBlueRate } from "../dolar-api";
import { fetchAllTrackedPrices } from "../mercadolibre";
import { writeCache } from "@/lib/pricing/cache-manager";

const mockFetchBlueRate = vi.mocked(fetchBlueRate);
const mockFetchAllTrackedPrices = vi.mocked(fetchAllTrackedPrices);
const mockWriteCache = vi.mocked(writeCache);

const MOCK_BLUE_RATE: BlueRateData = {
  compra: 1405,
  venta: 1425,
  fechaActualizacion: "2026-03-21T08:00:00Z",
};

const MOCK_MELI_PRICES: Record<string, MaterialSearchResult> = {
  cement_50kg: {
    query: "cemite portland 50kg",
    results: [],
    medianPrice: 12000,
    minPrice: 11000,
    maxPrice: 13000,
    sampleSize: 5,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchBlueRate.mockResolvedValue(MOCK_BLUE_RATE);
  mockFetchAllTrackedPrices.mockResolvedValue(MOCK_MELI_PRICES);
});

describe("refreshDynamicSources", () => {
  it("calls writeCache with blue-rate data", async () => {
    await refreshDynamicSources();

    expect(mockWriteCache).toHaveBeenCalledWith(
      "blue-rate",
      MOCK_BLUE_RATE,
      "dolar-api",
    );
  });

  it("calls writeCache with mercadolibre data", async () => {
    await refreshDynamicSources();

    expect(mockWriteCache).toHaveBeenCalledWith(
      "mercadolibre",
      MOCK_MELI_PRICES,
      "mercadolibre-api",
    );
  });

  it("does NOT call writeCache for manual-overrides", async () => {
    await refreshDynamicSources();

    const writtenNames = mockWriteCache.mock.calls.map((call) => call[0]);
    expect(writtenNames).not.toContain("manual-overrides");
    expect(writtenNames).not.toContain("manual-overrides.json");
  });

  it("returns RefreshResult with success=true for both sources when all fetches succeed", async () => {
    const result = await refreshDynamicSources();

    expect(result.blueRate.success).toBe(true);
    expect(result.mercadolibre.success).toBe(true);
    expect(typeof result.refreshedAt).toBe("string");
    expect(result.refreshedAt.length).toBeGreaterThan(0);
  });

  it("returns blueRate failure when fetchBlueRate throws, mercadolibre still succeeds", async () => {
    mockFetchBlueRate.mockRejectedValue(new Error("DolarAPI fetch failed: 503"));

    const result = await refreshDynamicSources();

    expect(result.blueRate.success).toBe(false);
    expect(result.blueRate.error).toContain("DolarAPI fetch failed");
    expect(result.mercadolibre.success).toBe(true);
  });

  it("returns mercadolibre failure when fetchAllTrackedPrices throws, blueRate still succeeds", async () => {
    mockFetchAllTrackedPrices.mockRejectedValue(
      new Error("MercadoLibre search failed: 429"),
    );

    const result = await refreshDynamicSources();

    expect(result.blueRate.success).toBe(true);
    expect(result.mercadolibre.success).toBe(false);
    expect(result.mercadolibre.error).toContain("MercadoLibre search failed");
  });

  it("does not write blue-rate cache when fetchBlueRate fails", async () => {
    mockFetchBlueRate.mockRejectedValue(new Error("network error"));

    await refreshDynamicSources();

    const blueRateCalls = mockWriteCache.mock.calls.filter(
      (call) => call[0] === "blue-rate",
    );
    expect(blueRateCalls).toHaveLength(0);
  });
});
