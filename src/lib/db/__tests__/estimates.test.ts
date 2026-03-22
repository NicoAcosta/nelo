import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock chain for estimates table
const mockSingle = vi.fn();
const mockLimit = vi.fn(() => ({ single: mockSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEqSelect = vi.fn(() => ({ order: mockOrder, single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEqSelect }));

// Insert chain: from("estimates").insert(...).select(...).single()
const mockInsertSelectSingle = vi.fn();
const mockInsertSelect = vi.fn(() => ({ single: mockInsertSelectSingle }));
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

// Update chain: from("estimates").update(...).eq(...)
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}));

import {
  saveEstimate,
  listEstimates,
  getEstimate,
  updateEstimateLabel,
  getConversationId,
  type EstimateSummary,
  type EstimateRow,
} from "../estimates";
import type { Estimate, ProjectInputs } from "@/lib/estimate/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProjectInputs(): ProjectInputs {
  return {
    totalFloorAreaM2: 100,
    stories: 2,
    structureType: "hormigon_armado",
    roofType: "azotea_inaccesible",
    finishLevel: "medio",
    locationZone: "caba",
  };
}

function makeEstimate(totalPrice = 10_000_000): Estimate {
  return {
    pricePerM2: totalPrice / 100,
    totalPrice,
    directCost: 8_000_000,
    overheadPercent: 10,
    overheadAmount: 800_000,
    profitPercent: 12,
    profitAmount: 960_000,
    subtotalBeforeTax: 9_760_000,
    ivaPercent: 21,
    ivaAmount: 2_049_600,
    categories: [],
    totalLineItems: 0,
    activeLineItems: 0,
    confidence: "standard",
    confidenceRange: { low: -15, high: 20 },
    inputsProvided: 6,
    inputsTotal: 14,
    pricePerM2Usd: 82,
    totalPriceUsd: 8_200,
    blueRateVenta: 1220,
    blueRateDate: "2026-03-22",
    pricingLastUpdated: "2026-03-22",
    assumptions: [],
    locationZone: "caba",
    floorAreaM2: 100,
    priceBaseDate: "2026-03-22",
    iccBaseValue: 100,
    iccCurrentValue: 100,
  };
}

// ---------------------------------------------------------------------------
// saveEstimate
// ---------------------------------------------------------------------------

describe("saveEstimate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === "estimates") {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return {};
    });
  });

  it("inserts with version=1 when no existing estimates (MAX returns null)", async () => {
    // First call: select MAX(version) — returns null (no rows, PGRST116 code)
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });
    // Second call: insert.select.single — returns inserted row
    mockInsertSelectSingle.mockResolvedValueOnce({
      data: { id: "est-uuid-1", version: 1 },
      error: null,
    });

    const result = await saveEstimate({
      conversationId: "conv-uuid-1",
      projectInputs: makeProjectInputs(),
      result: makeEstimate(),
    });

    expect(result).toEqual({ id: "est-uuid-1", version: 1 });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: "conv-uuid-1",
        version: 1,
        label: null,
      })
    );
  });

  it("auto-increments version based on MAX(version) for existing estimates", async () => {
    // First call: select MAX(version) — returns existing row with version=3
    mockSingle.mockResolvedValueOnce({ data: { version: 3 }, error: null });
    // Second call: insert.select.single — returns inserted row with version=4
    mockInsertSelectSingle.mockResolvedValueOnce({
      data: { id: "est-uuid-2", version: 4 },
      error: null,
    });

    const result = await saveEstimate({
      conversationId: "conv-uuid-1",
      projectInputs: makeProjectInputs(),
      result: makeEstimate(),
    });

    expect(result).toEqual({ id: "est-uuid-2", version: 4 });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 4,
      })
    );
  });

  it("throws Error on insert failure", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });
    mockInsertSelectSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "FK violation" },
    });

    await expect(
      saveEstimate({
        conversationId: "conv-uuid-1",
        projectInputs: makeProjectInputs(),
        result: makeEstimate(),
      })
    ).rejects.toThrow("FK violation");
  });
});

// ---------------------------------------------------------------------------
// listEstimates
// ---------------------------------------------------------------------------

