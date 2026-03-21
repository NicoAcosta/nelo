/**
 * DolarAPI Blue Rate Adapter Tests
 *
 * Tests for fetchBlueRate and getBlueVenta.
 * Mocks global fetch.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchBlueRate, getBlueVenta, type BlueRateData } from "../dolar-api";

const MOCK_RESPONSE: BlueRateData & { moneda: string; casa: string; nombre: string } = {
  moneda: "USD",
  casa: "blue",
  nombre: "Blue",
  compra: 1405,
  venta: 1425,
  fechaActualizacion: "2026-03-21T17:58:00.000Z",
};

describe("fetchBlueRate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls GET https://dolarapi.com/v1/dolares/blue", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_RESPONSE,
    });
    vi.stubGlobal("fetch", fetchSpy);

    await fetchBlueRate();

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://dolarapi.com/v1/dolares/blue",
    );
  });

  it("returns BlueRateData with compra, venta, fechaActualizacion on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_RESPONSE,
    }));

    const result = await fetchBlueRate();

    expect(result.compra).toBe(1405);
    expect(result.venta).toBe(1425);
    expect(result.fechaActualizacion).toBe("2026-03-21T17:58:00.000Z");
  });

  it("throws when response is non-200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));

    await expect(fetchBlueRate()).rejects.toThrow("DolarAPI");
  });

  it("throws with status code in message on non-200 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    }));

    await expect(fetchBlueRate()).rejects.toThrow("503");
  });
});

describe("getBlueVenta", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the venta rate (sell rate used for ARS-to-USD conversion)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_RESPONSE,
    }));

    const venta = await getBlueVenta();
    expect(venta).toBe(1425);
  });

  it("throws when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));

    await expect(getBlueVenta()).rejects.toThrow("DolarAPI");
  });
});
