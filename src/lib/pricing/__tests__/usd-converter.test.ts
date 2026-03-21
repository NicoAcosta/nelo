import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock cache-manager before importing usd-converter
vi.mock("@/lib/pricing/cache-manager", () => ({
  readCache: vi.fn(),
}));

import { readCache } from "@/lib/pricing/cache-manager";
import { getBlueRateVenta, convertToUsd } from "../usd-converter";

const mockReadCache = vi.mocked(readCache);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getBlueRateVenta", () => {
  it("returns venta from cache when cache is populated", () => {
    mockReadCache.mockReturnValue({
      data: { compra: 1405, venta: 1425, fechaActualizacion: "2026-03-21" },
      lastFetched: "2026-03-21T00:00:00Z",
      source: "dolar-api",
    });

    const venta = getBlueRateVenta();
    expect(venta).toBe(1425);
  });

  it("returns fallback 1415 when readCache returns null", () => {
    mockReadCache.mockReturnValue(null);

    const venta = getBlueRateVenta();
    expect(venta).toBe(1415);
  });
});

describe("convertToUsd", () => {
  it("converts ARS to USD by dividing and rounding", () => {
    expect(convertToUsd(1_200_000, 1425)).toBe(842);
  });

  it("returns 0 when arsAmount is 0", () => {
    expect(convertToUsd(0, 1425)).toBe(0);
  });

  it("returns 0 when blueVenta is 0 (guards against division by zero)", () => {
    expect(convertToUsd(1_200_000, 0)).toBe(0);
  });
});