describe("listEstimates", () => {
  const mockListOrder = vi.fn();
  const mockListEq = vi.fn(() => ({ order: mockListOrder }));
  const mockListSelect = vi.fn(() => ({ eq: mockListEq }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === "estimates") {
        return { select: mockListSelect };
      }
      return {};
    });
  });

  it("returns EstimateSummary[] ordered newest-first", async () => {
    const estimate = makeEstimate(5_000_000);
    const rows = [
      { id: "est-2", version: 2, label: "revised", result: estimate, created_at: "2026-03-22T10:00:00Z" },
      { id: "est-1", version: 1, label: null, result: estimate, created_at: "2026-03-22T09:00:00Z" },
    ];
    mockListOrder.mockResolvedValueOnce({ data: rows, error: null });

    const result = await listEstimates("conv-uuid-1");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "est-2",
      version: 2,
      label: "revised",
      total_price: estimate.totalPrice,
      price_per_m2: estimate.pricePerM2,
      created_at: "2026-03-22T10:00:00Z",
    });
    expect(mockListSelect).toHaveBeenCalledWith(
      "id, version, label, result, created_at"
    );
    expect(mockListOrder).toHaveBeenCalledWith("version", { ascending: false });
  });

  it("returns [] when no estimates exist", async () => {
    mockListOrder.mockResolvedValueOnce({ data: [], error: null });

    const result = await listEstimates("conv-uuid-1");
    expect(result).toEqual([]);
  });

  it("returns [] when data is null", async () => {
    mockListOrder.mockResolvedValueOnce({ data: null, error: null });

    const result = await listEstimates("conv-uuid-1");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getEstimate
// ---------------------------------------------------------------------------

describe("getEstimate", () => {
  const mockGetSingle = vi.fn();
  const mockGetEq = vi.fn(() => ({ single: mockGetSingle }));
  const mockGetSelect = vi.fn(() => ({ eq: mockGetEq }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === "estimates") {
        return { select: mockGetSelect };
      }
      return {};
    });
  });

  it("returns EstimateRow on success", async () => {
    const estimate = makeEstimate();
    const inputs = makeProjectInputs();
    const row: EstimateRow = {
      id: "est-uuid-1",
      version: 1,
      label: null,
      project_inputs: inputs,
      result: estimate,
      created_at: "2026-03-22T09:00:00Z",
    };
    mockGetSingle.mockResolvedValueOnce({ data: row, error: null });

    const result = await getEstimate("est-uuid-1");
    expect(result).toEqual(row);
    expect(mockGetSelect).toHaveBeenCalledWith(
      "id, version, label, project_inputs, result, created_at"
    );
  });

  it("returns null when no estimate found (PGRST116)", async () => {
    mockGetSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });

    const result = await getEstimate("nonexistent-id");
    expect(result).toBeNull();
  });

  it("returns null when data is null and no error", async () => {
    mockGetSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await getEstimate("est-uuid-1");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateEstimateLabel
// ---------------------------------------------------------------------------

describe("updateEstimateLabel", () => {
  const mockLabelEq = vi.fn();
  const mockLabelUpdate = vi.fn(() => ({ eq: mockLabelEq }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === "estimates") {
        return { update: mockLabelUpdate };
      }
      return {};
    });
  });

  it("calls update with label and eq with estimateId", async () => {
    mockLabelEq.mockResolvedValueOnce({ error: null });

    await updateEstimateLabel("est-uuid-1", "My custom label");
    expect(mockLabelUpdate).toHaveBeenCalledWith({ label: "My custom label" });
    expect(mockLabelEq).toHaveBeenCalledWith("id", "est-uuid-1");
  });

  it("throws on update failure", async () => {
    mockLabelEq.mockResolvedValueOnce({ error: { message: "Update failed" } });

    await expect(
      updateEstimateLabel("est-uuid-1", "label")
    ).rejects.toThrow("Update failed");
  });
});

// ---------------------------------------------------------------------------
// getConversationId
// ---------------------------------------------------------------------------

describe("getConversationId", () => {
  const mockConvSingle = vi.fn();
  const mockConvEq = vi.fn(() => ({ single: mockConvSingle }));
  const mockConvSelect = vi.fn(() => ({ eq: mockConvEq }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === "conversations") {
        return { select: mockConvSelect };
      }
      return {};
    });
  });

  it("returns conversation UUID when project has a conversation", async () => {
    mockConvSingle.mockResolvedValueOnce({
      data: { id: "conv-uuid-1" },
      error: null,
    });

    const result = await getConversationId("proj-uuid-1");
    expect(result).toBe("conv-uuid-1");
    expect(mockConvSelect).toHaveBeenCalledWith("id");
    expect(mockConvEq).toHaveBeenCalledWith("project_id", "proj-uuid-1");
  });

  it("returns null when no conversation exists (PGRST116)", async () => {
    mockConvSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    const result = await getConversationId("proj-uuid-1");
    expect(result).toBeNull();
  });

  it("returns null when data is null", async () => {
    mockConvSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await getConversationId("proj-uuid-1");
    expect(result).toBeNull();
  });
});
